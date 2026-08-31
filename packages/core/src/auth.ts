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
