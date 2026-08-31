import {
  apiError,
  db,
  handle,
  hashPassword,
  json,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  readJson,
  requireFields,
  signAccessToken,
  signRefreshToken,
} from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

interface Body {
  email: string;
  password: string;
  name: string;
}

/** POST /api/auth/signup — 04번 문서 A. */
export function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<Body>(req);
    requireFields(body, ['email', 'password', 'name']);

    if (body.password.length < MIN_PASSWORD_LENGTH) {
      throw apiError('VALIDATION_FAILED', `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다`);
    }

    const prisma = db();
    const email = normalizeEmail(body.email);

    const existing = await prisma.teacher.findUnique({ where: { email } });
    if (existing) throw apiError('VALIDATION_FAILED', '이미 가입된 이메일입니다. 로그인해 주세요');

    const teacher = await prisma.teacher.create({
      data: {
        email,
        passwordHash: await hashPassword(body.password),
        name: body.name,
        // 시급 미입력 상태의 기본 티어. 03번 문서.
        rateTier: 'B',
      },
      select: { id: true, email: true, name: true },
    });

    const claims = { teacherId: String(teacher.id), email: teacher.email };

    return json(
      {
        teacher: { id: String(teacher.id), email: teacher.email, name: teacher.name },
        access: await signAccessToken(claims),
        refresh: await signRefreshToken(claims),
      },
      { status: 201 },
    );
  });
}
