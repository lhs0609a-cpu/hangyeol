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
} from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

interface Body {
  email: string;
  password: string;
  name: string;
  /** 어디서 가르치는지·왜 신청하는지. 승인 판단의 유일한 근거다. */
  applyNote?: string;
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
        applyNote: body.applyNote?.slice(0, 1000) ?? null,
        // 기본값이 pending 이다. 스키마에도 박혀 있지만 여기서도 명시한다 —
        // 이 한 줄이 빠지면 승인제 전체가 무력해진다.
        approvalStatus: 'pending',
      },
      select: { id: true, email: true, name: true },
    });

    /*
     * 토큰을 주지 않는다.
     *
     * 가입 즉시 로그인시키면 승인제가 이름만 남는다. 관리자가 승인해야
     * 처음으로 토큰이 나간다. 그때까지 강사는 신청 완료 화면만 본다.
     */
    return json(
      {
        teacher: { id: String(teacher.id), email: teacher.email, name: teacher.name },
        approvalStatus: 'pending',
      },
      { status: 201 },
    );
  });
}
