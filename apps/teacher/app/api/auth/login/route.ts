import {
  apiError,
  db,
  enforce,
  handle,
  identityFrom,
  normalizeEmail,
  readJson,
  requireFields,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
} from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

interface Body {
  email: string;
  password: string;
}

/** POST /api/auth/login */
export function POST(req: Request) {
  return handle(async () => {
    // 04번 §K — 10회 / 10분 / IP. 무차별 대입을 막는다.
    enforce('login', identityFrom(req));

    const body = await readJson<Body>(req);
    requireFields(body, ['email', 'password']);

    const teacher = await db().teacher.findUnique({
      where: { email: normalizeEmail(body.email) },
      select: { id: true, email: true, name: true, passwordHash: true, billingStatus: true },
    });

    // 계정 존재 여부가 응답으로 갈리면 이메일 열거가 가능해진다. 둘 다 같은 메시지를 준다.
    const ok = teacher ? await verifyPassword(body.password, teacher.passwordHash) : false;
    if (!teacher || !ok) {
      throw apiError('UNAUTHENTICATED', '이메일 또는 비밀번호가 맞지 않습니다');
    }

    const claims = { teacherId: String(teacher.id), email: teacher.email };

    return {
      teacher: {
        id: String(teacher.id),
        email: teacher.email,
        name: teacher.name,
        billingStatus: teacher.billingStatus,
      },
      access: await signAccessToken(claims),
      refresh: await signRefreshToken(claims),
    };
  });
}
