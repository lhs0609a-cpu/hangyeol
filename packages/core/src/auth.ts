import { jwtVerify, SignJWT } from 'jose';
import { apiError } from './errors.js';

/**
 * 09번 문서 §6 인증 규격.
 *
 *   강사  JWT — access 30분 / refresh 30일, 회전
 *   학생  매직링크만. 비밀번호 없음. 링크 TTL 15분, 1회용, 세션 30일
 */

export const ACCESS_TTL_SEC = 30 * 60;
export const REFRESH_TTL_SEC = 30 * 24 * 60 * 60;
export const MAGIC_LINK_TTL_SEC = 15 * 60;
export const STUDENT_SESSION_TTL_SEC = 30 * 24 * 60 * 60;

type Secret = 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET' | 'MAGIC_LINK_SECRET';

function key(name: Secret): Uint8Array {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return new TextEncoder().encode(v);
}

export interface TeacherClaims {
  teacherId: string;
  email: string;
}

export interface StudentClaims {
  studentId: string;
  teacherId: string;
}

async function sign(
  payload: Record<string, unknown>,
  secret: Secret,
  ttlSec: number,
  subject: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .sign(key(secret));
}

export function signAccessToken(claims: TeacherClaims): Promise<string> {
  return sign({ ...claims, typ: 'access' }, 'JWT_ACCESS_SECRET', ACCESS_TTL_SEC, claims.teacherId);
}

export function signRefreshToken(claims: TeacherClaims): Promise<string> {
  return sign({ ...claims, typ: 'refresh' }, 'JWT_REFRESH_SECRET', REFRESH_TTL_SEC, claims.teacherId);
}

export async function verifyAccessToken(token: string): Promise<TeacherClaims> {
  try {
    const { payload } = await jwtVerify(token, key('JWT_ACCESS_SECRET'));
    if (payload.typ !== 'access') throw new Error('wrong token type');
    return { teacherId: String(payload.teacherId), email: String(payload.email) };
  } catch {
    throw apiError('UNAUTHENTICATED');
  }
}

export async function verifyRefreshToken(token: string): Promise<TeacherClaims> {
  try {
    const { payload } = await jwtVerify(token, key('JWT_REFRESH_SECRET'));
    if (payload.typ !== 'refresh') throw new Error('wrong token type');
    return { teacherId: String(payload.teacherId), email: String(payload.email) };
  } catch {
    throw apiError('UNAUTHENTICATED');
  }
}

/**
 * 학생 매직링크. 비밀번호가 없으므로 이 링크가 곧 신원이다.
 * TTL 15분, 그리고 1회용 — 사용 여부는 students.verified_at 으로 판정한다.
 */
export function signMagicLink(claims: StudentClaims): Promise<string> {
  return sign({ ...claims, typ: 'magic' }, 'MAGIC_LINK_SECRET', MAGIC_LINK_TTL_SEC, claims.studentId);
}

/** 인증을 마친 학생의 세션 쿠키. 30일. */
export function signStudentSession(claims: StudentClaims): Promise<string> {
  return sign({ ...claims, typ: 'session' }, 'MAGIC_LINK_SECRET', STUDENT_SESSION_TTL_SEC, claims.studentId);
}

export async function verifyStudentToken(
  token: string,
  expect: 'magic' | 'session',
): Promise<StudentClaims> {
  try {
    const { payload } = await jwtVerify(token, key('MAGIC_LINK_SECRET'));
    if (payload.typ !== expect) throw new Error('wrong token type');
    return { studentId: String(payload.studentId), teacherId: String(payload.teacherId) };
  } catch {
    throw apiError('UNAUTHENTICATED');
  }
}

/** Authorization: Bearer <token> 에서 토큰만 뽑는다. */
export function bearer(header: string | null | undefined): string {
  const value = header?.trim() ?? '';
  if (!value.toLowerCase().startsWith('bearer ')) throw apiError('UNAUTHENTICATED');
  const token = value.slice(7).trim();
  if (!token) throw apiError('UNAUTHENTICATED');
  return token;
}

export const STUDENT_COOKIE = 'hg_note';

/*
 * 강사 세션 쿠키.
 *
 * 토큰을 localStorage 에 두면 서버가 요청자를 알 수 없다.
 * 서버 컴포넌트도, 미들웨어도 localStorage 를 못 읽기 때문이다.
 * 그래서 화면은 로그인 여부와 무관하게 렌더되고, 데이터는
 * "첫 번째 강사" 를 집어 오게 된다 — 프로그램이 아니라 데모가 된다.
 *
 * HttpOnly 쿠키로 옮기면 세 가지가 한 번에 풀린다.
 *   · 미들웨어가 로그인 여부를 보고 막을 수 있다
 *   · 서버 컴포넌트가 누구의 데이터인지 안다
 *   · XSS 로 토큰을 훔칠 수 없다 (09번 문서의 최종 형태)
 */
export const TEACHER_COOKIE = 'hg_access';
export const TEACHER_REFRESH_COOKIE = 'hg_refresh';

/** 요청에서 강사 세션을 꺼낸다. Authorization 헤더도 받는다 — 외부 호출용. */
export function sessionToken(req: Request): string {
  const header = req.headers.get('authorization');
  if (header?.toLowerCase().startsWith('bearer ')) return bearer(header);

  const raw = req.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === TEACHER_COOKIE) {
      const token = v.join('=').trim();
      if (token) return token;
    }
  }
  throw apiError('UNAUTHENTICATED');
}

/**
 * Set-Cookie 값. Secure 는 프로덕션에서만 붙인다 —
 * localhost 는 http 라 Secure 를 붙이면 쿠키가 저장되지 않는다.
 */
export function sessionCookie(name: string, token: string, maxAgeSec: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  // Lax 면 외부 링크로 들어와도 세션이 유지되고, CSRF 는 막힌다.
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

export function clearCookie(name: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
