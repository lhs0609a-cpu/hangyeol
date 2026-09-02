import Link from 'next/link';
import {
  BUILD_STATUS,
  DEMAND_SOURCE,
  DEMAND_SPIKES,
  MARKET_HEADLINE,
  MARKET_SIZE,
  TEACHER_PAIN,
  VALUE_PROPS,
  buildDeck,
  type MarketFact,
} from '@hangyeol/content';
import { Button, SlideRenderer } from '@hangyeol/ui';

/*
 * 랜딩 — 로그인하지 않은 방문자가 처음 보는 화면.
 *
 * 순서에 이유가 있다.
 *   1. 무엇인지 한 문장   — 3초 안에 못 알아보면 나간다
 *   2. 실물 슬라이드       — 말로 설명하는 대신 제품을 보인다
 *   3. 강사의 문제         — 시장이 크다는 말보다 "내 얘기" 가 먼저다
 *   4. 우리가 주는 것      — 기능이 아니라 결과로 적는다
 *   5. 시장 근거           — 그다음에 숫자를 꺼낸다
 *   6. 가입                — 승인제라는 걸 여기서 미리 말한다
 *
 * 숫자는 전부 packages/content/market.ts 에서 온다. 화면에 박지 않는다.
 * 마케팅 숫자는 반드시 낡고, 흩어져 있으면 어느 게 최신인지 아무도 모른다.
 */

export const metadata = {
  title: '한결 — 한국어 강사를 위한 교재와 수업 도구',
  description:
    '읽으면 되는 수업 대본과 슬라이드를 드립니다. italki · Preply 강사가 준비 없이 바로 가르칠 수 있습니다.',
};

export default function LandingPage() {
  // 실물을 보인다. 12차시(을/를)는 문형이 눈에 잡혀서 처음 보는 사람도 안다.
  const demo = buildDeck(12);
  const slide = demo?.slides.find((s) => s.kind === 'dialogue') ?? demo?.slides[3];

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <TopBar />

      {/* ── 1. 한 문장 ─────────────────────────────── */}
      <Section>
        <p className="t-eyebrow" style={{ color: 'var(--indigo)' }}>
          한국어 강사를 위한 교재
        </p>
        <h1
          style={{
            fontSize: 'var(--fs-display)',
            fontWeight: 650,
            letterSpacing: '-0.03em',
            lineHeight: 1.25,
            margin: '14px 0 0',
            maxWidth: 620,
          }}
        >
          준비 없이 바로 가르칩니다
        </h1>
        <p
          className="t-body-lg"
          style={{ margin: '16px 0 0', maxWidth: 520, color: 'var(--ink-2)', lineHeight: 1.7 }}
        >
          첫 멘트부터 마무리까지 그대로 적힌 수업 대본과, 이미 만들어진 슬라이드를 드립니다.
          강사는 말만 하면 됩니다.
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 26, flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <Button kind="jade" size="lg">
              강사 신청하기
            </Button>
          </Link>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <Button size="lg">이미 계정이 있어요</Button>
          </Link>
        </div>

        <p className="t-caption tone-muted" style={{ marginTop: 12 }}>
          신청 후 확인을 거쳐 승인해 드립니다. 교재가 그대로 전달되기 때문입니다.
        </p>
      </Section>

      {/* ── 2. 실물 ────────────────────────────────── */}
      {slide && demo && (
        <Section tint>
          <p className="t-eyebrow" style={{ color: 'var(--indigo)' }}>
            {demo.unitNo}차시 · {demo.title}
          </p>
          <h2 className="t-h1" style={{ margin: '10px 0 18px' }}>
            차시를 열면 이 화면이 나옵니다
          </h2>

          <div style={{ maxWidth: 660 }}>
            <SlideRenderer slide={slide} />
          </div>

          <p className="t-body" style={{ margin: '16px 0 0', maxWidth: 520, color: 'var(--ink-2)' }}>
            {demo.goalStatement}. 이 차시에 {demo.slides.length}장이 있고, 각 장에 강사가 무슨 말을
            할지 적혀 있습니다.
          </p>
        </Section>
      )}

      {/* ── 3. 강사의 문제 ─────────────────────────── */}
      <Section>
        <h2 className="t-h1" style={{ margin: 0 }}>
          가르쳐 보면 아는 것들
        </h2>
        <div style={{ display: 'grid', gap: 1, marginTop: 20, background: 'var(--rule)' }}>
          {TEACHER_PAIN.map((p) => (
            <div key={p.title} style={{ background: 'var(--bg)', padding: '18px 0' }}>
              <h3 className="t-h2" style={{ margin: 0 }}>
                {p.title}
              </h3>
              <p
                className="t-body"
                style={{ margin: '6px 0 0', color: 'var(--ink-2)', maxWidth: 560, lineHeight: 1.7 }}
              >
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 4. 우리가 주는 것 ──────────────────────── */}
      <Section tint>
        <h2 className="t-h1" style={{ margin: 0 }}>
          한결이 하는 일
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 14,
            marginTop: 20,
          }}
        >
          {VALUE_PROPS.map((v) => (
            <div
              key={v.title}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--rule)',
                borderRadius: 'var(--r-lg)',
                padding: 20,
              }}
            >
              <p className="t-eyebrow" style={{ color: 'var(--jade)' }}>
                {v.metric}
              </p>
              <h3 className="t-h2" style={{ margin: '10px 0 0' }}>
                {v.title}
              </h3>
              <p className="t-body-sm" style={{ margin: '8px 0 0', color: 'var(--ink-2)', lineHeight: 1.7 }}>
                {v.body}
              </p>
            </div>
          ))}
        </div>

        <p className="t-caption tone-muted" style={{ marginTop: 16 }}>
          현재 {BUILD_STATUS.levels} {BUILD_STATUS.unitsWritten}차시가 준비되어 있습니다.
          {' '}
          {BUILD_STATUS.note}.
        </p>
      </Section>

      {/* ── 5. 시장 근거 ──────────────────────────── */}
      <Section>
        <p className="t-eyebrow" style={{ color: 'var(--indigo)' }}>
          지금 시장
        </p>
        <h2 className="t-h1" style={{ margin: '10px 0 0' }}>
          한국어를 배우는 사람이 계속 늘고 있습니다
        </h2>

        <FactGrid facts={MARKET_HEADLINE} />

        <div style={{ marginTop: 34 }}>
          <h3 className="t-h2" style={{ margin: 0 }}>
            한류 콘텐츠가 나올 때마다 학습자가 튑니다
          </h3>
          <div style={{ marginTop: 12 }}>
            {DEMAND_SPIKES.map((d) => (
              <div
                key={d.when}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr auto',
                  gap: 12,
                  alignItems: 'baseline',
                  padding: '11px 0',
                  borderTop: '1px solid var(--rule-soft)',
                }}
              >
                <span className="t-body-sm mono tone-muted">{d.when}</span>
                <span className="t-body">{d.what}</span>
                <span className="t-body-sm" style={{ color: 'var(--jade)' }}>
                  {d.effect}
                </span>
              </div>
            ))}
          </div>
          <Cite source={DEMAND_SOURCE.source} url={DEMAND_SOURCE.sourceUrl} />
        </div>

        <div style={{ marginTop: 34 }}>
          <h3 className="t-h2" style={{ margin: 0 }}>
            그런데 가르치는 사람에게는 교재가 없습니다
          </h3>
          <FactGrid facts={MARKET_SIZE} />
        </div>
      </Section>

      {/* ── 6. 가입 ───────────────────────────────── */}
      <Section tint>
        <h2 className="t-h1" style={{ margin: 0 }}>
          함께 가르칠 강사를 찾습니다
        </h2>
        <p
          className="t-body-lg"
          style={{ margin: '12px 0 0', maxWidth: 520, color: 'var(--ink-2)', lineHeight: 1.7 }}
        >
          신청해 주시면 확인 후 승인해 드립니다. 교재가 그대로 전달되기 때문에 한 분씩 확인합니다.
        </p>
        <div style={{ marginTop: 22 }}>
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <Button kind="jade" size="lg">
              강사 신청하기
            </Button>
          </Link>
        </div>
      </Section>

      <footer
        style={{
          borderTop: '1px solid var(--rule)',
          padding: '24px 0',
          marginTop: 20,
        }}
      >
        <div style={{ maxWidth: 940, margin: '0 auto', padding: '0 24px' }}>
          <p className="t-caption tone-muted" style={{ margin: 0 }}>
            한결 · 한국어 강사를 위한 교재와 수업 도구
          </p>
          <p className="t-caption tone-muted" style={{ margin: '6px 0 0' }}>
            <Link href="/licenses" style={{ color: 'inherit' }}>
              사용한 자료의 출처
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

function TopBar() {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--rule)',
        background: 'var(--surface)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 940,
          margin: '0 auto',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            aria-hidden="true"
            className="mono"
            style={{
              width: 22,
              height: 22,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 5,
              background: 'var(--ink)',
              color: 'var(--surface)',
              fontSize: 'var(--fs-caption)',
            }}
          >
            H
          </span>
          <strong className="t-body-lg">한결</strong>
        </span>

        <Link href="/login" style={{ textDecoration: 'none' }}>
          <Button size="sm">로그인</Button>
        </Link>
      </div>
    </header>
  );
}

function Section({ children, tint }: { children: React.ReactNode; tint?: boolean }) {
  return (
    <section style={{ background: tint ? 'var(--surface)' : 'transparent', padding: '52px 0' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '0 24px' }}>{children}</div>
    </section>
  );
}

function FactGrid({ facts }: { facts: MarketFact[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 14,
        marginTop: 18,
      }}
    >
      {facts.map((f) => (
        <div key={f.label} style={{ paddingTop: 14, borderTop: '2px solid var(--ink)' }}>
          <div
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 650,
              letterSpacing: '-0.02em',
            }}
          >
            {f.value}
          </div>
          <div className="t-body-sm" style={{ marginTop: 4 }}>
            {f.label}
          </div>
          {f.note && (
            <p className="t-caption tone-muted" style={{ margin: '8px 0 0', lineHeight: 1.6 }}>
              {f.note}
            </p>
          )}
          <Cite source={f.source} url={f.sourceUrl} />
        </div>
      ))}
    </div>
  );
}

/** 출처는 숫자마다 붙인다. 근거 없는 숫자를 화면에 올리지 않기 위한 강제 장치다. */
function Cite({ source, url }: { source: string; url: string }) {
  return (
    <p className="t-caption tone-muted" style={{ margin: '8px 0 0' }}>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
        {source}
      </a>
    </p>
  );
}
