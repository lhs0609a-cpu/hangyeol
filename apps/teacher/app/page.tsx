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
 * 강사 앱 토큰(본문 13.5px)을 그대로 쓰면 작고 위계가 없다.
 * 콕핏은 하루 8시간 쓰는 도구라 조밀해야 맞지만 랜딩은 다르다.
 * .register-landing 으로 스케일만 바꾼다 — 역할 이름은 같게 둔다.
 *
 * 구성에도 이유가 있다.
 *   히어로에 제품을 같이 둔다        — 스크롤해야 보이면 절반은 안 본다
 *   문제는 어둡게, 해법은 밝게       — 구간이 색으로 갈린다
 *   숫자는 띠로 묶는다               — 흩어 놓으면 하나도 안 남는다
 *   섹션마다 구성을 바꾼다           — 같은 모양이 반복되면 읽기를 멈춘다
 */

export const metadata = {
  title: '한결 — 한국어 강사를 위한 교재와 수업 도구',
  description:
    '읽으면 되는 수업 대본과 슬라이드를 드립니다. italki · Preply 강사가 준비 없이 바로 가르칠 수 있습니다.',
};

export default function LandingPage() {
  // 실물을 보인다. 12차시(을/를)는 문형이 눈에 잡혀 처음 보는 사람도 안다.
  const deck = buildDeck(12);
  const dialogue = deck?.slides.find((s) => s.kind === 'dialogue');
  const drill = deck?.slides.find((s) => s.kind === 'drill');

  return (
    <main className="register-landing" style={{ background: 'var(--canvas)' }}>
      <TopBar />

      {/* ══ 히어로 — 말과 제품을 같은 화면에 ══════════════ */}
      <section style={{ padding: 'var(--sp-section) 0 0' }}>
        <Wrap>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--sp-block)',
              alignItems: 'center',
            }}
          >
            <div>
              <Eyebrow>한국어 강사를 위한 교재</Eyebrow>
              <h1
                style={{
                  fontSize: 'var(--fs-display)',
                  fontWeight: 'var(--fw-semibold)',
                  letterSpacing: 'var(--ls-display)',
                  lineHeight: 1.18,
                  margin: '14px 0 0',
                }}
              >
                준비 없이
                <br />
                바로 가르칩니다
              </h1>

              <p
                style={{
                  fontSize: 'var(--fs-body-lg)',
                  lineHeight: 1.75,
                  color: 'var(--ink-2)',
                  margin: '20px 0 0',
                  maxWidth: 'var(--measure)',
                }}
              >
                첫 멘트부터 마무리까지 그대로 적힌 수업 대본과, 이미 만들어진 슬라이드를 드립니다.
                강사는 말만 하면 됩니다.
              </p>

              <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
                <Link href="/signup" style={{ textDecoration: 'none' }}>
                  <Button kind="jade" size="lg">
                    강사 신청하기
                  </Button>
                </Link>
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <Button size="lg">이미 계정이 있어요</Button>
                </Link>
              </div>

              <p
                style={{
                  fontSize: 'var(--fs-caption)',
                  color: 'var(--ink-4)',
                  margin: '14px 0 0',
                }}
              >
                신청 후 확인을 거쳐 승인해 드립니다. 교재가 그대로 전달되기 때문입니다.
              </p>
            </div>

            {/* 제품을 히어로에 둔다. 스크롤해야 보이면 절반은 안 본다. */}
            {dialogue && drill && (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <SlideRenderer slide={dialogue} />
                </div>
                {/* 뒤에 한 장 더 겹쳐 "여러 장이 있다" 는 걸 말없이 알린다 */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: '22px -20px -22px 20px',
                    zIndex: 1,
                    opacity: 0.5,
                    pointerEvents: 'none',
                  }}
                >
                  <SlideRenderer slide={drill} />
                </div>
              </div>
            )}
          </div>
        </Wrap>
      </section>

      {/* ══ 숫자 띠 — 흩어 놓지 않고 한 줄로 묶는다 ═══════ */}
      <section
        style={{
          marginTop: 'var(--sp-section)',
          borderTop: '1px solid var(--rule)',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--surface)',
          padding: 'var(--sp-block) 0',
        }}
      >
        <Wrap>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 'var(--sp-block)',
            }}
          >
            {MARKET_HEADLINE.map((f) => (
              <Stat key={f.label} fact={f} />
            ))}
          </div>
        </Wrap>
      </section>

      {/* ══ 문제 — 어둡게. 여기가 바닥이다 ═══════════════ */}
      <section
        style={{
          background: 'var(--ink)',
          color: 'var(--on-ink)',
          padding: 'var(--sp-section) 0',
        }}
      >
        <Wrap>
          <h2
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 'var(--fw-semibold)',
              letterSpacing: 'var(--ls-h1)',
              lineHeight: 1.3,
              margin: 0,
              maxWidth: 'var(--measure)',
            }}
          >
            가르쳐 보면 아는 것들
          </h2>

          <ol
            style={{
              listStyle: 'none',
              margin: 'var(--sp-block) 0 0',
              padding: 0,
              display: 'grid',
              gap: 0,
            }}
          >
            {TEACHER_PAIN.map((p, i) => (
              <li
                key={p.title}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 'clamp(16px, 3vw, 34px)',
                  padding: '24px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--on-ink-rule)',
                }}
              >
                <span
                  aria-hidden="true"
                  className="mono"
                  style={{
                    fontSize: 'var(--fs-body-sm)',
                    color: 'var(--on-ink-2)',
                    paddingTop: 4,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <h3
                    style={{
                      fontSize: 'var(--fs-h2)',
                      fontWeight: 'var(--fw-medium)',
                      margin: 0,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 'var(--fs-body)',
                      lineHeight: 1.75,
                      margin: '8px 0 0',
                      color: 'var(--on-ink-2)',
                      maxWidth: 'var(--measure)',
                    }}
                  >
                    {p.body}
                  </p>
                </span>
              </li>
            ))}
          </ol>
        </Wrap>
      </section>

      {/* ══ 해법 — 다시 밝게 ════════════════════════════ */}
      <section style={{ padding: 'var(--sp-section) 0' }}>
        <Wrap>
          <Eyebrow>한결이 하는 일</Eyebrow>
          <h2
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 'var(--fw-semibold)',
              letterSpacing: 'var(--ls-h1)',
              lineHeight: 1.3,
              margin: '12px 0 0',
              maxWidth: 'var(--measure)',
            }}
          >
            수업 준비를 없앱니다
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 14,
              marginTop: 'var(--sp-block)',
            }}
          >
            {VALUE_PROPS.map((v) => (
              <article
                key={v.title}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--rule)',
                  borderRadius: 'var(--r-lg)',
                  padding: 'clamp(20px, 2.4vw, 28px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: 'var(--fs-caption)',
                    fontWeight: 'var(--fw-medium)',
                    color: 'var(--jade)',
                    background: 'var(--jade-w)',
                    padding: '5px 10px',
                    borderRadius: 'var(--r-full)',
                  }}
                >
                  {v.metric}
                </span>
                <h3
                  style={{
                    fontSize: 'var(--fs-h2)',
                    fontWeight: 'var(--fw-medium)',
                    margin: 0,
                  }}
                >
                  {v.title}
                </h3>
                <p
                  style={{
                    fontSize: 'var(--fs-body-sm)',
                    lineHeight: 1.75,
                    color: 'var(--ink-2)',
                    margin: 0,
                  }}
                >
                  {v.body}
                </p>
              </article>
            ))}
          </div>

          <p
            style={{
              fontSize: 'var(--fs-caption)',
              color: 'var(--ink-4)',
              marginTop: 18,
            }}
          >
            현재 {BUILD_STATUS.levels} {BUILD_STATUS.unitsWritten}차시가 준비되어 있습니다.{' '}
            {BUILD_STATUS.note}.
          </p>
        </Wrap>
      </section>

      {/* ══ 수요 — 표가 아니라 타임라인으로 ═════════════ */}
      <section
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--rule)',
          padding: 'var(--sp-section) 0',
        }}
      >
        <Wrap>
          <Eyebrow>지금 시장</Eyebrow>
          <h2
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 'var(--fw-semibold)',
              letterSpacing: 'var(--ls-h1)',
              lineHeight: 1.3,
              margin: '12px 0 0',
              maxWidth: 'var(--measure)',
            }}
          >
            한류 콘텐츠가 나올 때마다 학습자가 튑니다
          </h2>

          <div style={{ marginTop: 'var(--sp-block)' }}>
            {DEMAND_SPIKES.map((d) => (
              <div
                key={d.when}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(88px, auto) 1fr auto',
                  gap: 'clamp(12px, 2vw, 24px)',
                  alignItems: 'baseline',
                  padding: '16px 0',
                  borderBottom: '1px solid var(--rule-soft)',
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)' }}
                >
                  {d.when}
                </span>
                <span style={{ fontSize: 'var(--fs-body)' }}>{d.what}</span>
                <span
                  style={{
                    fontSize: 'var(--fs-body)',
                    fontWeight: 'var(--fw-medium)',
                    color: 'var(--jade)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.effect}
                </span>
              </div>
            ))}
          </div>
          <Cite source={DEMAND_SOURCE.source} url={DEMAND_SOURCE.sourceUrl} />

          <h3
            style={{
              fontSize: 'var(--fs-h2)',
              fontWeight: 'var(--fw-medium)',
              margin: 'var(--sp-block) 0 0',
              maxWidth: 'var(--measure)',
            }}
          >
            그런데 가르치는 사람에게는 교재가 없습니다
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 'var(--sp-block)',
              marginTop: 20,
            }}
          >
            {MARKET_SIZE.map((f) => (
              <Stat key={f.label} fact={f} />
            ))}
          </div>
        </Wrap>
      </section>

      {/* ══ 가입 ════════════════════════════════════════ */}
      <section
        style={{
          background: 'var(--ink)',
          color: 'var(--on-ink)',
          padding: 'var(--sp-section) 0',
          textAlign: 'center',
        }}
      >
        <Wrap>
          <h2
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 'var(--fw-semibold)',
              letterSpacing: 'var(--ls-h1)',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            함께 가르칠 강사를 찾습니다
          </h2>
          <p
            style={{
              fontSize: 'var(--fs-body-lg)',
              lineHeight: 1.75,
              color: 'var(--on-ink-2)',
              margin: '14px auto 0',
              maxWidth: 'var(--measure)',
            }}
          >
            신청해 주시면 확인 후 승인해 드립니다. 교재가 그대로 전달되기 때문에 한 분씩 확인합니다.
          </p>
          <div style={{ marginTop: 26 }}>
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <Button kind="jade" size="lg">
                강사 신청하기
              </Button>
            </Link>
          </div>
        </Wrap>
      </section>

      <footer style={{ padding: '28px 0' }}>
        <Wrap>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              fontSize: 'var(--fs-caption)',
              color: 'var(--ink-4)',
            }}
          >
            <span>한결 · 한국어 강사를 위한 교재와 수업 도구</span>
            <Link href="/licenses" style={{ color: 'inherit' }}>
              사용한 자료의 출처
            </Link>
          </div>
        </Wrap>
      </footer>
    </main>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 clamp(20px, 4vw, 32px)' }}>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 'var(--fs-eyebrow)',
        fontWeight: 'var(--fw-medium)',
        letterSpacing: 'var(--ls-eyebrow)',
        textTransform: 'uppercase',
        color: 'var(--indigo)',
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

/** 숫자는 크게, 출처는 작게. 근거 없는 숫자를 못 올리게 출처를 구조에 넣었다. */
function Stat({ fact }: { fact: MarketFact }) {
  return (
    <div>
      <div className="t-stat">{fact.value}</div>
      <div
        style={{
          fontSize: 'var(--fs-body-sm)',
          fontWeight: 'var(--fw-medium)',
          marginTop: 8,
        }}
      >
        {fact.label}
      </div>
      {fact.note && (
        <p
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--ink-4)',
            lineHeight: 1.65,
            margin: '8px 0 0',
          }}
        >
          {fact.note}
        </p>
      )}
      <Cite source={fact.source} url={fact.sourceUrl} />
    </div>
  );
}

function Cite({ source, url }: { source: string; url: string }) {
  return (
    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', margin: '8px 0 0' }}>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
        {source}
      </a>
    </p>
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
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          padding: '0 clamp(20px, 4vw, 32px)',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span
            aria-hidden="true"
            className="mono"
            style={{
              width: 24,
              height: 24,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 6,
              background: 'var(--ink)',
              color: 'var(--surface)',
              fontSize: 'var(--fs-caption)',
            }}
          >
            H
          </span>
          <strong style={{ fontSize: 'var(--fs-body-lg)', letterSpacing: 'var(--ls-h2)' }}>
            한결
          </strong>
        </span>

        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <Button size="sm">로그인</Button>
          </Link>
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <Button size="sm" kind="jade">
              신청하기
            </Button>
          </Link>
        </span>
      </div>
    </header>
  );
}
