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
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        billingStatus: true,
        approvalStatus: true,
        rejectedReason: true,
      },
    });

    // 계정 존재 여부가 응답으로 갈리면 이메일 열거가 가능해진다. 둘 다 같은 메시지를 준다.
    const ok = teacher ? await verifyPassword(body.password, teacher.passwordHash) : false;
    if (!teacher || !ok) {
      throw apiError('UNAUTHENTICATED', '이메일 또는 비밀번호가 맞지 않습니다');
    }

    /*
     * 승인 게이트. 비밀번호를 맞힌 뒤에 본다 — 순서가 반대면
     * 아무 이메일이나 넣어 가입 여부를 알아낼 수 있다.
     *
     * 토큰을 아예 발급하지 않는다. 발급하고 화면에서 가리는 방식은
     * API 를 직접 부르면 뚫린다.
     */
    if (teacher.approvalStatus !== 'approved') {
      throw apiError(
        'TEACHER_NOT_APPROVED',
        teacher.approvalStatus === 'rejected'
          ? teacher.rejectedReason || '신청이 승인되지 않았습니다. 문의해 주세요'
          : '아직 승인 전이에요. 확인이 끝나면 이메일로 알려 드릴게요',
      );
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
