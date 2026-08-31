import { quoteCyclePrice, tierFromHourlyRate, type BillingCycle } from '@hangyeol/billing';
import { isDatabaseConfigured } from '@hangyeol/db';
import type { RateTier, StudentStatus } from '@hangyeol/shared';

/*
 * T-01 이 쓰는 데이터.
 *
 * DB 가 붙어 있으면 실제 레코드를 읽고, 없으면 목업으로 떨어진다.
 * 떨어졌다는 사실은 화면에 그대로 표시한다 — 데모 데이터를 진짜처럼 보이게 두면
 * 나중에 "왜 청구가 안 맞냐"는 질문의 출처가 된다.
 */

export interface TodayStudent {
  id: string;
  flag: string;
  nameKo: string;
  name: string;
  lessonNo: number;
  level: string;
  status: StudentStatus;
  lastActivity: string;
}

export interface TodayData {
  live: boolean;
  teacherName: string;
  tier: RateTier;
  students: TodayStudent[];
  monthTotal: number;
  cyclePrice: number;
  discountPct: number;
}

const FLAGS: Record<string, string> = {
  ES: '🇪🇸', JP: '🇯🇵', VN: '🇻🇳', US: '🇺🇸', ID: '🇮🇩', CN: '🇨🇳', DE: '🇩🇪', BR: '🇧🇷',
};

const MOCK: TodayStudent[] = [
  { id: '1042', flag: '🇪🇸', nameKo: '마리아', name: 'Maria Santos', lessonNo: 14, level: 'TOPIK 1급', status: 'active', lastActivity: '2시간 전' },
  { id: '1043', flag: '🇯🇵', nameKo: '미사키', name: 'Misaki Ito', lessonNo: 22, level: 'TOPIK 2급', status: 'active', lastActivity: '어제' },
  { id: '1045', flag: '🇻🇳', nameKo: '민', name: 'Nguyen Minh', lessonNo: 6, level: 'TOPIK 1급', status: 'active', lastActivity: '3일 전' },
  { id: '1046', flag: '🇺🇸', nameKo: '루카스', name: 'Lucas Brown', lessonNo: 3, level: 'TOPIK 1급', status: 'pending', lastActivity: '5일 전' },
  { id: '1044', flag: '🇮🇩', nameKo: '사라', name: 'Sarah Putri', lessonNo: 9, level: 'TOPIK 1급', status: 'dormant', lastActivity: '34일 전' },
];

function relative(at: Date | null, now: Date): string {
  if (!at) return '기록 없음';
  const days = Math.floor((now.getTime() - at.getTime()) / 86_400_000);
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  return `${days}일 전`;
}

function summarize(students: TodayStudent[], tier: RateTier): Omit<TodayData, 'live' | 'teacherName' | 'students' | 'tier'> {
  const active = students.filter((s) => s.status === 'active');
  // 할인 판정에 쓰는 active 수는 목록에서 유도한다.
  // 별도로 들고 있으면 목록과 어긋나도 아무도 모른 채 잘못된 요금이 찍힌다.
  const quote = quoteCyclePrice(tier, active.length);
  return {
    monthTotal: active.length * quote.amount,
    cyclePrice: quote.amount,
    discountPct: quote.discountPct,
  };
}

export async function loadToday(now = new Date()): Promise<TodayData> {
  if (!isDatabaseConfigured()) {
    return { live: false, teacherName: '이지은', tier: 'B', students: MOCK, ...summarize(MOCK, 'B') };
  }

  // DB 가 붙어 있을 때만 클라이언트를 만든다. 빌드 시점에 커넥션을 열지 않기 위해서다.
  const { getPrisma } = await import('@hangyeol/db');
  const prisma = getPrisma();

  const teacher = await prisma.teacher.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, rateTier: true, hourlyRateUsd: true },
  });

  if (!teacher) {
    return { live: false, teacherName: '이지은', tier: 'B', students: MOCK, ...summarize(MOCK, 'B') };
  }

  const rows = await prisma.student.findMany({
    where: { teacherId: teacher.id },
    orderBy: [{ lastLessonAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true, name: true, nameKo: true, countryCode: true,
      levelCode: true, status: true, currentLessonNo: true, lastLessonAt: true,
    },
  });

  const tier = (teacher.rateTier ??
    tierFromHourlyRate(teacher.hourlyRateUsd ? Number(teacher.hourlyRateUsd) : null)) as RateTier;

  const students: TodayStudent[] = rows.map((r) => ({
    id: String(r.id),
    flag: FLAGS[r.countryCode ?? ''] ?? '🏳️',
    nameKo: r.nameKo ?? r.name,
    name: r.name,
    lessonNo: r.currentLessonNo,
    level: r.levelCode.replace('topik', 'TOPIK ') + '급',
    status: r.status as StudentStatus,
    lastActivity: relative(r.lastLessonAt, now),
  }));

  // 실제 주기가 있으면 그 금액을 쓴다. 화면 숫자와 청구서가 어긋나면 안 된다.
  const openCycles = await prisma.billingCycle.findMany({
    where: { teacherId: teacher.id, status: 'open' },
    select: { amount: true },
  });

  const fallback = summarize(students, tier);

  return {
    live: true,
    teacherName: teacher.name,
    tier,
    students,
    monthTotal:
      openCycles.length > 0 ? openCycles.reduce((a, c) => a + c.amount, 0) : fallback.monthTotal,
    cyclePrice: fallback.cyclePrice,
    discountPct: fallback.discountPct,
  };
}

export type { BillingCycle };
