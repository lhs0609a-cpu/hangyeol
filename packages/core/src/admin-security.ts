import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';

/**
 * 09번 문서 §6 — "관리자 계정 2FA 필수" · IP 화이트리스트.
 *
 * 그동안 관리자 게이트는 `ADMIN_EMAILS` 하나였다. 이메일 허용목록은
 * 계정이 탈취돼도 권한이 따라오지 않는다는 장점이 있지만,
 * 비밀번호가 새면 그대로 뚫린다 — 관리자 화면에는 다른 강사의 가입 신청서와
 * 승인 버튼, 그리고 정산 송금 기록이 있다.
 *
 * 그래서 두 겹을 더 얹는다.
 *
 *   1. IP 허용목록  — 설정돼 있으면 목록 밖 요청은 관리자 화면의 존재조차 모른다
 *   2. TOTP 2단계   — 로그인과 별개로 30초 코드를 한 번 더 받는다(승급 세션)
 *
 * 왜 TOTP 인가: 문자·이메일 OTP 는 발송 경로(통신사·메일 제공자)가 하나 더 늘고,
 * 그 경로가 우리 손 밖이다. TOTP 는 서버가 공유 비밀만 들고 있으면 되고
 * 외부 호출이 0 건이다 — 10번 문서가 금지한 종량과금이 생기지 않는다.
 *
 * 구현은 RFC 6238(TOTP) · RFC 4648(Base32) 를 직접 따른다.
 * 라이브러리를 넣지 않은 이유는 storage.ts 가 S3 서명을 직접 쓰는 이유와 같다 —
 * 30줄짜리 표준 알고리즘에 의존성을 하나 더 매달 이유가 없다.
 */

// ────────────────────────────────────────────────────────────
// Base32 (RFC 4648) — 인증 앱이 읽는 표기
// ────────────────────────────────────────────────────────────

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];

  // 패딩(=)은 붙이지 않는다. otpauth URI 에 그대로 들어가는 값이라
  // 패딩이 있으면 앱마다 처리가 갈린다.
  return out;
}

export function base32Decode(input: string): Uint8Array {
  // 사람이 손으로 옮겨 적는 값이다. 공백·하이픈·소문자·패딩을 모두 받아 준다.
  const clean = input.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase();

  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('base32: invalid character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

// ────────────────────────────────────────────────────────────
// TOTP (RFC 6238)
// ────────────────────────────────────────────────────────────

/** 30초. 거의 모든 인증 앱의 기본값이고, 바꾸면 사용자가 알 방법이 없다. */
export const TOTP_STEP_SEC = 30;
export const TOTP_DIGITS = 6;

/**
 * 앞뒤 한 칸(±30초)까지 받는다.
 *
 * 0 으로 두면 기기 시계가 몇 초만 밀려도 로그인이 안 되고,
 * 2 이상은 코드 하나의 유효 시간이 2분을 넘어 재사용 창이 길어진다.
 */
export const TOTP_WINDOW = 1;

export function totpSecret(): string {
  // 20바이트 = SHA-1 블록 크기. RFC 4226 권장값이다.
  return base32Encode(randomBytes(20));
}

export function currentStep(now: Date | number = Date.now()): bigint {
  const ms = typeof now === 'number' ? now : now.getTime();
  return BigInt(Math.floor(ms / 1000 / TOTP_STEP_SEC));
}

function hotp(secret: Uint8Array, counter: bigint): string {
  const counterBytes = Buffer.alloc(8);
  counterBytes.writeBigUInt64BE(counter);

  const mac = createHmac('sha1', Buffer.from(secret)).update(counterBytes).digest();

  // 동적 절단 — RFC 4226 §5.3.
  const offset = mac[mac.length - 1]! & 0x0f;
  const binary =
    ((mac[offset]! & 0x7f) << 24) |
    (mac[offset + 1]! << 16) |
    (mac[offset + 2]! << 8) |
    mac[offset + 3]!;

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

export function totpCode(secretBase32: string, step: bigint): string {
  return hotp(base32Decode(secretBase32), step);
}

/**
 * 코드가 맞으면 **어느 칸의 코드였는지**를 돌려준다.
 *
 * boolean 이 아니라 step 을 돌려주는 이유는 재사용 차단 때문이다.
 * 같은 코드를 두 번 받으면 화면 뒤에서 훔쳐본 사람도 한 번은 들어올 수 있다.
 * 호출부가 "직전에 쓴 step 보다 큰가" 를 DB 로 확인한다.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  now: Date | number = Date.now(),
): bigint | null {
  const candidate = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(candidate)) return null;

  const center = currentStep(now);

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    const step = center + BigInt(offset);
    const expected = totpCode(secretBase32, step);
    // 코드 비교도 상수 시간으로. 길이가 같으니 timingSafeEqual 이 그대로 쓰인다.
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(candidate))) return step;
  }
  return null;
}

/** 인증 앱이 QR 로 읽는 문자열. 라벨에 계정이 보여야 앱에서 구분된다. */
export function otpauthUri(email: string, secretBase32: string, issuer = '사맛 관리자'): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SEC),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// ────────────────────────────────────────────────────────────
// IP 허용목록
// ────────────────────────────────────────────────────────────

interface IpBits {
  value: bigint;
  width: 32 | 128;
}

function ipv4ToBits(ip: string): IpBits | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  let value = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    value = (value << 8n) | BigInt(n);
  }
  return { value, width: 32 };
}

function ipv6ToBits(ip: string): IpBits | null {
  // ::ffff:1.2.3.4 는 IPv4 다. 프록시가 이 표기로 넘기는 환경이 있다.
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped?.[1]) return ipv4ToBits(mapped[1]);

  const halves = ip.split('::');
  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves[1] ? halves[1].split(':') : [];
  if (halves.length === 1 && head.length !== 8) return null;

  const fill = 8 - head.length - tail.length;
  if (fill < 0) return null;

  const groups = [...head, ...Array<string>(halves.length === 2 ? fill : 0).fill('0'), ...tail];
  if (groups.length !== 8) return null;

  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
    value = (value << 16n) | BigInt(parseInt(group, 16));
  }
  return { value, width: 128 };
}

function toBits(ip: string): IpBits | null {
  const trimmed = ip.trim().replace(/^\[|\]$/g, '');
  if (!trimmed) return null;
  return trimmed.includes(':') ? ipv6ToBits(trimmed) : ipv4ToBits(trimmed);
}

export interface IpRule {
  bits: IpBits;
  prefix: number;
}

/** `203.0.113.7, 198.51.100.0/24, 2001:db8::/32` 형태를 규칙으로 바꾼다. */
export function parseIpAllowlist(raw: string | undefined | null): IpRule[] {
  const rules: IpRule[] = [];

  for (const entry of (raw ?? '').split(',')) {
    const item = entry.trim();
    if (!item) continue;

    const [address, mask] = item.split('/');
    const bits = toBits(address ?? '');
    if (!bits) {
      // 오타 하나 때문에 목록 전체가 조용히 무력화되면 안 된다. 남기고 건너뛴다.
      console.error('[admin] ADMIN_IP_ALLOWLIST 에 읽을 수 없는 항목이 있다:', item);
      continue;
    }

    const prefix = mask === undefined ? bits.width : Number(mask);
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > bits.width) {
      console.error('[admin] ADMIN_IP_ALLOWLIST 의 프리픽스가 범위를 벗어났다:', item);
      continue;
    }
    rules.push({ bits, prefix });
  }
  return rules;
}

export function ipMatches(ip: string | null | undefined, rules: IpRule[]): boolean {
  if (rules.length === 0) return false;

  const addr = ip ? toBits(ip) : null;
  if (!addr) return false;

  return rules.some((rule) => {
    if (rule.bits.width !== addr.width) return false;
    const shift = BigInt(addr.width - rule.prefix);
    return addr.value >> shift === rule.bits.value >> shift;
  });
}

// ────────────────────────────────────────────────────────────
// 승급 세션 — 2FA 를 통과한 상태를 짧게 들고 있는다
// ────────────────────────────────────────────────────────────

export const ADMIN_COOKIE = 'hg_admin';

/**
 * 2시간.
 *
 * 로그인 세션(30분 access + 30일 refresh)과 따로 둔다. 관리자 화면은
 * 하루 종일 열어 두는 화면이 아니고, 자리를 비운 사이 열려 있으면 안 된다.
 * 대신 매 요청마다 코드를 묻지도 않는다 — 그러면 아무도 쓰지 않고,
 * 쓰지 않는 보안 장치는 결국 꺼진다.
 */
export const ADMIN_STEP_UP_TTL_SEC = 2 * 60 * 60;

function stepUpKey(): Uint8Array {
  const v = process.env.JWT_ACCESS_SECRET;
  if (!v) throw new Error('JWT_ACCESS_SECRET is not set');
  return new TextEncoder().encode(v);
}

export function signAdminStepUp(teacherId: string): Promise<string> {
  return new SignJWT({ teacherId, typ: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(teacherId)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_STEP_UP_TTL_SEC}s`)
    .sign(stepUpKey());
}

/** 승급 토큰이 **이 강사의 것**인지까지 본다. 다른 관리자의 쿠키는 통하지 않는다. */
export async function verifyAdminStepUp(token: string, teacherId: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, stepUpKey());
    return payload.typ === 'admin' && String(payload.teacherId) === teacherId;
  } catch {
    return false;
  }
}

export function adminCookieFrom(req: Request): string | null {
  const raw = req.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === ADMIN_COOKIE) {
      const token = v.join('=').trim();
      if (token) return token;
    }
  }
  return null;
}

/*
 * 시크릿 보관에 대하여.
 *
 * TOTP 시크릿은 그 자체가 두 번째 인증수단이다. DB 덤프 하나로 2FA 가
 * 통째로 무력화되면 얹은 의미가 없다. 그래서 학생 이메일과 같은 방식으로
 * AES-256-GCM 으로 싸서 넣는다 — crypto.ts 의 encryptSecret/decryptSecret.
 *
 * 키는 EMAIL_ENC_KEY 를 함께 쓴다. 키를 하나 더 만들면 회전 절차가 둘이 되고,
 * 둘이 되면 한쪽이 반드시 뒤처진다.
 */
