'use client';

/*
 * 브라우저에서 API 를 부르는 얇은 층.
 *
 * 세션은 HttpOnly 쿠키에 있다(09번 문서의 최종 형태).
 * 그래서 여기서 토큰을 들고 다니지 않는다 — JS 가 읽을 수 없고,
 * 읽을 필요도 없다. fetch 가 같은 출처 쿠키를 자동으로 붙인다.
 *
 * localStorage 를 쓰던 때는 서버가 요청자를 알 수 없었다.
 * 서버 컴포넌트도 미들웨어도 localStorage 를 못 읽기 때문이다.
 */

/** 예전 localStorage 잔재를 지운다. 남아 있어도 쓰이지 않지만 헷갈린다. */
export function clearLegacyToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('hg_access');
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
  const res = await fetch(path, {
    ...init,
    // 세션 쿠키를 붙인다. 같은 출처라 기본값으로도 가지만 명시해 둔다.
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const failure: ApiFailure = body?.error ?? { code: 'INTERNAL', message: '처리하지 못했습니다' };

    /*
     * 세션이 끊겼으면 로그인으로 보낸다. 화면마다 처리하면 반드시 빠뜨리고,
     * 그러면 "아무것도 안 보이는데 이유를 모르는" 상태가 된다.
     */
    if (res.status === 401 && typeof window !== 'undefined') {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    }

    throw new ApiClientError(res.status, failure);
  }

  return body as T;
}

export const get = <T,>(path: string) => api<T>(path);
export const post = <T,>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export const patch = <T,>(path: string, body: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
