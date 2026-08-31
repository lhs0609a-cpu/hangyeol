import { createHmac } from 'node:crypto';
import { fingerprint, safeEqual } from './crypto.js';
import { apiError } from './errors.js';
import { db, type StudentContext } from './guard.js';

/**
 * 자료 전달 — 09번 문서 §3.
 *
 *   · 정적 CDN 경로 노출 금지
 *   · 서명 URL TTL 300초
 *   · URL 은 student_id · teacher_id · unit_id 조합에 바인딩
 *   · 다른 학생 컨텍스트로 같은 URL 재사용 시 403
 *   · asset_views 에 전건 기록
 *
 * 마지막 두 줄이 핵심이다. TTL 만 걸고 바인딩을 안 하면
 * 강사가 학생 A 로 URL 을 뽑아 학생 B 수업에 쓸 수 있다.
 */

export const ASSET_URL_TTL_SEC = Number(process.env.ASSET_URL_TTL_SEC ?? 300);

export interface AssetBinding {
  teacherId: string;
  studentId: string;
  unitId: string;
  page: number;
}

function signSecret(): string {
  const v = process.env.ASSET_SIGN_SECRET;
  if (!v) throw new Error('ASSET_SIGN_SECRET is not set');
  return v;
}

/** 서명 대상에 학생·강사·유닛·페이지·만료를 전부 넣는다. 하나라도 바뀌면 서명이 깨진다. */
function payload(b: AssetBinding, expiresAt: number): string {
  return `${b.teacherId}:${b.studentId}:${b.unitId}:${b.page}:${expiresAt}`;
}

export function signAssetUrl(b: AssetBinding, now = new Date()): string {
  const exp = Math.floor(now.getTime() / 1000) + ASSET_URL_TTL_SEC;
  const sig = createHmac('sha256', signSecret()).update(payload(b, exp)).digest('base64url');
  const q = new URLSearchParams({
    t: b.teacherId,
    s: b.studentId,
    u: b.unitId,
    p: String(b.page),
    exp: String(exp),
    sig,
  });
  return `/api/assets/render?${q.toString()}`;
}

export interface VerifiedAsset extends AssetBinding {
  expiresAt: number;
}

export function verifyAssetUrl(params: URLSearchParams, now = new Date()): VerifiedAsset {
  const teacherId = params.get('t');
  const studentId = params.get('s');
  const unitId = params.get('u');
  const page = Number(params.get('p'));
  const exp = Number(params.get('exp'));
  const sig = params.get('sig');

  if (!teacherId || !studentId || !unitId || !sig || !Number.isFinite(page) || !Number.isFinite(exp)) {
    throw apiError('VALIDATION_FAILED', '서명이 올바르지 않습니다');
  }

  if (Math.floor(now.getTime() / 1000) > exp) {
    // 만료는 조용히 실패하지 않는다. 프론트가 재발급하도록 코드를 구분해 준다.
    throw apiError('VALIDATION_FAILED', '자료 링크가 만료됐습니다', { expired: true });
  }

  const binding: AssetBinding = { teacherId, studentId, unitId, page };
  const expected = createHmac('sha256', signSecret())
    .update(payload(binding, exp))
    .digest('base64url');

  if (!safeEqual(sig, expected)) throw apiError('STUDENT_REQUIRED', '이 학생의 자료가 아닙니다');

  return { ...binding, expiresAt: exp };
}

export interface WatermarkSpec {
  line: string;
  note: string;
}

/**
 * 워터마크 문구 — 09번 문서 U3.
 * "{학생 로마자명} · {강사명} · {YYYY-MM-DD}"
 *
 * 실제 합성은 tools/watermark 의 sharp 파이프라인이 서버에서 한다.
 * CSS 오버레이나 DOM 요소로 만들면 개발자도구로 지워진다.
 */
export function watermarkFor(ctx: StudentContext, now = new Date()): WatermarkSpec {
  return {
    line: `${ctx.student.name} · ${ctx.teacherName} · ${now.toISOString().slice(0, 10)}`,
    note: '다운로드 불가',
  };
}

export interface SlideResponse {
  unitId: string;
  goalStatement: string;
  l1Code: string;
  pages: { no: number; url: string }[];
  watermark: WatermarkSpec;
}

/** 슬라이드 목록 + 서명 URL. 이 경로는 requireStudentContext 를 이미 통과한 뒤에만 불린다. */
export async function slidesForUnit(
  ctx: StudentContext,
  unitId: bigint,
  now = new Date(),
): Promise<SlideResponse> {
  const prisma = db();

  const unit = await prisma.curriculumUnit.findUnique({
    where: { id: unitId },
    select: { id: true, goalStatement: true },
  });
  if (!unit) throw apiError('NOT_FOUND');

  // 모국어 판본이 있으면 그걸, 없으면 공통('xx') 판본을 쓴다.
  const asset =
    (await prisma.curriculumAsset.findFirst({
      where: { unitId, kind: 'slide', l1Code: ctx.student.l1Code },
    })) ?? (await prisma.curriculumAsset.findFirst({ where: { unitId, kind: 'slide', l1Code: 'xx' } }));

  const pageCount = asset?.pageCount ?? 0;

  const binding = {
    teacherId: String(ctx.teacherId),
    studentId: String(ctx.student.id),
    unitId: String(unitId),
  };

  return {
    unitId: String(unitId),
    goalStatement: unit.goalStatement,
    l1Code: asset?.l1Code ?? ctx.student.l1Code,
    pages: Array.from({ length: pageCount }, (_, i) => ({
      no: i + 1,
      url: signAssetUrl({ ...binding, page: i + 1 }, now),
    })),
    watermark: watermarkFor(ctx, now),
  };
}

/**
 * 열람 로그 — 09번 문서 §3, 11번 문서의 우회 감지 지표 원천.
 * "열람은 있으나 학생활동 0" 을 세려면 이 기록이 빠짐없이 남아야 한다.
 */
export async function recordAssetView(params: {
  teacherId: bigint;
  studentId: bigint;
  unitId: bigint;
  assetId?: bigint | null;
  ip?: string | null;
  ua?: string | null;
}): Promise<void> {
  await db().assetView.create({
    data: {
      teacherId: params.teacherId,
      studentId: params.studentId,
      unitId: params.unitId,
      assetId: params.assetId ?? null,
      ipHash: fingerprint(params.ip),
      uaHash: fingerprint(params.ua),
    },
  });
}
