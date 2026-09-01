import { CONTENT_STATUS, IMAGE_ASSET_STATUS } from '@hangyeol/content';
import { addDays, billingMonthKey, kstMonthStartUtc } from '@hangyeol/shared';
import { db } from './guard.js';

/*
 * 관리자 지표.
 *
 * 05번 문서 §10 과 11번 문서의 핵심 지표 표가 무엇을 볼지 이미 정해 두었다.
 * 거기에 SaaS 표준 지표(MRR · ARPU · 이탈률)를 얹었다.
 *
 * 경고선은 11번 문서에서 온다. 숫자만 보여주면 사람이 판단해야 하고,
 * 판단을 매번 시키면 언젠가 놓친다. 경고선을 코드에 박아 둔다.
 *
 * 학생 활동 기록(과금 활성 판정 B 조건)은 note.ts 의 SRS 채점과
 * students.ts 의 노트 열람에서 남는다. 학생 도구를 복습 카드 하나로 줄인 뒤에도
 * (B) 가 성립하는 이유가 그것이다.
 */

export interface Metric {
  key: string;
  label: string;
  value: number;
  /** 표시 형식. 화면이 매번 포맷을 다시 정하지 않도록. */
  unit: 'count' | 'percent' | 'krw' | 'ratio';
  /** 11번 문서의 경고선. 넘거나 미달하면 경고다. */
  threshold?: { value: number; direction: 'below' | 'above'; note: string };
  warning: boolean;
  /** 이 숫자가 무엇을 뜻하는지. 대시보드는 설명이 없으면 오독된다. */
  meaning: string;
}

function metric(
  key: string,
  label: string,
  value: number,
  unit: Metric['unit'],
  meaning: string,
  threshold?: Metric['threshold'],
): Metric {
  const warning =
    threshold === undefined
      ? false
      : threshold.direction === 'below'
        ? value < threshold.value
        : value > threshold.value;
  return { key, label, value, unit, meaning, warning, ...(threshold ? { threshold } : {}) };
}

const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10);

export interface AdminDashboard {
  generatedAt: string;
  billingMonth: string;
  revenue: Metric[];
  students: Metric[];
  teachers: Metric[];
  funnel: Metric[];
  payments: Metric[];
  integrity: Metric[];
  content: {
    items: { key: string; label: string; drafted: number; target: number }[];
    images: { total: number; uploaded: number };
  };
}

const CONTENT_LABEL: Record<string, string> = {
  lessonPlans: '차시 지도안',
  curriculum: '커리큘럼 차시',
  classroomEnglish: '교실영어 문장',
  pronunciation: '발음 시트',
  trialPacks: '체험수업 팩',
};

export async function adminDashboard(now = new Date()): Promise<AdminDashboard> {
  const prisma = db();
  const monthStart = kstMonthStartUtc(now);
  const prevMonthStart = addDays(monthStart, -30);

  const [
    activeStudents,
    dormantStudents,
    lockedStudents,
    pendingStudents,
    totalStudents,
    totalTeachers,
    teachersWithActive,
    newTeachers30d,
    cycleGroups,
    invoiceGroups,
    creditSum,
    thisMonthBillable,
    lastMonthInvoiced,
  ] = await Promise.all([
    prisma.student.count({ where: { status: 'active' } }),
    prisma.student.count({ where: { status: 'dormant' } }),
    prisma.student.count({ where: { status: 'locked' } }),
    prisma.student.count({ where: { status: 'pending' } }),
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.teacher.count({ where: { students: { some: { status: 'active' } } } }),
    prisma.teacher.count({ where: { createdAt: { gte: addDays(now, -30) } } }),
    prisma.billingCycle.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.invoice.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.teacher.aggregate({ _sum: { creditBalance: true } }),
    // 이번 달에 청구될 주기의 합 = MRR 의 실측치
    prisma.billingCycle.aggregate({
      where: { status: { in: ['billable', 'invoiced', 'paid'] }, closedAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { billingMonth: { gte: prevMonthStart, lt: monthStart } },
      _sum: { totalAmount: true },
    }),
  ]);

  const cycleBy = Object.fromEntries(cycleGroups.map((c) => [c.status, c._count._all]));
  const invoiceBy = Object.fromEntries(invoiceGroups.map((i) => [i.status, i._count._all]));

  const mrr = thisMonthBillable._sum.amount ?? 0;
  const lastMrr = lastMonthInvoiced._sum.totalAmount ?? 0;
  const mrrGrowth = lastMrr === 0 ? 0 : Math.round(((mrr - lastMrr) / lastMrr) * 1000) / 10;

  // 고객은 강사다. 학생은 과금 단위이지 고객이 아니다.
  const arpu = teachersWithActive === 0 ? 0 : Math.round(mrr / teachersWithActive);

  const closedCycles = (cycleBy.billable ?? 0) + (cycleBy.waived_dormant ?? 0);
  const dormantRate = pct(cycleBy.waived_dormant ?? 0, closedCycles);

  // 등록 → 2차시 전환율. 첫 과금 도달률이다 (11번 문서 경고선 60%).
  const reachedLesson2 = await prisma.student.count({ where: { currentLessonNo: { gte: 2 } } });
  const conversionTo2 = pct(reachedLesson2, totalStudents);

  // 2차시 → 6차시 잔존율 (경고선 50%).
  const reachedLesson6 = await prisma.student.count({ where: { currentLessonNo: { gte: 6 } } });
  const retentionTo6 = pct(reachedLesson6, reachedLesson2);

  // 강사 90일 잔존율 — 90일 전 가입자 중 지금도 활성 학생이 있는 비율.
  const cohort90 = await prisma.teacher.count({ where: { createdAt: { lte: addDays(now, -90) } } });
  const cohort90Alive = await prisma.teacher.count({
    where: { createdAt: { lte: addDays(now, -90) }, students: { some: { status: 'active' } } },
  });
  const teacherRetention90 = pct(cohort90Alive, cohort90);

  const paidInvoices = invoiceBy.paid ?? 0;
  const settledInvoices =
    paidInvoices + (invoiceBy.failed ?? 0) + (invoiceBy.grace ?? 0) + (invoiceBy.locked ?? 0);
  const paymentSuccess = pct(paidInvoices, settledInvoices);

  // 우회 신호 — 열람은 있으나 30일 이상 학생활동이 0 (경고선 10%).
  const cutoff = addDays(now, -30);
  const viewed = await prisma.assetView.findMany({
    where: { openedAt: { gte: cutoff } },
    select: { studentId: true },
    distinct: ['studentId'],
  });
  let bypassSuspects = 0;
  for (const { studentId } of viewed) {
    const acts = await prisma.studentActivity.count({
      where: { studentId, occurredAt: { gte: cutoff } },
    });
    if (acts === 0) bypassSuspects += 1;
  }
  const bypassRate = pct(bypassSuspects, viewed.length);

  const uploadedImages = await prisma.curriculumAsset.count({ where: { kind: 'slide' } });

  return {
    generatedAt: now.toISOString(),
    billingMonth: billingMonthKey(now),

    revenue: [
      metric('mrr', '이번 달 청구액 (MRR)', mrr, 'krw', '이번 달 닫힌 billable 주기의 합. 실측치다'),
      metric('mrr_growth', '전월 대비', mrrGrowth, 'percent', '지난달 청구 총액 대비 증감'),
      metric('arpu', '강사당 매출 (ARPU)', arpu, 'krw', '고객은 강사다. MRR ÷ 활성 학생을 가진 강사 수'),
      metric(
        'credit_float',
        '선충전 예치 잔액',
        creditSum._sum.creditBalance ?? 0,
        'krw',
        '아직 쓰이지 않은 크레딧. 락인 지표이자 부채다',
      ),
    ],

    students: [
      metric('active', '활성 학생', activeStudents, 'count', '과금이 발생하는 학생 수'),
      metric('dormant', '휴면', dormantStudents, 'count', '28일간 수업 0회 — 청구하지 않는다'),
      metric('pending', '인증 대기', pendingStudents, 'count', '4차시부터 자료가 막힌다'),
      metric('locked', '잠금', lockedStudents, 'count', '강사 미납으로 잠긴 학생'),
      metric(
        'dormant_rate',
        '휴면 전환율',
        dormantRate,
        'percent',
        '주기 종료 대비 waived 비율',
        { value: 30, direction: 'above', note: '11번 문서 경고선 30%' },
      ),
    ],

    teachers: [
      metric('teachers', '전체 강사', totalTeachers, 'count', '가입한 강사 수'),
      metric('teachers_active', '활동 강사', teachersWithActive, 'count', '활성 학생을 가진 강사'),
      metric('teachers_new_30d', '신규 가입 (30일)', newTeachers30d, 'count', '최근 30일 가입'),
      metric(
        'students_per_teacher',
        '강사당 활성 학생',
        teachersWithActive === 0 ? 0 : Math.round((activeStudents / teachersWithActive) * 10) / 10,
        'ratio',
        '매출 배수. 이게 늘어야 강사 한 명의 가치가 커진다',
        { value: 3, direction: 'below', note: '11번 문서 경고선 3명' },
      ),
      metric(
        'teacher_retention_90',
        '강사 90일 잔존율',
        teacherRetention90,
        'percent',
        '제품 만족도의 대리 지표',
        { value: 60, direction: 'below', note: '11번 문서 경고선 60%' },
      ),
    ],

    funnel: [
      metric(
        'conversion_lesson2',
        '등록 → 2차시 전환율',
        conversionTo2,
        'percent',
        '첫 과금 도달률. 등록만 하고 안 가르치면 매출이 안 난다',
        { value: 60, direction: 'below', note: '11번 문서 경고선 60%' },
      ),
      metric(
        'retention_lesson6',
        '2차시 → 6차시 잔존율',
        retentionTo6,
        'percent',
        '학생이 붙는가',
        { value: 50, direction: 'below', note: '11번 문서 경고선 50%' },
      ),
    ],

    payments: [
      metric(
        'payment_success',
        '결제 성공률',
        paymentSuccess,
        'percent',
        '회수 건전성',
        { value: 93, direction: 'below', note: '11번 문서 경고선 93%' },
      ),
      metric('invoice_grace', '유예 중', invoiceBy.grace ?? 0, 'count', '3일 유예 진입. 아직 잠그지 않았다'),
      metric('invoice_locked', '잠금', invoiceBy.locked ?? 0, 'count', '유예 만료로 잠긴 강사'),
      metric('cycles_open', '진행 중 주기', cycleBy.open ?? 0, 'count', '아직 닫히지 않은 28일 주기'),
    ],

    integrity: [
      metric(
        'bypass_rate',
        '우회 의심 비율',
        bypassRate,
        'percent',
        '열람은 있으나 30일 이상 학생활동 0. 올라가면 잠금장치가 새고 있다는 뜻이다',
        { value: 10, direction: 'above', note: '11번 문서 경고선 10%' },
      ),
      metric('bypass_count', '우회 의심 건수', bypassSuspects, 'count', '사람이 확인한다. 자동 제재하지 않는다'),
    ],

    content: {
      items: Object.entries(CONTENT_STATUS).map(([key, v]) => ({
        key,
        label: CONTENT_LABEL[key] ?? key,
        drafted: Number((v as { drafted?: number; written?: number }).drafted ?? (v as { written?: number }).written ?? 0),
        target: Number((v as { target?: number }).target ?? 0),
      })),
      images: { total: IMAGE_ASSET_STATUS.total, uploaded: uploadedImages },
    },
  };
}
