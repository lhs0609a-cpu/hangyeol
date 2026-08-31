import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { argon2id, argon2Verify } from 'hash-wasm';

/**
 * 09번 문서 §4 — 학생 이메일은 평문으로 저장하지 않는다.
 *
 *   email_hash = sha256(lower(email) || pepper)   조회·중복판정용
 *   email_enc  = AES-256-GCM                      표시·발송용
 *
 * 해시만 두면 학생에게 메일을 못 보내고, 암호화만 두면 중복 판정에
 * 전건 복호화가 필요하다. 그래서 둘 다 둔다.
 */

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 같은 이메일은 항상 같은 해시가 나와야 한다. 대소문자·공백을 먼저 없앤다. */
export function hashEmail(email: string): string {
  const pepper = requireEnv('EMAIL_HASH_PEPPER');
  return createHash('sha256').update(`${normalizeEmail(email)}${pepper}`).digest('hex');
}

function encKey(): Buffer {
  const raw = requireEnv('EMAIL_ENC_KEY').replace(/^base64:/, '');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('EMAIL_ENC_KEY must decode to 32 bytes (AES-256)');
  }
  return key;
}

/** 저장 형식: [12바이트 IV][16바이트 auth tag][암호문] */
export function encryptEmail(email: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encKey(), iv);
  const body = Buffer.concat([cipher.update(normalizeEmail(email), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

export function decryptEmail(blob: Buffer | Uint8Array): string {
  const buf = Buffer.from(blob);
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const body = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', encKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
}

/**
 * 강사 비밀번호 — 09번 문서가 지정한 Argon2id.
 * hash-wasm 을 쓰는 이유는 네이티브 빌드가 없어 Vercel 에서 그대로 돈다는 것.
 */
const ARGON2_PARAMS = { parallelism: 1, iterations: 3, memorySize: 19456, hashLength: 32 };

export const MIN_PASSWORD_LENGTH = 10;

export async function hashPassword(password: string): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return argon2id({
    password,
    salt: randomBytes(16),
    ...ARGON2_PARAMS,
    outputType: 'encoded',
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify({ password, hash });
  } catch {
    return false;
  }
}

/** 매직링크·서명 URL 토큰. URL 안전 문자만 쓴다. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** IP·UA 는 원본을 남기지 않는다. 열람 로그에는 해시만 들어간다. */
export function fingerprint(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

/** 토큰 비교는 길이 노출 없이 상수 시간으로. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
