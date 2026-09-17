import { addDays } from '@hangyeol/shared';
import { db } from './guard.js';

/*
 * 우회 의심 플래그 — 02번 G-03 · 09번 §3 U6 · 04번 §I `GET /admin/flags`.
 *
 * 지표 화면(A-01)은 "우회 의심 몇 건" 이라는 숫자만 준다. 숫자로는
 * 누구를 봐야 하는지 알 수 없고, 알 수 없으면 아무도 확인하지 않는다.
 * 그래서 목록을 만든다.
 *
 * **자동 제재는 하지 않는다.** 두 문서가 같은 문장을 적어 뒀다 —
 * "플래그만. 사람이 확인한다." 규칙 넷은 전부 정황이지 증거가 아니다.
 * 자료를 열고 학생이 그 주에 앱을 안 열었을 수도 있고, 강사가 노트북을
 * 바꿨을 수도 있다. 여기서 계정을 끊으면 멀쩡한 강사가 먼저 끊긴다.
 *
 * 개인정보를 내보내지 않는다(09번 §6 "관리자 화면에서도 마스킹").
 * 이름 대신 학생·강사 id 와 신호만 준다. 사람이 확인할 때 필요한 것은
 * "누구를 열어 봐야 하는가" 지 그 사람의 이메일이 아니다.
 */

export type FlagRule = 'views_without_activity' | 'device_churn' | 'recycled_slots' | 'shared_ip';

export interface Flag {
  rule: FlagRule;
  /** 무엇을 본 신호인지. 화면이 규칙 설명을 따로 들고 있지 않도록 여기서 준다. */
  label: string;
  subject: { kind: 'student' | 'teacher' | 'network'; id: string };
  /** 사람이 확인할 때 근거가 되는 숫자. */
  evidence: string;
  /** 정황의 무게. 자동 제재의 근거가 아니라 확인 순서를 정하는 값이다. */
  weight: number;
}

export interface FlagReport {
  generatedAt: string;
  windowDays: number;
  flags: Flag[];
  /** 규칙 설명. 화면이 "이게 왜 떴는지" 를 말할 수 있어야 한다. */
  rules: { rule: FlagRule; label: string; source: string; meaning: string }[];
}

const WINDOW_DAYS = 30;

export const FLAG_RULES: FlagReport['rules'] = [
  {
    rule: 'views_without_activity',
    label: '자료는 열렸는데 학생 활동이 없다',
    source: '09번 §3 U6',
    meaning: '학생 레코드만 만들어 두고 자료를 여는 경우. 자료 잠금이 새는 첫 신호다',
  },
  {
    rule: 'device_churn',
    label: '한 학생의 자료를 여러 기기에서 열었다',
    source: '09번 §3 U6',
    meaning: '강사가 기기를 바꿨을 수도 있다. 다른 신호와 겹칠 때만 의미가 있다',
  },
  {
    rule: 'recycled_slots',
    label: '완료 처리 뒤 신규 등록이 몰렸다',
    source: '02번 G-03',
    meaning: '한 자리를 돌려쓰면 이 모양이 된다. 실제로 과정을 마쳤을 수도 있다',
  },
  {
    rule: 'shared_ip',
    label: '한 곳에서 여러 강사 계정이 열렸다',
    source: '09번 §3 U6',
    meaning: '계정 공유(약관 레드라인 R1)의 신호. 같은 학원·같은 공유기일 수도 있다',
  },
];

/** 규칙 1 — 열람은 있으나 30일간 학생 활동이 0. */
async function viewsWithoutActivity(cutoff: Date): Promise<Flag[]> {
  const prisma = db();

  const viewed = await prisma.assetView.groupBy({
    by: ['studentId'],
    where: { openedAt: { gte: cutoff } },
    _count: { _all: true },
  });

  const flags: Flag[] = [];
  for (const row of viewed) {
    /*
     * 강사가 남긴 조정·평가 이벤트는 학생 활동이 아니다(20번 문서).
     * 빼지 않으면 강사가 화면을 쓸수록 우회 신호가 사라진다 —
     * 정확히 반대로 도는 지표가 된다.
     */
    const activity = await prisma.studentActivity.count({
      where: {
        studentId: row.studentId,
        kind: { notIn: ['learning_adjustment', 'learning_performance'] },
        occurredAt: { gte: cutoff },
      },
    });
    if (activity > 0) continue;

    flags.push({
      rule: 'views_without_activity',
      label: '자료는 열렸는데 학생 활동이 없다',
      subject: { kind: 'student', id: String(row.studentId) },
      evidence: `${WINDOW_DAYS}일간 자료 열람 ${row._count._all}회 · 학생 활동 0회`,
      weight: 3,
    });
  }
  return flags;
}

/** 규칙 2 — 같은 학생 레코드를 서로 다른 기기에서 열었다. */
async function deviceChurn(cutoff: Date): Promise<Flag[]> {
  const prisma = db();

  const rows = await prisma.assetView.findMany({
    where: { openedAt: { gte: cutoff }, uaHash: { not: null } },
    select: { studentId: true, uaHash: true },
    distinct: ['studentId', 'uaHash'],
  });

  const perStudent = new Map<string, number>();
  for (const row of rows) {
    const key = String(row.studentId);
    perStudent.set(key, (perStudent.get(key) ?? 0) + 1);
  }

  /*
   * 셋부터 본다. 둘은 흔하다 — 노트북과 태블릿, 또는 브라우저 업데이트 한 번이면
   * 지문이 바뀐다. 둘에서 띄우면 목록이 정상 강사로 가득 차고,
   * 가득 찬 목록은 아무도 보지 않는다.
   */
  return [...perStudent.entries()]
    .filter(([, count]) => count >= 3)
    .map(([studentId, count]) => ({
      rule: 'device_churn' as const,
      label: '한 학생의 자료를 여러 기기에서 열었다',
      subject: { kind: 'student' as const, id: studentId },
      evidence: `${WINDOW_DAYS}일간 서로 다른 기기 ${count}종`,
      weight: 1,
    }));
}

/** 규칙 3 — 완료 처리 뒤 신규 등록이 몰렸다. */
async function recycledSlots(cutoff: Date): Promise<Flag[]> {
  const prisma = db();

  const [completed, created] = await Promise.all([
    prisma.student.groupBy({
      by: ['teacherId'],
      where: { status: 'completed', updatedAt: { gte: cutoff } },
      _count: { _all: true },
    }),
    prisma.student.groupBy({
      by: ['teacherId'],
      where: { createdAt: { gte: cutoff } },
      _count: { _all: true },
    }),
  ]);

  const newly = new Map(created.map((r) => [String(r.teacherId), r._count._all]));

  return completed
    .map((row) => {
      const teacherId = String(row.teacherId);
      const fresh = newly.get(teacherId) ?? 0;
      return { teacherId, closed: row._count._all, fresh };
    })
    // 문서의 기준 그대로 — 완료 처리가 있고, 같은 기간에 신규 등록이 5건 이상.
    .filter((r) => r.fresh >= 5)
    .map((r) => ({
      rule: 'recycled_slots' as const,
      label: '완료 처리 뒤 신규 등록이 몰렸다',
      subject: { kind: 'teacher' as const, id: r.teacherId },
      evidence: `${WINDOW_DAYS}일간 완료 ${r.closed}명 · 신규 ${r.fresh}명`,
      weight: 2,
    }));
}

/** 규칙 4 — 한 주소에서 서로 다른 강사 계정이 셋 이상. */
async function sharedIp(cutoff: Date): Promise<Flag[]> {
  const prisma = db();

  const rows = await prisma.assetView.findMany({
    where: { openedAt: { gte: cutoff }, ipHash: { not: null } },
    select: { ipHash: true, teacherId: true },
    distinct: ['ipHash', 'teacherId'],
  });

  const perIp = new Map<string, number>();
  for (const row of rows) {
    if (!row.ipHash) continue;
    perIp.set(row.ipHash, (perIp.get(row.ipHash) ?? 0) + 1);
  }

  return [...perIp.entries()]
    .filter(([, teachers]) => teachers >= 3)
    .map(([ipHash, teachers]) => ({
      rule: 'shared_ip' as const,
      label: '한 곳에서 여러 강사 계정이 열렸다',
      // 원본 주소는 애초에 저장하지 않는다(09번 §4). 해시의 앞부분만 보여 준다.
      subject: { kind: 'network' as const, id: ipHash.slice(0, 12) },
      evidence: `${WINDOW_DAYS}일간 강사 계정 ${teachers}개`,
      weight: 3,
    }));
}

export async function bypassFlags(now = new Date()): Promise<FlagReport> {
  const cutoff = addDays(now, -WINDOW_DAYS);

  const groups = await Promise.all([
    viewsWithoutActivity(cutoff),
    deviceChurn(cutoff),
    recycledSlots(cutoff),
    sharedIp(cutoff),
  ]);

  // 무거운 신호가 위로. 확인할 시간이 열 건뿐일 때 무엇부터 볼지가 정해져야 한다.
  const flags = groups.flat().sort((a, b) => b.weight - a.weight);

  return {
    generatedAt: now.toISOString(),
    windowDays: WINDOW_DAYS,
    flags,
    rules: FLAG_RULES,
  };
}
