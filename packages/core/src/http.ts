import { ApiError, apiError } from './errors.js';

/**
 * 라우트 핸들러 공통 껍데기.
 *
 * 핸들러마다 try/catch 를 쓰면 언젠가 하나가 빠지고, 그 자리에서
 * 스택트레이스가 그대로 나간다. 그래서 감싸는 함수를 하나만 둔다.
 */

/** BigInt 는 JSON.stringify 에서 터진다. 문자열로 내보낸다. */
function replacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

export function json(body: unknown, init?: ResponseInit): Response {
  /*
   * Headers 로 만든다. 객체 스프레드로 합치면 같은 이름의 헤더가 덮인다 —
   * set-cookie 를 두 개(access, refresh) 내려보낼 때 하나가 조용히 사라진다.
   * Headers 는 append 로 같은 이름을 여러 번 담을 수 있다.
   */
  const headers = new Headers(init?.headers);
  headers.set('content-type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(body, replacer), { ...init, headers });
}

export function handle(fn: () => Promise<unknown>): Promise<Response> {
  return fn()
    .then((body) => (body instanceof Response ? body : json(body)))
    .catch((err: unknown) => {
      if (err instanceof ApiError) {
        return json(err.toBody(), { status: err.status });
      }
      // 예기치 못한 오류의 내부 정보는 밖으로 내보내지 않는다.
      console.error('[api]', err);
      const wrapped = apiError('INTERNAL', '처리하지 못했습니다. 다시 시도해 주세요');
      return json(wrapped.toBody(), { status: wrapped.status });
    });
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw apiError('VALIDATION_FAILED', '요청 본문을 읽을 수 없습니다');
  }
}

// interface 는 index signature 가 없어서 Record<string, unknown> 에 대입되지 않는다.
// 호출부마다 타입을 바꾸는 대신 여기서 object 로 받는다.
export function requireFields<T extends object>(body: T, fields: (keyof T)[]): void {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    throw apiError('VALIDATION_FAILED', `필수 항목이 비어 있습니다: ${missing.join(', ')}`);
  }
}

export function clientIp(req: Request): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}
