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
  | 'Pexels'
  | 'PD-old'
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
  // 표시 의무는 없지만 photos.ts 에 촬영자를 남긴다. 조건이 아니라 예의다.
  Pexels: { id: 'Pexels', label: 'Pexels 라이선스', commercialUse: true, attributionRequired: false, shareAlike: false },
  /*
   * 저작권이 소멸한 옛 저작물. 표시 의무가 법적으로는 없지만 우리는 적는다 —
   * 어느 소장본을 떴는지가 자료의 값이고, 적어 두지 않으면 다음 사람이
   * 같은 조사를 처음부터 다시 한다.
   */
  'PD-old': { id: 'PD-old', label: '퍼블릭 도메인 (저작권 소멸)', commercialUse: true, attributionRequired: false, shareAlike: false },
  proprietary: { id: 'proprietary', label: '독점 · 별도 계약 필요', commercialUse: false, attributionRequired: true, shareAlike: false },
});

export type AssetKind = 'speech-corpus' | 'tts-model' | 'sentence-corpus' | 'font' | 'software' | 'photo';

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
    usage: '사용하지 않음 — 수업은 강사가 실시간으로 한다',
    caveat:
      '한때 HVPT 화자 8명을 채울 경로로 검토했으나, 학생 자습 도구를 걷어내면서 ' +
      '필요가 사라졌다. 기록으로 남긴다.',
    verifiedAt: '2026-09-01',
  },
  {
    id: 'common-voice-ko',
    name: 'Mozilla Common Voice (한국어)',
    kind: 'speech-corpus',
    license: 'CC0-1.0',
    url: 'https://commonvoice.mozilla.org/ko/datasets',
    attribution: 'Mozilla Common Voice — CC0 1.0 (표시 의무 없음, 그래도 표기한다)',
    usage: '사용하지 않음 — 오디오 자산을 만들지 않기로 했다',
    caveat: 'CC0 라 제약은 없다. 필요해지면 다시 검토할 수 있다.',
    verifiedAt: '2026-09-01',
  },
  {
    id: 'tatoeba',
    name: 'Tatoeba 예문 코퍼스',
    kind: 'sentence-corpus',
    license: 'CC-BY-2.0-FR',
    url: 'https://tatoeba.org/en/downloads',
    attribution: '예문 일부는 Tatoeba (https://tatoeba.org) 에서 가져왔으며 CC BY 2.0 FR 로 배포됩니다',
    usage: '단어장 예문 후보 (한국어-영어 대역). 텍스트만.',
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
    id: 'pexels-landing-photos',
    name: 'Pexels 랜딩 사진 7장',
    kind: 'photo',
    license: 'Pexels',
    url: 'https://www.pexels.com/license/',
    attribution:
      '사진 Thirdman · Tima Miroshnichenko · Vanessa Garcia · Youn Seung Jin · Ethan Brooke · leonbastian · Teddy (Pexels)',
    usage: '랜딩 화면의 사진. 목록과 촬영자는 packages/content/src/photos.ts 에 있다.',
    caveat:
      '표시 의무는 없지만 제약은 있다. "이미지 속 인물이 제품을 보증하는 것처럼 보이게 하지 말 것" — ' +
      '그래서 이 사진들을 강사 소개나 수강 후기로 쓰지 않는다. 이름을 붙이고 따옴표를 치는 순간 위반이다. ' +
      'italki · Preply 의 강사 사진을 그대로 가져오는 선택지는 08번 §6 이 막는다. 남의 저작물이면서 개인의 초상이다.',
    verifiedAt: '2026-09-05',
  },

  /*
   * 항목이 아니라 판단 기록이다. 자산이 없으므로 usage 가 blocked 다.
   *
   * 랜딩의 한류 구간에 오징어 게임 · BTS · 케이팝 데몬 헌터스를 넣기로 하면서
   * 실제 스틸컷과 공연 사진을 쓸 수 있는지 확인했다. 쓸 수 없다.
   * 다음 사람이 같은 질문을 다시 하지 않도록 여기 남긴다.
   */
  /*
   * 이 항목은 앞선 판단을 뒤집은 기록이다.
   *
   * photos.ts 에 "훈민정음 해례본 사진은 소장 기관의 촬영물이라 우리가 쓸 수 있는 것이
   * 아니다" 라고 적어 두고 Pexels 의 일반 한문 문서 사진을 대신 썼었다. 그게 틀렸다.
   *
   * 원 저작물(1446년)은 저작권이 소멸했고, 평면 저작물을 있는 그대로 찍은 복제물에는
   * 새 저작권이 생기지 않는다는 것이 위키미디어 공용의 PD-Art 원칙이다.
   * 실제로 규장각 소장본 스캔이 PD-1923 · PD-South Korea 로 공용에 올라와 있다.
   *
   * "소장 기관이 찍었으니 못 쓴다" 는 것은 확인하지 않은 통념이었다.
   * 확인해 보니 쓸 수 있었고, 그래서 대역 사진을 진짜 문서로 바꿨다.
   *
   * 다만 같은 문서의 다른 사진은 사정이 다르다 — 국립한글박물관 전시 사진
   * (훈민정음 해례본 (1).jpg, 5312x2988)은 CC BY-SA 4.0 이다. 해상도는 훨씬 좋지만
   * 로고에 쓰면 동일조건변경허락이 파생물까지 따라온다. 그래서 안 쓴다.
   */
  {
    id: 'hunminjeongeum-haerye-scan',
    name: '훈민정음 해례본 어제 서문 (규장각 소장본 스캔)',
    kind: 'photo',
    license: 'PD-old',
    url: 'https://commons.wikimedia.org/wiki/File:Hunminjeongeum_Haerye_02.jpg',
    attribution: '훈민정음 해례본 (1446) · 서울대학교 규장각한국학연구원 소장본 · 위키미디어 공용',
    usage:
      '랜딩 훈민정음 구간의 서문 이미지(누끼)와 SAMAT 표식(通). ' +
      '원본에서 먹만 남기고 종이와 장서인을 지운 뒤 씁니다.',
    caveat:
      '같은 문서라도 촬영물마다 라이선스가 다르다. 국립한글박물관 전시 사진은 CC BY-SA 4.0 이라 ' +
      '로고에 쓰면 동일조건변경허락이 파생물에 전염된다. 반드시 PD 태그가 붙은 판본만 쓴다. ' +
      '표식으로 쓰는 通 자는 원문 「不相流通」 에서 딴 것이다 — 다른 글자로 바꾸면 출처가 끊긴다.',
    verifiedAt: '2026-09-05',
  },
  {
    id: 'hallyu-ip-imagery',
    name: '한류 콘텐츠 이미지 (오징어 게임 · BTS · 케이팝 데몬 헌터스)',
    kind: 'photo',
    license: 'proprietary',
    url: 'https://www.netflix.com/legal/termsofuse',
    attribution: '—',
    usage: 'blocked — 저작권과 초상권이 겹친다',
    caveat:
      '스틸컷 · 포스터 · 공연 사진 · 로고는 넷플릭스와 소속사의 저작물이고, ' +
      '거기에 출연자 개인의 초상권이 겹친다. 홍보용으로 배포된 이미지라도 ' +
      '제3자의 유료 서비스 랜딩에 쓰라고 준 것이 아니다. ' +
      '대신 이름과 사실은 출처와 함께 화면에 적는다 — 사실을 진술하는 것은 복제가 아니다. ' +
      '그림이 필요한 자리는 어느 공연인지 특정되지 않는 Pexels 사진으로 채운다(hallyu-lightsticks). ' +
      '그 사진의 캡션에 가수 이름을 붙이면 위반이 된다.',
    verifiedAt: '2026-09-05',
  },
  {
    id: 'piper-tts',
    name: 'Piper TTS (엔진)',
    kind: 'software',
    license: 'MIT',
    url: 'https://github.com/rhasspy/piper',
    attribution: 'Piper TTS — MIT License',
    usage: '사용하지 않음 — 음원을 만들지 않는다',
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
    '조사 결과 공개 한국어 TTS 모델은 대부분 비상업이었다. ' +
    '그와 별개로, TTS 음원을 파는 것은 파파고와 같은 것을 파는 셈이라 ' +
    '이 플랫폼을 쓸 이유가 사라진다. 오디오 자산을 만들지 않기로 했다(docs/12). ' +
    '음성 자산 항목은 판단 기록으로 남긴다.',
} as const;
