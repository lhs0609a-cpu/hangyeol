import { buildTokenManifest, CONTRASTS, SCENARIOS, type TokenSpec } from '@hangyeol/content';

/*
 * 음원 사전 생성 배치 — 08번 문서 §3·§4, 10번 문서 §4.
 *
 * 이 도구의 존재 이유는 하나다. 런타임 TTS 호출을 없애는 것.
 * 학생 수에 비례해 늘어나는 종량과금을 만들지 않기 위해서다.
 *
 *   HVPT     약 416개 사전 생성 → R2 → CDN. 불변
 *   시나리오  유닛별 배치 생성 → R2. tts_generated_at 기록
 *   전부 immutable. 런타임 생성 없음
 *
 * 이 파일은 "무엇을 만들어야 하는가"를 계산하고, 실제 합성은
 * 주입된 synthesize 함수가 한다. 그래야 제공자를 바꿔도 계획은 그대로다.
 */

export interface SynthesisJob {
  /** R2 저장 키. 한 번 만들면 바꾸지 않는다. */
  audioKey: string;
  /** 합성할 발화 텍스트. */
  utterance: string;
  /** 화자 인덱스. HVPT 는 8명이 필수 요건이다. */
  talkerIdx: number;
  kind: 'hvpt' | 'scenario';
  meta: Record<string, string | number>;
}

/** HVPT — 5 대립쌍 × 토큰 × 화자 8 × 맥락 4. */
export function planHvptJobs(): SynthesisJob[] {
  return buildTokenManifest().map((t: TokenSpec) => ({
    audioKey: t.audioKey,
    utterance: t.utterance,
    talkerIdx: t.talkerIdx,
    kind: 'hvpt' as const,
    meta: { contrastId: t.contrastId, token: t.token, context: t.context },
  }));
}

/** 시나리오 — AI 발화 노드마다 하나. 화자는 고정(0번)이다. */
export function planScenarioJobs(): SynthesisJob[] {
  const jobs: SynthesisJob[] = [];
  for (const s of SCENARIOS) {
    for (const node of s.nodes) {
      jobs.push({
        audioKey: node.audioKey,
        utterance: node.text,
        talkerIdx: 0,
        kind: 'scenario',
        meta: { unitNo: s.unitNo, nodeId: node.id },
      });
    }
  }
  return jobs;
}

export function planAll(): SynthesisJob[] {
  return [...planHvptJobs(), ...planScenarioJobs()];
}

export interface SynthesizeFn {
  (job: SynthesisJob): Promise<Buffer>;
}

export interface UploadFn {
  (key: string, body: Buffer, contentType: string): Promise<void>;
}

export interface ExistsFn {
  (key: string): Promise<boolean>;
}

export interface RunResult {
  planned: number;
  skipped: number;
  generated: number;
  failed: { audioKey: string; error: string }[];
}

/**
 * 배치 실행.
 *
 * 이미 있는 키는 건너뛴다. 음원은 immutable 이므로 재생성할 이유가 없고,
 * 재실행이 비용을 다시 태우면 안 된다.
 */
export async function run(params: {
  jobs: SynthesisJob[];
  synthesize: SynthesizeFn;
  upload: UploadFn;
  exists: ExistsFn;
  /** 동시 실행 수. 제공자 레이트리밋에 맞춘다. */
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}): Promise<RunResult> {
  const { jobs, synthesize, upload, exists } = params;
  const concurrency = params.concurrency ?? 4;

  const result: RunResult = { planned: jobs.length, skipped: 0, generated: 0, failed: [] };
  let cursor = 0;
  let done = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= jobs.length) return;

      const job = jobs[index]!;
      try {
        if (await exists(job.audioKey)) {
          result.skipped += 1;
        } else {
          await upload(job.audioKey, await synthesize(job), 'audio/mpeg');
          result.generated += 1;
        }
      } catch (err) {
        result.failed.push({
          audioKey: job.audioKey,
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        done += 1;
        params.onProgress?.(done, jobs.length);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return result;
}

/**
 * 화자 8명을 실제로 어떻게 확보할 것인가.
 *
 * 08번 문서 §3: "TTS 생성 음원으로도 음운 인식 향상이 확인되므로
 * 초기엔 다화자 TTS 로 제작하고, 예산이 생기면 실제 화자 녹음으로 교체한다."
 *
 * 10번 문서 §12 의 미결 사항 4번이기도 하다. 제공자를 고르기 전까지
 * 이 목록은 비워 둔다 — 임의로 정하면 나중에 전량 재생성해야 한다.
 */
export const TALKER_VOICES: readonly string[] = [];

export function voiceFor(talkerIdx: number): string {
  const voice = TALKER_VOICES[talkerIdx];
  if (!voice) {
    throw new Error(
      `화자 ${talkerIdx} 의 음성이 지정되지 않았습니다. ` +
        'TALKER_VOICES 에 8명을 채워야 HVPT 요건(화자 다양성)을 만족합니다.',
    );
  }
  return voice;
}

export function summary() {
  return {
    contrasts: CONTRASTS.length,
    hvptJobs: planHvptJobs().length,
    scenarioJobs: planScenarioJobs().length,
    total: planAll().length,
    talkersConfigured: TALKER_VOICES.length,
    ready: TALKER_VOICES.length >= 8,
  };
}
