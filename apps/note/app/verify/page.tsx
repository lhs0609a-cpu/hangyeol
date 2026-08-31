import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  signStudentSession,
  STUDENT_COOKIE,
  STUDENT_SESSION_TTL_SEC,
  verifyStudent,
  verifyStudentToken,
} from '@hangyeol/core';

export const dynamic = 'force-dynamic';

export const metadata = { title: '학습 노트' };

/**
 * 매직링크 착지점 — 02번 문서 D-02.
 *
 * 학생에게는 비밀번호가 없다. 이 링크가 곧 신원이다.
 * 클릭하는 순간 verified_at 이 찍히고 student_activity(kind='verify') 가 남는다.
 * 그 기록이 과금 활성판정 (B) 조건의 첫 근거가 된다.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { t?: string };
}) {
  const token = searchParams.t;

  if (!token) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--ink-3)' }}>
        링크가 올바르지 않습니다. 선생님께 다시 요청해 주세요
      </div>
    );
  }

  try {
    const claims = await verifyStudentToken(token, 'magic');
    await verifyStudent(BigInt(claims.studentId));

    cookies().set(STUDENT_COOKIE, await signStudentSession(claims), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: STUDENT_SESSION_TTL_SEC,
    });
  } catch {
    return (
      <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--ink-3)' }}>
        링크가 만료됐습니다. 선생님께 다시 요청해 주세요
      </div>
    );
  }

  redirect('/');
}
