import { canViewAssets } from '@hangyeol/billing';
import { getPrisma, isDatabaseConfigured } from '@hangyeol/db';
import type { StudentStatus } from '@hangyeol/shared';
import { bearer, verifyAccessToken, verifyStudentToken, type TeacherClaims } from './auth.js';
import { apiError } from './errors.js';

/**
 * 09번 문서 §6 — 권한 검사 5단계.
 *
 *   1. 요청자가 해당 teacher_id 소유자인가
 *   2. student.teacher_id === 요청 teacher_id 인가
 *   3. teacher.billing_status !== 'locked' 인가
 *   4. student.status 가 자료 열람 가능 상태인가
 *   5. student 미인증 & lesson_no >= 4 → 거부
 *
 * "미들웨어로 강제한다. 개별 핸들러에서 빠뜨릴 수 없게 한다"가 문서의 요구다.
 * 그래서 자료에 닿는 경로는 requireStudentContext 를 반드시 통과하게 만들고,
 * 핸들러가 student 를 직접 조회하지 않도록 여기서 함께 돌려준다.
 */

export function db() {
  if (!isDatabaseConfigured()) {
    throw apiError('DB_UNAVAILABLE', 'DATABASE_URL 이 설정되지 않았습니다');
  }
  return getPrisma();
}

export interface TeacherContext {
  claims: TeacherClaims;
  teacherId: bigint;
}

/** 1단계. 모든 강사 API 의 입구. */
export async function requireTeacher(req: Request): Promise<TeacherContext> {
  const claims = await verifyAccessToken(bearer(req.headers.get('authorization')));
  return { claims, teacherId: BigInt(claims.teacherId) };
}

export interface StudentContext extends TeacherContext {
  student: {
    id: bigint;
    status: StudentStatus;
    currentLessonNo: number;
    name: string;
    nameKo: string | null;
    l1Code: string;
  };
  teacherLocked: boolean;
  teacherName: string;
}

/**
 * 2~5단계. 자료 열람 경로는 예외 없이 여기를 지난다.
 *
 * studentId 가 없으면 곧바로 403 STUDENT_REQUIRED.
 * "학생 없이 자료를 여는 경로는 존재하지 않는다"(03번 문서)를 코드로 만든 것.
 */
export async function requireStudentContext(
  req: Request,
  studentId: string | null | undefined,
): Promise<StudentContext> {
  const ctx = await requireTeacher(req);

  if (!studentId) throw apiError('STUDENT_REQUIRED');

  const prisma = db();
  const [student, teacher] = await Promise.all([
    prisma.student.findUnique({
      where: { id: BigInt(studentId) },
      select: {
        id: true,
        teacherId: true,
        status: true,
        currentLessonNo: true,
        name: true,
        nameKo: true,
        l1Code: true,
      },
    }),
    prisma.teacher.findUnique({
      where: { id: ctx.teacherId },
      select: { billingStatus: true, name: true },
    }),
  ]);

  if (!student || !teacher) throw apiError('NOT_FOUND');

  // 2단계 — 남의 학생은 존재 자체를 알리지 않는다. 404 로 응답한다.
  if (student.teacherId !== ctx.teacherId) throw apiError('NOT_FOUND');

  const teacherLocked = teacher.billingStatus === 'locked';

  // 3~5단계 — 판정 자체는 packages/billing 의 순수 함수가 한다.
  const verdict = canViewAssets({
    studentStatus: student.status as StudentStatus,
    currentLessonNo: student.currentLessonNo,
    teacherLocked,
  });

  if (!verdict.allowed && verdict.reason) throw apiError(verdict.reason);

  return {
    ...ctx,
    student: {
      id: student.id,
      status: student.status as StudentStatus,
      currentLessonNo: student.currentLessonNo,
      name: student.name,
      nameKo: student.nameKo,
      l1Code: student.l1Code,
    },
    teacherLocked,
    teacherName: teacher.name,
  };
}

/** 학생이 우리 학생인지만 확인한다 (자료 열람이 아닌 일반 조회용). */
export async function requireOwnStudent(req: Request, studentId: string) {
  const ctx = await requireTeacher(req);
  const student = await db().student.findUnique({ where: { id: BigInt(studentId) } });
  if (!student || student.teacherId !== ctx.teacherId) throw apiError('NOT_FOUND');
  return { ...ctx, student };
}

/** 학생 세션 쿠키에서 신원을 꺼낸다. 학습노트 API 의 입구. */
export async function requireStudentSession(req: Request) {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)hg_note=([^;]+)/);
  if (!match?.[1]) throw apiError('UNAUTHENTICATED');
  return verifyStudentToken(decodeURIComponent(match[1]), 'session');
}
