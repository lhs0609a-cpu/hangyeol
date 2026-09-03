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
  photo,
  type MarketFact,
} from '@hangyeol/content';
import { Button, PhotoFrame, SlideRenderer } from '@hangyeol/ui';

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
 *   구간마다 사진 한 장              — 아래를 볼 것
 *
 * 사진을 넣은 이유.
 *
 * italki 와 Preply 를 훑어보면 두 곳 다 첫 화면부터 사람이 나온다.
 * 강사 목록은 카드마다 얼굴이 붙어 있고, 그 얼굴이 "이건 실제로 돌아가는
 * 서비스다" 를 문장 없이 말한다. 우리 랜딩에는 슬라이드만 있었다 —
 * 만든 물건은 보이는데 가르치는 사람이 없어서 도면처럼 읽혔다.
 *
 * 그래서 구간마다 사진을 한 장씩만 뒀다. 두 장 이상 놓으면 사진첩이 된다.
 * 어떤 사진을 왜 골랐는지와 쓰면 안 되는 방식은 photos.ts 에 적혀 있다.
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

            {/*
             * 사람 위에 제품을 겹친다.
             *
             * 예전에는 슬라이드 두 장을 어긋나게 겹쳐 "여러 장이 있다" 를 알렸다.
             * 장수는 아래 카드가 이미 말하고 있었고(차시당 12~17장),
             * 히어로가 정작 말하지 못하던 것은 이걸 사람이 쓴다는 사실이었다.
             * 그래서 뒷장을 빼고 그 자리에 강사를 놓았다.
             */}
            <div className="hero-figure">
              <PhotoFrame
                src={photo('teacher-online-lesson').src}
                alt={photo('teacher-online-lesson').alt}
                width={photo('teacher-online-lesson').width}
                height={photo('teacher-online-lesson').height}
                aspect="4 / 5"
                focus="center top"
                eager
              />

              {dialogue && (
                <div className="hero-figure__card">
                  <SlideRenderer slide={dialogue} />
                </div>
              )}
            </div>
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

          {/*
           * 사진을 목록 옆에 붙인다.
           *
           * 첫 항목이 "교재를 주지 않는다" 인데, 글로만 읽으면 남의 사정 같다.
           * 종이에 손으로 적어 든 카드가 옆에 있으면 그 문장이 자기 얘기가 된다.
           * 사진을 위나 아래에 놓지 않고 옆에 붙인 이유가 이것이다 —
           * 떨어뜨리면 삽화가 되고, 붙이면 근거가 된다.
           */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--sp-block)',
              alignItems: 'start',
              marginTop: 'var(--sp-block)',
            }}
          >
            <PhotoFrame
              src={photo('handmade-flashcard').src}
              alt={photo('handmade-flashcard').alt}
              width={photo('handmade-flashcard').width}
              height={photo('handmade-flashcard').height}
              aspect="4 / 3"
              tone="ink"
              caption="교재가 없으면 강사가 종이에 적어 든다. italki 도 Preply 도 여기까지는 주지 않는다."
            />

            <ol
              style={{
                listStyle: 'none',
                margin: 0,
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
          </div>
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

          {/*
           * 카드 셋 아래에 사진 한 장.
           *
           * 위의 카드가 전부 "우리가 준다" 는 말이라 자칫 무인 자습 도구처럼 읽힌다.
           * 수업은 사람이 한다는 것이 이 제품의 전제다(docs/12) — 그 전제를
           * 문장으로 한 번 더 쓰는 대신 사진으로 둔다.
           */}
          <PhotoFrame
            src={photo('one-to-one-lesson').src}
            alt={photo('one-to-one-lesson').alt}
            width={photo('one-to-one-lesson').width}
            height={photo('one-to-one-lesson').height}
            aspect="21 / 9"
            caption="수업은 강사가 실시간으로 합니다. 우리는 음원을 만들지 않습니다."
            style={{ marginTop: 'var(--sp-block)' }}
          />

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

          {/*
           * 사진을 세로로 세워 연표 옆에 둔다.
           *
           * 이 구간의 사진만 색이 살아 있다. 06번 §1 의 팔레트를 어긴 것처럼
           * 보이지만 의도한 것이다 — 옆의 문장이 "한류 콘텐츠가 나올 때마다"
           * 라서, 가라앉은 사진을 두면 글과 그림이 서로 다른 말을 한다.
           * 대신 이 한 장으로 끝낸다.
           */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: 'var(--sp-block)',
              alignItems: 'start',
              marginTop: 12,
            }}
          >
            <div>
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

              {/*
               * "그런데" 는 연표 바로 뒤에 와야 뒤집는 말이 된다.
               * 사진 아래로 내리면 세로 사진 옆에 빈자리가 남기도 하고,
               * 무엇보다 무엇을 뒤집는 문장인지 멀어진다.
               */}
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
            </div>

            <PhotoFrame
              src={photo('seoul-night').src}
              alt={photo('seoul-night').alt}
              width={photo('seoul-night').width}
              height={photo('seoul-night').height}
              aspect="3 / 4"
              caption="배우는 사람은 이 간판을 읽으려고 배웁니다."
            />
          </div>

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

      {/*
       * 가입 바로 앞에 사진 한 줄.
       *
       * 여기까지가 전부 강사 얘기였다. 마지막에 배우는 쪽의 손글씨를 한 줄 넣는다 —
       * 왜 이 일을 하는지가 강사 자신의 손글씨가 아니라 학생의 손글씨에 있기 때문이다.
       * 글을 덧붙이지 않는다. 사진만 두고 바로 신청 화면으로 넘긴다.
       */}
      <img alt={photo('korean-handwriting').alt}
        className="bleed-strip"
        src={photo('korean-handwriting').src}
        width={photo('korean-handwriting').width}
        height={photo('korean-handwriting').height}
        loading="lazy"
        decoding="async"
      />

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
