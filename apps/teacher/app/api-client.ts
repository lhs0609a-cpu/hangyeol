'use client';

/*
 * 브라우저에서 API 를 부르는 얇은 층.
 *
 * 토큰을 localStorage 에 두는 것은 XSS 에 약하다. 09번 문서가 요구하는
 * 최종 형태는 HttpOnly 쿠키다. 지금은 강사 앱이 단일 배포라 세션 쿠키로
 * 옮기는 게 맞고, 그 전환은 S7(결제) 전에 끝낸다.
 * 그때까지의 임시 저장소임을 여기 적어 둔다.
 */

const TOKEN_KEY = 'hg_access';

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export interface ApiFailure {
  code: string;
  message: string;
  detail?: Record<string, unknown>;
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, failure: ApiFailure) {
    super(failure.message);
    this.name = 'ApiClientError';
    this.code = failure.code;
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const failure: ApiFailure = body?.error ?? { code: 'INTERNAL', message: '처리하지 못했습니다' };
    throw new ApiClientError(res.status, failure);
  }

  return body as T;
}

export const get = <T,>(path: string) => api<T>(path);
export const post = <T,>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export const patch = <T,>(path: string, body: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
