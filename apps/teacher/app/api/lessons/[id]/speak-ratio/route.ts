import { handle, readJson, recordSpeakRatio, requireTeacher } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/lessons/:id/speak-ratio
 *
 * 마이크 볼륨 레벨만 쓴다. 음성 인식이 아니다 —
 * STT 를 쓰면 학생 수에 비례하는 종량과금이 생기고 10번 문서 C1 을 깬다.
 */
export function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = await requireTeacher(req);
    const { ratio } = await readJson<{ ratio: number }>(req);
    return recordSpeakRatio({ teacherId: ctx.teacherId, lessonId: BigInt(params.id), ratio });
  });
}
