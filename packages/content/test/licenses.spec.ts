import { describe, expect, it } from 'vitest';
import {
  attributionLines,
  blockedAssets,
  EXTERNAL_ASSETS,
  LICENSE_REVIEW,
  LICENSES,
  shareAlikeAssets,
  usableAssets,
} from '@hangyeol/content';

/*
 * 라이선스는 사람이 기억으로 판단하면 안 된다.
 *
 * 조사 과정에서 실제로 함정을 밟을 뻔했다 —
 * Piper 저장소 헤더는 MIT 인데 한국어 음성은 KSS(CC BY-NC-SA)로 학습됐다.
 * 코드 라이선스와 모델 라이선스는 다르다.
 */

describe('라이선스 레지스트리', () => {
  it('비상업 라이선스는 상업 이용 불가로 표시된다', () => {
    for (const id of ['CC-BY-NC-4.0', 'CC-BY-NC-SA-4.0', 'KOGL-2', 'proprietary'] as const) {
      expect(LICENSES[id].commercialUse, id).toBe(false);
    }
  });

  it('상업 가능 라이선스가 정확히 분류된다', () => {
    for (const id of ['CC0-1.0', 'CC-BY-4.0', 'CC-BY-2.0-FR', 'MIT', 'OFL-1.1', 'KOGL-1'] as const) {
      expect(LICENSES[id].commercialUse, id).toBe(true);
    }
  });

  it('CC0 만 출처 표시가 면제된다', () => {
    const exempt = Object.values(LICENSES).filter((l) => !l.attributionRequired);
    expect(exempt.map((l) => l.id)).toEqual(['CC0-1.0']);
  });

  it('Share-Alike 는 SA 가 붙은 것만이다', () => {
    for (const terms of Object.values(LICENSES)) {
      expect(terms.shareAlike, terms.id).toBe(terms.id.includes('SA'));
    }
  });
});

describe('등록된 자산', () => {
  it('id 가 유일하다', () => {
    const ids = EXTERNAL_ASSETS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('전부 원본 URL 과 확인 날짜를 갖는다', () => {
    for (const asset of EXTERNAL_ASSETS) {
      expect(asset.url, asset.id).toMatch(/^https:\/\//);
      expect(asset.verifiedAt, asset.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('사용 중인 자산에 비상업 라이선스가 섞여 있지 않다', () => {
    for (const asset of usableAssets()) {
      expect(LICENSES[asset.license].commercialUse, asset.name).toBe(true);
      expect(asset.usage, asset.name).not.toMatch(/^blocked/);
    }
  });

  it('차단된 자산은 usage 가 blocked 로 시작하고 이유가 적혀 있다', () => {
    for (const asset of blockedAssets()) {
      expect(asset.usage, asset.name).toMatch(/^blocked/);
      expect(asset.caveat, `${asset.name} 에 차단 이유가 없다`).toBeTruthy();
    }
  });

  it('출처 표시가 필요한 자산은 표기 문구가 비어 있지 않다', () => {
    for (const asset of usableAssets()) {
      if (!LICENSES[asset.license].attributionRequired) continue;
      expect(asset.attribution.trim().length, asset.name).toBeGreaterThan(3);
      expect(asset.attribution, asset.name).not.toBe('—');
    }
  });

  it('표기 문구 목록이 실제로 만들어진다', () => {
    const lines = attributionLines();
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((l) => l.trim().length > 0)).toBe(true);
  });
});

describe('조사에서 실제로 걸러낸 함정', () => {
  it('Piper 한국어 음성은 차단돼 있다 — 저장소는 MIT 지만 모델은 KSS 기반이다', () => {
    const piperVoice = EXTERNAL_ASSETS.find((a) => a.id === 'piper-voice-ko')!;
    expect(LICENSES[piperVoice.license].commercialUse).toBe(false);
    expect(piperVoice.caveat).toContain('KSS');
  });

  it('Piper 엔진 자체는 쓸 수 있다 — 코드와 모델을 구분한다', () => {
    const engine = EXTERNAL_ASSETS.find((a) => a.id === 'piper-tts')!;
    expect(LICENSES[engine.license].commercialUse).toBe(true);
    expect(engine.caveat).toContain('승계');
  });

  it('Tatoeba 는 텍스트만 쓴다 — 오디오는 비마케팅 조건이 섞여 있다', () => {
    const tatoeba = EXTERNAL_ASSETS.find((a) => a.id === 'tatoeba')!;
    expect(LICENSES[tatoeba.license].commercialUse).toBe(true);
    expect(tatoeba.caveat).toContain('오디오');
  });

  it('상업 가능한 실화자 코퍼스가 최소 하나는 남아 있다', () => {
    // 이게 0 이 되면 HVPT 의 화자 8명 요건을 채울 방법이 없어진다.
    const corpora = usableAssets().filter((a) => a.kind === 'speech-corpus');
    expect(corpora.length).toBeGreaterThan(0);
  });
});

describe('Share-Alike 는 우리 콘텐츠에 전염된다', () => {
  it('SA 자산을 쓸 때는 목록에 잡힌다', () => {
    for (const asset of shareAlikeAssets()) {
      expect(LICENSES[asset.license].shareAlike).toBe(true);
    }
  });
});

describe('재확인 주기', () => {
  it('마지막 확인일이 미래가 아니다', () => {
    expect(Date.parse(LICENSE_REVIEW.lastVerified)).toBeLessThanOrEqual(Date.now());
  });

  it('재확인 주기가 정해져 있다', () => {
    expect(LICENSE_REVIEW.reviewEveryDays).toBeGreaterThan(0);
  });
});
