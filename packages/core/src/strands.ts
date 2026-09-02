import { LESSON_FRAME, planFor, type LessonPhase } from '@hangyeol/content';
import { weekStartUtc } from '@hangyeol/shared';
import { apiError } from './errors.js';
import { db } from './guard.js';

/*
 * Four Strands 집계 — 03번 문서 §8, 08번 문서 §0.1.
 *
 * 원래 매핑은 학생 자습 도구에 기대고 있었다.
 *
 *   다청          → input
 *   4·3·2         → fluency
 *   시나리오 드릴  → output
 *   HVPT          → form
 *
 * 결정기록 D-002 로 그 도구들을 걷어내면서 이 매핑이 깨졌다.
 * fluency 가 항상 0 이 되어 경고가 영구히 켜진다 — 쓸모없는 경고는 무시된다.
 *
 * 그래서 다시 정의한다. 수업이 강사가 실시간으로 하는 것이므로
 * Four Strands 도 수업 안에서 재는 것이 맞다.
 *
 *   model     강사가 읽어 준다        → input
 *   review    말로 대답한다           → output
 *   drill     문형 반복               → form
 *   roleplay  통제된 발화             → output
 *   free      자기 얘기로 바꿔 말한다  → fluency
 *   wrap      오류 정리               → form
 *   SRS 복습                          → form
 *
 * 학생 발화 비율(speak_ratio)로 보정한다.
 * 롤플레이 13분을 배정해도 학생이 3분만 말했으면 output 은 3분이다.
 */

export type Strand = 'input' | 'output' | 'form' | 'fluency';

const PHASE_STRAND: Record<LessonPhase, Strand> = {
  model: 'input',
  review: 'output',
  drill: 'form',
  roleplay: 'output',
  free: 'fluency',
  wrap: 'form',
};

/** 08번 §0.1 — 각 25%. 언어중심 초과 금지, 유창성 미달 금지. */
export const TARGET_PCT = 25;

export interface StrandMinutes {
  input: number;
  output: number;
  form: number;
  fluency: number;
}

export interface StrandReport {
  minutes: StrandMinutes;
  percent: StrandMinutes;
  warnings: string[];
  totalMinutes: number;
}

/**
 * 한 수업의 스트랜드 배분을 계산한다. 순수 함수.
 *
 * allocation 이 없으면 08번 문서의 고정 틀을 쓴다.
 * speakRatio 가 없으면 보정하지 않는다 — 없는 데이터를 추정하지 않는다.
 */
export function lessonStrands(params: {
  allocation?: { phase: string; minutes: number }[] | null;
  speakRatio?: number | null;
}): StrandMinutes {
  const alloc =
    params.allocation ??
    LESSON_FRAME.map((f) => ({ phase: f.phase as string, minutes: f.toMin - f.fromMin }));

  const out: StrandMinutes = { input: 0, output: 0, form: 0, fluency: 0 };

  for (const block of alloc) {
    const strand = PHASE_STRAND[block.phase as LessonPhase];
    if (!strand) continue;

    if ((strand === 'output' || strand === 'fluency') && params.speakRatio != null) {
      // 학생이 실제로 말한 만큼만 output·fluency 로 센다.
      // 나머지는 강사가 말한 것이므로 input 이다.
      const spoken = Math.round((block.minutes * params.speakRatio) / 100);
      out[strand] += spoken;
      out.input += block.minutes - spoken;
    } else {
      out[strand] += block.minutes;
    }
  }

  return out;
}

export function toPercent(m: StrandMinutes): StrandMinutes {
  const total = m.input + m.output + m.form + m.fluency;
  if (total === 0) return { input: 0, output: 0, form: 0, fluency: 0 };
  return {
    input: Math.round((m.input / total) * 100),
    output: Math.round((m.output / total) * 100),
    form: Math.round((m.form / total) * 100),
    fluency: Math.round((m.fluency / total) * 100),
  };
}

/** 08번 §0.1 경고 기준: form > 25% · fluency < 25% · |input − 25| > 8 */
export function strandWarnings(p: StrandMinutes): string[] {
  const w: string[] = [];
  if (p.form > TARGET_PCT) {
    w.push(`언어중심 학습 ${p.form}% — 25% 를 넘습니다. 설명과 드릴을 줄이고 말하게 하세요`);
  }
  if (p.fluency < TARGET_PCT) {
    w.push(`유창성 ${p.fluency}% — 25% 에 못 미칩니다. 자유 확장 시간을 늘리세요`);
  }
  if (Math.abs(p.input - TARGET_PCT) > 8) {
    w.push(
      p.input > TARGET_PCT
        ? `의미중심 입력 ${p.input}% — 강사가 너무 많이 말하고 있습니다`
        : `의미중심 입력 ${p.input}% — 모델 대화를 충분히 들려주세요`,
    );
  }
  return w;
}

/** 주간 집계 — 학생 상세 화면과 교수 플랜이 쓴다. */
export async function weeklyStrands(studentId: bigint, now = new Date()): Promise<StrandReport | null> {
  const prisma = db();
  const weekStart = weekStartUtc(now);

  const lessons = await prisma.lesson.findMany({
    where: { studentId, startedAt: { gte: weekStart } },
    select: { speakRatio: true, planAllocation: true },
  });

  const srsCount = await prisma.studentActivity.count({
    where: { studentId, kind: 'srs', occurredAt: { gte: weekStart } },
  });

  if (lessons.length === 0 && srsCount === 0) return null;

  const total: StrandMinutes = { input: 0, output: 0, form: 0, fluency: 0 };

  for (const lesson of lessons) {
    const m = lessonStrands({
      allocation: lesson.planAllocation as { phase: string; minutes: number }[] | null,
      speakRatio: lesson.speakRatio,
    });
    total.input += m.input;
    total.output += m.output;
    total.form += m.form;
    total.fluency += m.fluency;
  }

  // 복습 카드 한 세션을 3분으로 센다 (학습노트의 표시 시간과 같다).
  total.form += srsCount * 3;

  const percent = toPercent(total);

  return {
    minutes: total,
    percent,
    warnings: strandWarnings(percent),
    totalMinutes: total.input + total.output + total.form + total.fluency,
  };
}

/** strand-rollup 배치 (매일 KST 05:00) — 10번 문서 §6. */
export async function runStrandRollup(now = new Date()) {
  const prisma = db();
  const weekStart = weekStartUtc(now);

  const students = await prisma.student.findMany({
    where: { status: { in: ['active', 'pending'] } },
    select: { id: true },
  });

  let upserted = 0;

  for (const { id } of students) {
    const report = await weeklyStrands(id, now);
    if (!report) continue;

    await prisma.strandWeekly.upsert({
      where: { studentId_weekStart: { studentId: id, weekStart } },
      create: {
        studentId: id,
        weekStart,
        inputMin: report.minutes.input,
        outputMin: report.minutes.output,
        formMin: report.minutes.form,
        fluencyMin: report.minutes.fluency,
      },
      update: {
        inputMin: report.minutes.input,
        outputMin: report.minutes.output,
        formMin: report.minutes.form,
        fluencyMin: report.minutes.fluency,
      },
    });
    upserted += 1;
  }

  return { upserted };
}

/**
 * 발화 비율 기록 — 02번 문서 C-09.
 *
 * 마이크 볼륨 레벨만 쓴다. 음성 인식이 아니다.
 * STT 를 쓰면 학생 수에 비례하는 종량과금이 생기고, 10번 문서 C1 을 깬다.
 */
export async function recordSpeakRatio(params: {
  teacherId: bigint;
  lessonId: bigint;
  ratio: number;
}): Promise<{ ok: true; speakRatio: number }> {
  if (!Number.isInteger(params.ratio) || params.ratio < 0 || params.ratio > 100) {
    throw apiError('VALIDATION_FAILED', '발화 비율은 0~100 사이 정수여야 합니다');
  }

  const prisma = db();
  const lesson = await prisma.lesson.findUnique({ where: { id: params.lessonId } });
  if (!lesson || lesson.teacherId !== params.teacherId) throw apiError('NOT_FOUND');

  await prisma.lesson.update({
    where: { id: params.lessonId },
    data: { speakRatio: params.ratio },
  });

  return { ok: true, speakRatio: params.ratio };
}

/** 수업 시작 시 지도안 배분을 기록해 둔다. 나중에 스트랜드 계산의 근거가 된다. */
export function allocationFor(unitNo: number): { phase: string; minutes: number }[] {
  const plan = planFor(unitNo);
  const frame = LESSON_FRAME.map((f) => ({
    phase: f.phase as string,
    minutes: f.toMin - f.fromMin,
  }));
  // 지도안이 있어도 시간 배분은 고정 틀을 따른다.
  // 조정은 교수 플랜이 학생 상태를 보고 하고, 그 결과가 여기에 저장된다.
  return plan ? frame : frame;
}
