import { EXTERNAL_ASSETS, LICENSES, type ExternalAsset } from '@hangyeol/content';

/*
 * 실화자 코퍼스에서 HVPT 토큰을 확보하는 경로.
 *
 * 조사 결과 공개된 한국어 TTS 모델은 대부분 비상업이었다.
 * KSS 기반 Piper 음성도, Meta MMS 도 상업 이용이 막혀 있다.
 * 그래서 08번 문서가 요구하는 "화자 8명"을 채우는 현실적인 방법은
 * TTS 가 아니라 상업 이용이 가능한 실화자 코퍼스다.
 *
 *   Zeroth-Korean   CC BY 4.0   화자 105명 · 51.6시간
 *   Common Voice    CC0         화자 수는 실측 필요
 *
 * 다만 둘 다 읽기 발화 코퍼스라 최소대립쌍(개/캐/깨)이 그대로 들어 있지 않다.
 * 문장에서 해당 음절을 잘라내는 정렬 작업이 필요하고, 그 결과물은
 * 원본 라이선스를 승계한다. 이 파일은 그 작업의 계획과 제약을 코드로 고정한다.
 */

export interface CorpusSource {
  assetId: string;
  /** 화자 수. 모르면 null — 확인 전에는 "충분하다"고 가정하지 않는다. */
  speakers: number | null;
  hours: number | null;
  /** 다운로드 위치. 사람이 직접 받는다 — 자동 크롤링하지 않는다. */
  downloadUrl: string;
}

export const CORPUS_SOURCES: readonly CorpusSource[] = Object.freeze([
  {
    assetId: 'zeroth-korean',
    speakers: 105,
    hours: 51.6,
    downloadUrl: 'https://openslr.org/40/',
  },
  {
    assetId: 'common-voice-ko',
    speakers: null,
    hours: null,
    downloadUrl: 'https://commonvoice.mozilla.org/ko/datasets',
  },
]);

export function resolveAsset(assetId: string): ExternalAsset {
  const asset = EXTERNAL_ASSETS.find((a) => a.id === assetId);
  if (!asset) throw new Error(`알 수 없는 자산: ${assetId}`);
  return asset;
}

/**
 * 코퍼스를 쓰기 전에 반드시 통과해야 하는 검사.
 *
 * 라이선스를 사람이 기억으로 판단하지 않게 한다.
 * 조사 과정에서 실제로 "MIT 저장소의 NC 모델"에 걸릴 뻔했다.
 */
export function assertUsable(assetId: string): ExternalAsset {
  const asset = resolveAsset(assetId);
  const terms = LICENSES[asset.license];

  if (!terms.commercialUse) {
    throw new Error(
      `${asset.name} 은 ${terms.label} 이라 상업 제품에 쓸 수 없습니다. ` +
        (asset.caveat ?? ''),
    );
  }
  return asset;
}

export interface ExtractionPlan {
  assetId: string;
  license: string;
  /** 결과물이 승계하는 라이선스. 원본과 같다. */
  derivedLicense: string;
  attribution: string;
  /** 이 코퍼스에서 뽑아야 할 음절. HVPT 대립쌍의 토큰들이다. */
  targetTokens: string[];
  /** 화자 다양성 요건. */
  requiredSpeakers: number;
  availableSpeakers: number | null;
  feasible: boolean;
  blockers: string[];
}

export const REQUIRED_SPEAKERS = 8;

/**
 * 추출 계획을 세운다. 실행하지 않는다 —
 * 코퍼스를 내려받고 정렬하는 것은 사람이 판단해서 할 일이다.
 */
export function planExtraction(assetId: string, targetTokens: string[]): ExtractionPlan {
  const asset = assertUsable(assetId);
  const terms = LICENSES[asset.license];
  const source = CORPUS_SOURCES.find((c) => c.assetId === assetId);

  const blockers: string[] = [];

  if (!source) {
    blockers.push('CORPUS_SOURCES 에 등록되지 않은 자산입니다');
  } else if (source.speakers === null) {
    blockers.push('화자 수가 실측되지 않았습니다. 내려받아 세기 전에는 요건 충족 여부를 알 수 없습니다');
  } else if (source.speakers < REQUIRED_SPEAKERS) {
    blockers.push(`화자 ${source.speakers}명 — HVPT 요건 ${REQUIRED_SPEAKERS}명에 미달`);
  }

  // 읽기 발화 코퍼스는 최소대립쌍을 통째로 갖고 있지 않다.
  blockers.push('강제 정렬(forced alignment)로 음절 경계를 찾아야 합니다. 원본에 최소대립쌍이 그대로 없습니다');

  return {
    assetId,
    license: terms.label,
    derivedLicense: terms.label,
    attribution: asset.attribution,
    targetTokens,
    requiredSpeakers: REQUIRED_SPEAKERS,
    availableSpeakers: source?.speakers ?? null,
    feasible: blockers.length === 1, // 정렬 작업은 예정된 일이라 차단 요인이 아니다
    blockers,
  };
}

/**
 * 지금 무엇이 가능하고 무엇이 막혀 있는지.
 * 관리자 화면이 이 값을 보여준다 — "곧 됩니다"로 넘어가지 않기 위해서.
 */
export function corpusReadiness() {
  return CORPUS_SOURCES.map((source) => {
    const asset = resolveAsset(source.assetId);
    return {
      name: asset.name,
      license: LICENSES[asset.license].label,
      commercialUse: LICENSES[asset.license].commercialUse,
      speakers: source.speakers,
      hours: source.hours,
      downloadUrl: source.downloadUrl,
      meetsSpeakerRequirement: source.speakers !== null && source.speakers >= REQUIRED_SPEAKERS,
    };
  });
}
