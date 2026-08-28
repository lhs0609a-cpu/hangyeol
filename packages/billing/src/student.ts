import type { Krw, StudentStatus } from '@hangyeol/shared';

/**
 * 학생 등록 · 재등록 — 05번 문서 §8 엣지케이스 4·5.
 *
 * 등록은 언제나 무료다. 그래야 강사가 첫 수업부터 우리 안으로 들어온다.
 */

export interface ExistingStudentRef {
  id: number;
  status: StudentStatus;
  /** 이 학생의 최대 cycle_no. 재등록해도 여기서 이어간다. */
  maxCycleNo: number;
  currentLessonNo: number;
}

export interface EnrollmentDecision {
  action: 'create' | 'reactivate';
  studentId: number | null;
  /** 다음 주기가 열릴 때 쓸 직전 번호. 재등록이면 기존 값을 이어받는다. */
  previousCycleNo: number;
  /** 등록 시점 청구액. 언제나 0. */
  chargedNow: Krw;
  firstChargeAtLessonNo: number;
  /** 중복이면 API 는 409 + 기존 레코드를 돌려준다. */
  duplicate: boolean;
}

/**
 * email_hash 로 찾은 기존 레코드가 있으면 재활성, 없으면 신규 생성.
 * 어느 쪽이든 이 시점에 과금은 발생하지 않는다.
 */
export function resolveEnrollment(existing: ExistingStudentRef | null): EnrollmentDecision {
  if (existing === null) {
    return {
      action: 'create',
      studentId: null,
      previousCycleNo: 0,
      chargedNow: 0,
      firstChargeAtLessonNo: 2,
      duplicate: false,
    };
  }

  return {
    action: 'reactivate',
    studentId: existing.id,
    // cycle_no 를 이어간다. 새로 1번부터 시작하면 과금 이력이 꼬인다.
    previousCycleNo: existing.maxCycleNo,
    chargedNow: 0,
    firstChargeAtLessonNo: Math.max(2, existing.currentLessonNo + 1),
    duplicate: true,
  };
}

/**
 * 미인증 학생의 자료 열람 차단 — 04번 문서 403 STUDENT_NOT_VERIFIED.
 * pending 상태로 4차시에 들어서면 막는다. 3차시까지는 유예.
 */
export function canViewAssets(params: {
  studentStatus: StudentStatus;
  currentLessonNo: number;
  teacherLocked: boolean;
}): { allowed: boolean; reason: 'TEACHER_LOCKED' | 'STUDENT_NOT_VERIFIED' | null } {
  if (params.teacherLocked) return { allowed: false, reason: 'TEACHER_LOCKED' };
  if (params.studentStatus === 'pending' && params.currentLessonNo >= 4) {
    return { allowed: false, reason: 'STUDENT_NOT_VERIFIED' };
  }
  return { allowed: true, reason: null };
}
