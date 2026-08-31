import { apiError, handle, requireStudentContext, verifyAssetUrl } from '@hangyeol/core';

export const runtime = 'nodejs';
// 요청 헤더·쿠키를 읽으므로 정적 렌더링 대상이 아니다.
export const dynamic = 'force-dynamic';

/**
 * GET /api/assets/render?t=&s=&u=&p=&exp=&sig=
 *
 * 서명 URL 의 착지점. 여기서 두 번 검사한다.
 *
 *   1. 서명이 유효하고 만료되지 않았는가
 *   2. 지금 요청한 강사가 서명에 박힌 그 강사이고, 그 학생 컨텍스트가 여전히 유효한가
 *
 * 2번이 없으면 강사 A 가 발급받은 URL 을 강사 B 가 쓸 수 있다.
 * 09번 문서 "다른 학생 컨텍스트로 같은 URL 재사용 시 403" 이 이 검사다.
 */
export function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const binding = verifyAssetUrl(url.searchParams);

    const ctx = await requireStudentContext(req, binding.studentId);
    if (String(ctx.teacherId) !== binding.teacherId) {
      throw apiError('STUDENT_REQUIRED', '이 자료에 대한 권한이 없습니다');
    }

    // 실제 이미지 바이트는 tools/watermark 가 합성해 R2 에서 내려준다.
    // 그 파이프라인이 붙기 전까지는 합성에 필요한 값만 확인해 돌려준다.
    // 여기서 원본 경로를 그대로 노출하면 안 된다는 것이 핵심 제약이다.
    return {
      ready: false,
      unitId: binding.unitId,
      page: binding.page,
      watermark: `${ctx.student.name} · ${ctx.teacherName} · ${new Date().toISOString().slice(0, 10)}`,
      note: '워터마크 합성 파이프라인(tools/watermark) 미착수',
    };
  });
}
