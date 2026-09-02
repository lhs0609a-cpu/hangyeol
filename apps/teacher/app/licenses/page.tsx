import {
  blockedAssets,
  EXTERNAL_ASSETS,
  LICENSE_REVIEW,
  LICENSES,
  shareAlikeAssets,
  usableAssets,
} from '@hangyeol/content';
import { Eyebrow, Panel, Tag } from '@hangyeol/ui';
import { Shell } from '../Shell';

export const metadata = { title: '한결 — 출처 표시' };

/*
 * 출처 표시 화면.
 *
 * CC BY 계열은 출처 표시가 라이선스 조건이다. 어딘가에 두면 되지만,
 * 문서 구석에 묻어 두면 실제로 지켜지는지 아무도 모른다.
 * 제품 안에 두고 레지스트리에서 자동 생성하면 자산을 추가할 때마다 따라온다.
 *
 * 학생 앱에는 이 화면이 없다 — 화이트라벨이라 어떤 링크도 밖으로 새면 안 된다.
 * 학생 화면에 쓰는 자산이 생기면 강사가 대신 표시하는 구조를 따로 설계해야 한다.
 */

export default function LicensesPage() {
  const usable = usableAssets();
  const blocked = blockedAssets();
  const shareAlike = shareAlikeAssets();

  return (
    <Shell wide={false}>
      <Eyebrow>출처 표시</Eyebrow>
      <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 600, letterSpacing: '-0.02em', margin: '8px 0 6px' }}>
        외부 자산과 라이선스
      </h1>
      <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', lineHeight: 1.7 }}>
        이 제품이 쓰는 외부 자산과 그 라이선스입니다.
        마지막 확인 <span className="mono">{LICENSE_REVIEW.lastVerified}</span> ·
        {' '}<span className="mono">{LICENSE_REVIEW.reviewEveryDays}</span>일마다 재확인합니다.
      </p>

      <Panel style={{ marginTop: 20 }}>
        <Eyebrow>사용 중 · {usable.length}건</Eyebrow>
        <div style={{ marginTop: 12 }}>
          {usable.map((a) => (
            <AssetRow key={a.id} asset={a} />
          ))}
        </div>
      </Panel>

      {shareAlike.length > 0 && (
        <Panel style={{ marginTop: 14, background: 'var(--chija-w)', border: '1px solid transparent' }}>
          <Eyebrow>Share-Alike 주의</Eyebrow>
          <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--chija)', marginTop: 8, lineHeight: 1.7 }}>
            아래 자산은 2차 저작물에 같은 라이선스를 요구합니다.
            우리 콘텐츠에 섞으면 그 부분이 같은 라이선스로 묶입니다.
          </p>
          <div style={{ marginTop: 8 }}>
            {shareAlike.map((a) => (
              <div key={a.id} style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--chija)' }}>
                · {a.name}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel style={{ marginTop: 14 }}>
        <Eyebrow>검토했지만 쓰지 않음 · {blocked.length}건</Eyebrow>
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 8, lineHeight: 1.7 }}>
          지우지 않고 남깁니다. 다음에 조사하는 사람이 같은 함정을 밟지 않도록.
        </p>
        <div style={{ marginTop: 12 }}>
          {blocked.map((a) => (
            <AssetRow key={a.id} asset={a} blocked />
          ))}
        </div>
      </Panel>

      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 20, lineHeight: 1.8 }}>
        {LICENSE_REVIEW.note}
      </p>
    </Shell>
  );
}

function AssetRow({
  asset,
  blocked = false,
}: {
  asset: (typeof EXTERNAL_ASSETS)[number];
  blocked?: boolean;
}) {
  const terms = LICENSES[asset.license];

  return (
    <div
      style={{
        padding: '12px 0',
        borderTop: '1px solid var(--rule-soft)',
        opacity: blocked ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>{asset.name}</span>
        <Tag tone={blocked ? 'h' : terms.shareAlike ? 'c' : 'j'}>{terms.label}</Tag>
      </div>

      <a
        href={asset.url}
        target="_blank"
        rel="noreferrer"
        className="mono"
        style={{ display: 'block', fontSize: 'var(--fs-caption)', marginTop: 3, wordBreak: 'break-all' }}
      >
        {asset.url}
      </a>

      <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.7 }}>
        {asset.usage}
      </div>

      {asset.caveat && (
        <div
          style={{
            fontSize: 'var(--fs-caption)',
            color: blocked ? 'var(--honghwa)' : 'var(--chija)',
            marginTop: 6,
            lineHeight: 1.7,
          }}
        >
          {asset.caveat}
        </div>
      )}

      {!blocked && terms.attributionRequired && (
        <div
          className="mono"
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--ink-3)',
            marginTop: 6,
            padding: '8px 10px',
            background: 'var(--rule-soft)',
            borderRadius: 6,
          }}
        >
          {asset.attribution}
        </div>
      )}
    </div>
  );
}
