import {
  apiError,
  db,
  enforce,
  handle,
  identityFrom,
  json,
  normalizeEmail,
  readJson,
  requireFields,
  sessionCookie,
  signAccessToken,
  signRefreshToken,
  TEACHER_COOKIE,
  TEACHER_REFRESH_COOKIE,
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
    const access = await signAccessToken(claims);
    const refresh = await signRefreshToken(claims);

    /*
     * 쿠키로 내려보낸다. 응답 본문에도 남기는 이유는 기존 클라이언트가
     * 아직 헤더 방식을 쓰기 때문이다 — 그쪽이 정리되면 본문에서 뺀다.
     */
    const headers = new Headers();
    // 30분. 만료되면 refresh 로 갱신한다.
    headers.append('set-cookie', sessionCookie(TEACHER_COOKIE, access, 30 * 60));
    // 30일.
    headers.append(
      'set-cookie',
      sessionCookie(TEACHER_REFRESH_COOKIE, refresh, 30 * 24 * 60 * 60),
    );

    return json(
      {
        teacher: {
          id: String(teacher.id),
          email: teacher.email,
          name: teacher.name,
          billingStatus: teacher.billingStatus,
        },
        access,
        refresh,
      },
      { headers },
    );
  });
}
