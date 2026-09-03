import { canViewAssets } from '@hangyeol/billing';
import { getPrisma, isDatabaseConfigured } from '@hangyeol/db';
import type { StudentStatus } from '@hangyeol/shared';
import { sessionToken, verifyAccessToken, verifyStudentToken, type TeacherClaims } from './auth.js';
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
    /*
     * 방문자에게 환경 변수 이름을 말하지 않는다 (06번 §8 시스템 용어 금지).
     *
     * 실제로 랜딩에서 "신청하기" 를 누른 사람에게
     * "DATABASE_URL 이 설정되지 않았습니다" 가 그대로 떴다.
     * 신청하러 온 강사가 읽을 문장이 아니고, 읽어도 할 수 있는 일이 없다.
     * 원인은 서버 로그에 남기고 화면에는 다음 행동만 말한다.
     */
    console.error('[db] DATABASE_URL 이 없다 — 배포 환경 변수를 확인할 것');
    throw apiError('DB_UNAVAILABLE');
  }
  return getPrisma();
}

/**
 * 승인 게이트 — 로그인과 토큰 갱신이 같은 판단을 쓰게 한다.
 *
 * 두 곳에 각각 적으면 한쪽만 고치는 날이 온다.
 * 승인 여부는 계정이 살아 있는 내내 다시 물어야 하는 질문이라 특히 그렇다.
 */
export function assertApproved(teacher: {
  approvalStatus: string;
  rejectedReason?: string | null;
}): void {
  if (teacher.approvalStatus === 'approved') return;

  throw apiError(
    'TEACHER_NOT_APPROVED',
    teacher.approvalStatus === 'rejected'
      ? teacher.rejectedReason || '신청이 승인되지 않았습니다'
      : '아직 승인 전이에요. 관리자가 신청을 확인하면 이 계정으로 로그인할 수 있습니다',
  );
}

export interface TeacherContext {
  claims: TeacherClaims;
  teacherId: bigint;
}

/** 1단계. 모든 강사 API 의 입구. */
export async function requireTeacher(req: Request): Promise<TeacherContext> {
  // 쿠키가 우선, Authorization 헤더는 대안. sessionToken 이 둘 다 본다.
  const claims = await verifyAccessToken(sessionToken(req));
  return { claims, teacherId: BigInt(claims.teacherId) };
}

/*
 * 관리자 게이트.
 *
 * requireTeacher 로는 부족하다 — 그건 "로그인한 강사" 까지만 본다.
 * 관리자 화면에는 다른 강사의 이메일과 가입 신청서가 있고, 승인 버튼이 있다.
 * 강사 아무나 통과하면 자기 계정을 스스로 승인할 수 있다.
 *
 * 09번 문서는 IP 허용목록 + 2FA 를 요구한다. 둘 다 아직 없다.
 * 그때까지는 이메일 허용목록으로 막는다 — 약하지만 없는 것보다 낫고,
 * DB 필드가 아니라 환경변수라 계정이 탈취돼도 권한이 따라오지 않는다.
 *
 * 환경변수가 비어 있으면 전부 거부한다. 열어 두는 쪽으로 실패하지 않는다 —
 * 배포 환경에 변수를 넣는 걸 잊었을 때 관리자 화면이 공개되면 안 된다.
 */
function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireAdmin(req: Request): Promise<TeacherContext> {
  const ctx = await requireTeacher(req);
  const allowed = adminEmails();

  if (allowed.size === 0 || !allowed.has(ctx.claims.email.toLowerCase())) {
    // 관리자 화면의 존재를 알려 주지 않는다. 없는 주소와 같은 응답을 준다.
    throw apiError('NOT_FOUND', '없는 주소입니다');
  }
  return ctx;
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
