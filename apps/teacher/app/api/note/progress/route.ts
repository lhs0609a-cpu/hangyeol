import { db, handle, requireStudentSession } from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/note/progress — 02번 문서 D-08 진도 대시보드.
 *
 * 화이트라벨. 강사 이름 외에 어떤 브랜드도 나가지 않는다.
 */
export function GET(req: Request) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    const studentId = BigInt(claims.studentId);
    const prisma = db();

    const [student, vocabTotal, graduated, lessons, levelTest] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        select: { levelCode: true, currentLessonNo: true, firstLessonAt: true },
      }),
      prisma.vocabCard.count({ where: { studentId } }),
      prisma.vocabCard.count({ where: { studentId, state: 'graduated' } }),
      prisma.lesson.count({ where: { studentId } }),
      prisma.levelTest.findFirst({ where: { studentId }, orderBy: { completedAt: 'desc' } }),
    ]);

    const weeks = student?.firstLessonAt
      ? Math.max(1, Math.round((Date.now() - student.firstLessonAt.getTime()) / (7 * 86_400_000)))
      : 0;

    return {
      levelCode: student?.levelCode ?? 'topik1',
      currentLessonNo: student?.currentLessonNo ?? 0,
      lessons,
      weeks,
      vocab: { total: vocabTotal, graduated },
      // 레벨 테스트를 아직 안 봤으면 null. 없는 숫자를 만들지 않는다.
      levelAssignedAt: levelTest?.completedAt.toISOString() ?? null,
    };
  });
}
