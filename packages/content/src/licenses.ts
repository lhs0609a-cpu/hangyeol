/*
 * 외부 자산 라이선스 레지스트리.
 *
 * 08번 문서 §6: "외부 콘텐츠를 복제하지 않는다. 자체 제작 또는 라이선스 확보분만 사용."
 * 09번 문서 L5: 저작권은 런칭 전 해소해야 할 법률 검토 항목이다.
 *
 * 이 파일이 존재하는 이유는 하나다. "무료로 보이는 것"과 "우리가 쓸 수 있는 것"이
 * 다르기 때문이다. 실제로 조사해 보니 공개된 한국어 TTS 모델 대부분이
 * 비상업(NC) 이었다. 코드가 MIT 여도 학습 데이터가 NC 면 모델도 NC 다.
 *
 * 규칙: commercialUse 가 false 인 자산은 빌드에서 차단한다. 예외 없다.
 */

export type LicenseId =
  | 'CC0-1.0'
  | 'CC-BY-4.0'
  | 'CC-BY-2.0-FR'
  | 'CC-BY-SA-4.0'
  | 'CC-BY-NC-4.0'
  | 'CC-BY-NC-SA-4.0'
  | 'MIT'
  | 'OFL-1.1'
  | 'KOGL-1'
  | 'KOGL-2'
  | 'proprietary';

export interface LicenseTerms {
  id: LicenseId;
  label: string;
  /** 상업적 이용이 허용되는가. 이 사업은 유료 SaaS 이므로 false 면 쓸 수 없다. */
  commercialUse: boolean;
  /** 출처 표시가 필요한가. */
  attributionRequired: boolean;
  /** 2차 저작물에 같은 라이선스를 강요하는가(Share-Alike). 우리 콘텐츠에 전염된다. */
  shareAlike: boolean;
}

export const LICENSES: Readonly<Record<LicenseId, LicenseTerms>> = Object.freeze({
  'CC0-1.0': { id: 'CC0-1.0', label: 'CC0 1.0 (퍼블릭 도메인)', commercialUse: true, attributionRequired: false, shareAlike: false },
  'CC-BY-4.0': { id: 'CC-BY-4.0', label: 'CC BY 4.0', commercialUse: true, attributionRequired: true, shareAlike: false },
  'CC-BY-2.0-FR': { id: 'CC-BY-2.0-FR', label: 'CC BY 2.0 FR', commercialUse: true, attributionRequired: true, shareAlike: false },
  'CC-BY-SA-4.0': { id: 'CC-BY-SA-4.0', label: 'CC BY-SA 4.0', commercialUse: true, attributionRequired: true, shareAlike: true },
  'CC-BY-NC-4.0': { id: 'CC-BY-NC-4.0', label: 'CC BY-NC 4.0 (비상업)', commercialUse: false, attributionRequired: true, shareAlike: false },
  'CC-BY-NC-SA-4.0': { id: 'CC-BY-NC-SA-4.0', label: 'CC BY-NC-SA 4.0 (비상업)', commercialUse: false, attributionRequired: true, shareAlike: true },
  MIT: { id: 'MIT', label: 'MIT', commercialUse: true, attributionRequired: true, shareAlike: false },
  'OFL-1.1': { id: 'OFL-1.1', label: 'SIL Open Font License 1.1', commercialUse: true, attributionRequired: true, shareAlike: false },
  'KOGL-1': { id: 'KOGL-1', label: '공공누리 제1유형', commercialUse: true, attributionRequired: true, shareAlike: false },
  'KOGL-2': { id: 'KOGL-2', label: '공공누리 제2유형 (상업적 이용 금지)', commercialUse: false, attributionRequired: true, shareAlike: false },
  proprietary: { id: 'proprietary', label: '독점 · 별도 계약 필요', commercialUse: false, attributionRequired: true, shareAlike: false },
});

export type AssetKind = 'speech-corpus' | 'tts-model' | 'sentence-corpus' | 'font' | 'software';

export interface ExternalAsset {
  id: string;
  name: string;
  kind: AssetKind;
  license: LicenseId;
  url: string;
  /** 표기 문구. attributionRequired 면 화면이나 문서에 이대로 넣는다. */
  attribution: string;
  /** 우리 제품에서 실제로 어디에 쓰는가. 'blocked' 면 쓰지 않는다. */
  usage: string;
  /** 조사하면서 알게 된 함정. 다음 사람이 같은 실수를 하지 않도록 남긴다. */
  caveat?: string;
  verifiedAt: string;
}

/**
 * 조사해서 확인한 자산 목록.
 *
 * 전부 2026-09-01 에 원본 페이지를 직접 확인했다.
 * 라이선스는 바뀐다. 재확인 담당자와 주기를 09번 문서 §1 처럼 정해야 한다.
 */
export const EXTERNAL_ASSETS: readonly ExternalAsset[] = Object.freeze([
  {
    id: 'zeroth-korean',
    name: 'Zeroth-Korean 음성 코퍼스',
    kind: 'speech-corpus',
    license: 'CC-BY-4.0',
    url: 'https://openslr.org/40/',
    attribution: 'Zeroth-Korean corpus (Lucas Jo, Wonkyum Lee / Atlas Guide) — CC BY 4.0',
    usage:
      '다청 원본 후보 · HVPT 실화자 토큰 추출 후보. 51.6시간 · 화자 105명이라 ' +
      'HVPT 의 "화자 8명" 요건을 실제 사람 목소리로 채울 수 있는 유일한 상업 가능 경로다.',
    caveat:
      '읽기 발화 코퍼스라 최소대립쌍(개/캐/깨)이 그대로 들어 있지 않다. ' +
      '토큰을 잘라 쓰려면 정렬·추출 작업이 필요하고, 그 결과물도 CC BY 4.0 을 승계한다.',
    verifiedAt: '2026-09-01',
  },
  {
    id: 'common-voice-ko',
    name: 'Mozilla Common Voice (한국어)',
    kind: 'speech-corpus',
    license: 'CC0-1.0',
    url: 'https://commonvoice.mozilla.org/ko/datasets',
    attribution: 'Mozilla Common Voice — CC0 1.0 (표시 의무 없음, 그래도 표기한다)',
    usage: '다화자 음성 후보. CC0 라 승계 의무가 없어 가공이 가장 자유롭다.',
    caveat:
      '한국어 분량이 언어별로 편차가 크다. 실제 내려받아 화자 수와 시간을 세기 전에는 ' +
      '"충분하다"고 가정하지 않는다.',
    verifiedAt: '2026-09-01',
  },
  {
    id: 'tatoeba',
    name: 'Tatoeba 예문 코퍼스',
    kind: 'sentence-corpus',
    license: 'CC-BY-2.0-FR',
    url: 'https://tatoeba.org/en/downloads',
    attribution: '예문 일부는 Tatoeba (https://tatoeba.org) 에서 가져왔으며 CC BY 2.0 FR 로 배포됩니다',
    usage: '단어장 예문 · 다청 대본 후보 · 시나리오 발화 후보 (한국어-영어 대역)',
    caveat:
      '텍스트는 상업 이용 가능하지만 오디오는 다르다. ' +
      '기여자가 비마케팅 조건을 붙인 클립이 섞여 있어 음성은 클립 단위로 확인해야 한다. ' +
      '텍스트만 쓰고 오디오는 쓰지 않는 것이 안전하다.',
    verifiedAt: '2026-09-01',
  },
  {
    id: 'ibm-plex-sans-kr',
    name: 'IBM Plex Sans KR',
    kind: 'font',
    license: 'OFL-1.1',
    url: 'https://github.com/IBM/plex',
    attribution: 'IBM Plex Sans KR — SIL Open Font License 1.1',
    usage: '전 화면 본문 서체 (06번 문서 §2 지정)',
    verifiedAt: '2026-09-01',
  },
  {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    kind: 'font',
    license: 'OFL-1.1',
    url: 'https://github.com/IBM/plex',
    attribution: 'IBM Plex Mono — SIL Open Font License 1.1',
    usage: '모든 숫자 · eyebrow 라벨 (06번 문서 §2)',
    verifiedAt: '2026-09-01',
  },
  {
    id: 'piper-tts',
    name: 'Piper TTS (엔진)',
    kind: 'software',
    license: 'MIT',
    url: 'https://github.com/rhasspy/piper',
    attribution: 'Piper TTS — MIT License',
    usage: '음원 사전 생성 엔진 후보. 엔진 자체는 쓸 수 있다.',
    caveat:
      '엔진이 MIT 여도 음성 모델은 학습 데이터의 라이선스를 승계한다. ' +
      '아래 piper-voice-ko 를 볼 것.',
    verifiedAt: '2026-09-01',
  },

  // ── 여기서부터는 쓸 수 없는 것들 ─────────────────────────
  // 지우지 않고 남긴다. 다음 사람이 다시 조사하다가 같은 함정에 빠지지 않도록.

  {
    id: 'piper-voice-ko',
    name: 'Piper 한국어 음성 모델 (ko_KR/kss)',
    kind: 'tts-model',
    license: 'CC-BY-NC-SA-4.0',
    url: 'https://huggingface.co/rhasspy/piper-voices/tree/main/ko/ko_KR',
    attribution: '—',
    usage: 'blocked — 상업 이용 불가',
    caveat:
      'Piper 저장소 헤더는 MIT 라고 표시되지만 한국어 음성은 KSS 데이터셋으로 학습됐고 ' +
      'KSS 는 CC BY-NC-SA 4.0 이다. 코드 라이선스와 모델 라이선스를 혼동하기 쉬운 지점이다. ' +
      '게다가 단일 화자라 HVPT 의 화자 8명 요건 자체를 만족하지 못한다.',
    verifiedAt: '2026-09-01',
  },
  {
    id: 'kss',
    name: 'KSS (Korean Single Speaker Speech)',
    kind: 'speech-corpus',
    license: 'CC-BY-NC-SA-4.0',
    url: 'https://github.com/Kyubyong/kss',
    attribution: '—',
    usage: 'blocked — 비상업 라이선스',
    caveat: '한국어 TTS 자료 중 가장 널리 쓰이지만 NC 다. 상업 제품에 넣으면 위반이다.',
    verifiedAt: '2026-09-01',
  },
  {
    id: 'mms-tts-kor',
    name: 'Meta MMS TTS (한국어)',
    kind: 'tts-model',
    license: 'CC-BY-NC-4.0',
    url: 'https://huggingface.co/facebook/mms-tts-kor',
    attribution: '—',
    usage: 'blocked — 비상업 라이선스',
    caveat: 'MMS 는 코드와 가중치 모두 CC-BY-NC-4.0 이다.',
    verifiedAt: '2026-09-01',
  },
]);

/** 실제로 쓸 수 있는 것만. */
export function usableAssets(): ExternalAsset[] {
  return EXTERNAL_ASSETS.filter((a) => LICENSES[a.license].commercialUse);
}

/** 조사했지만 쓸 수 없는 것. 기록으로 남긴다. */
export function blockedAssets(): ExternalAsset[] {
  return EXTERNAL_ASSETS.filter((a) => !LICENSES[a.license].commercialUse);
}

/** 출처 표시가 필요한 자산의 표기 문구. 화면 하단이나 문서에 그대로 넣는다. */
export function attributionLines(): string[] {
  return usableAssets()
    .filter((a) => LICENSES[a.license].attributionRequired)
    .map((a) => a.attribution);
}

/**
 * Share-Alike 자산은 우리 콘텐츠에 라이선스를 전염시킨다.
 * 쓰기 전에 반드시 의식해야 하므로 따로 뽑아 둔다.
 */
export function shareAlikeAssets(): ExternalAsset[] {
  return usableAssets().filter((a) => LICENSES[a.license].shareAlike);
}

export const LICENSE_REVIEW = {
  lastVerified: '2026-09-01',
  /** 09번 문서 §1 이 약관에 요구한 것과 같은 주기. 라이선스도 바뀐다. */
  reviewEveryDays: 90,
  note:
    '조사 결과 공개 한국어 TTS 모델은 대부분 비상업이다. ' +
    'HVPT 의 화자 8명은 TTS 가 아니라 상업 가능 실화자 코퍼스(Zeroth CC BY 4.0 · Common Voice CC0)' +
    '에서 확보하는 편이 현실적이다.',
} as const;
