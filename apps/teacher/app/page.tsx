import Link from 'next/link';
import {
  BUILD_STATUS,
  COMPETITIVE_GAP,
  DEMAND_FACTS,
  DIAMOND_NOTE,
  FEATURAL_CLAIM,
  GAP_FACTS,
  HALLYU_FACTS,
  HALLYU_FANS,
  HALLYU_SPIKES,
  HANGEUL_FACTS,
  JAMO_ORIGINS,
  JAMO_SOURCE,
  JEONGINJI_LINE,
  KDH_FACT,
  MARKET_HEADLINE,
  MLA_SERIES,
  PLATFORM_ADMISSION,
  PLATFORM_GAPS,
  SAMAT_ORIGIN,
  SAMJAE,
  SCHOLAR_VOICES,
  TEACHER_PAIN,
  TEACHER_VOICE,
  TOPIK_SERIES,
  VALUE_PROPS,
  WORLD_LEARNERS,
  buildDeck,
  photo,
  type MarketFact,
} from '@hangyeol/content';
import {
  Button,
  DivergingBars,
  JamoOrigin,
  Logo,
  PhotoFrame,
  SlideRenderer,
  YearBars,
} from '@hangyeol/ui';

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
 *
 * ── 구간 순서와 바닥색 ──────────────────────────────────
 *
 * 순서가 논증이다. 13번 문서 §2 가 정했고, 바꾸면 결론이 안 선다.
 *
 *   1 히어로      종이   읽으면 되는 대본을 준다        — 제품을 먼저 보인다
 *   2 숫자 띠     흰     시장이 크다
 *   3 훈민정음    한지   580년 전에 같은 일이 있었다
 *   4 한류        먹     세계가 한국 것을 본다
 *   5 수요        흰     ★ 그래서 이만큼이 배우기 시작했다 — 그래프 두 장
 *   6 공백        먹     그런데 가르치는 쪽에는 아무것도 없다
 *   7 해법        종이   그 몫을 우리가 진다
 *   8 가입        먹
 *
 * 먹이 셋이지만 사이에 밝은 구간이 반드시 하나씩 들어간다.
 * 4를 먹으로 둔 이유는 따로 있다 — 거기 놓이는 사진이 어두운 공연장이라
 * 밝은 바닥에 놓으면 사진만 검은 구멍처럼 남는다.
 *
 * ── 마디 사이의 접속 ────────────────────────────────────
 *
 * 각 구간의 마지막 문장이 다음 구간의 제목을 요구해야 한다.
 * 그렇지 않으면 논증이 아니라 카탈로그가 된다.
 *
 *   3 → 4   "글자는 있는데 못 읽던 문제를 세종이 풀었다"
 *           → "지금은 배우려는 사람이 밖에서 밀려온다"
 *   4 → 5   "한류 팬이 2억 2,500만 명이다"
 *           → "그중 얼마가 실제로 배우기 시작했는가"        ← 그래프
 *   5 → 6   "다른 언어는 다 줄었는데 한국어만 늘었다"
 *           → "그런데 그들을 맞을 강사는 537명이다"
 *   6 → 7   "교재는 강사 몫이라고 플랫폼이 문서에 써 놓았다"
 *           → "그 몫을 우리가 대신 진다"
 *
 * ── 5번이 이 랜딩의 심장인 이유 ─────────────────────────
 *
 * 3·4번은 누구나 아는 이야기다("한글 대단하다", "한류 크다").
 * 아는 이야기는 설득하지 못한다. 5번만이 방문자가 모르던 것을 준다 —
 * 미국 대학에서 스페인어가 18% 줄어드는 동안 한국어는 38% 늘었다는 사실은
 * 한국어 강사조차 대부분 모른다. 그래서 그래프는 여기에만 놓는다.
 *
 * ── 형용사를 쓰지 않는다 ────────────────────────────────
 *
 * "위대한" 을 붙이는 순간 광고가 되고, 읽는 사람은 우리가 파는 물건까지
 * 같이 의심하게 된다. 연도 · 등재 · 상 이름 · 학계가 붙인 분류만 적고,
 * 만든 방법은 표로 보인다. 판단은 읽는 사람이 한다.
 *
 * 같은 이유로 인과를 우리 입으로 단정하지 않는다 —
 * "한류 때문에 한국어 학습이 늘었다" 는 1차 출처로 확인되지 않았다.
 * 팬 수와 학습자 수를 나란히 놓기만 한다.
 *
 * ── 화면의 모든 숫자는 원장을 지난다 ────────────────────
 *
 * hangeul.ts · demand.ts · market.ts 에 출처와 확인 시점이 함께 있고,
 * 화면은 거기서만 읽는다. 출처 없는 숫자가 오르지 못하게 검사가 막는다.
 * 13번 문서 §3 이 채택·보류·기각을 하나씩 기록해 두었다 —
 * 특히 기각한 것들(출처 없는 학자 인용, 언론 재계산치)은 다음 사람이
 * 다시 주워 오지 않도록 이유까지 적어 두었다.
 *
 * ── 한류 이미지 ─────────────────────────────────────────
 *
 * 오징어 게임 · BTS · 케이팝 데몬 헌터스는 이름과 사실만 적는다.
 * 실사 이미지를 쓸 합법적 경로를 13번 §5 가 전부 확인했고 하나도 없었다.
 * Getty 의 editorial 라이선스는 promotional 사용을 명시적으로 금지하고,
 * 유료 SaaS 랜딩은 정의상 promotional 이다.
 */

export const metadata = {
  title: 'SAMAT — 한국어 강사를 위한 교재와 수업 도구',
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

      {/* ══ 훈민정음 — 이름이 어디서 왔는가 ═══════════════ */}
      <HangeulSection />

      {/* ══ 한류 — 학습자가 어디서 오는가 ════════════════ */}
      <HallyuSection />

      {/* ══ 수요 — 이 랜딩의 심장. 여기서만 모르던 것을 준다 ══ */}
      <DemandSection />

      {/* ══ 공백 — 어둡게. 여기가 바닥이다 ═══════════════
          바로 앞 구간이 "배우려는 사람이 이만큼 늘었다" 로 끝난다.
          그 문장 다음에 와야 이 제목이 뒤집는 말이 된다. 떨어뜨리면
          그냥 강사 하소연이 되고, 붙여 두면 시장의 구멍이 된다. */}
      <section
        style={{
          background: 'var(--ink)',
          color: 'var(--on-ink)',
          padding: 'var(--sp-section) 0',
        }}
      >
        <Wrap>
          <Eyebrow tone="ink">그런데</Eyebrow>
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
            가르치는 쪽에는 아무것도 없습니다
          </h2>

          <PlatformGapBlock />

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

          <GapEvidence />
        </Wrap>
      </section>

      {/* ══ 해법 — 다시 밝게 ════════════════════════════ */}
      <section style={{ padding: 'var(--sp-section) 0' }}>
        <Wrap>
          <Eyebrow>SAMAT 이 하는 일</Eyebrow>
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
            <span>SAMAT · 한국어 강사를 위한 교재와 수업 도구</span>
            <Link href="/licenses" style={{ color: 'inherit' }}>
              사용한 자료의 출처
            </Link>
          </div>
        </Wrap>
      </footer>
    </main>
  );
}

/*
 * ══ 훈민정음 구간 ═══════════════════════════════════════
 *
 * 바닥을 한지색으로 깐다. 이 구간만 색이 다르다.
 * 앞뒤가 종이색(--canvas)과 먹(--ink)이라 그 사이에 한지가 들어가면
 * 스크롤하다가 "여기는 다른 이야기다" 를 색으로 먼저 안다.
 * --hanji 는 06번 §1 이 이미 정해 둔 색인데 화면에서 쓰인 적이 없었다.
 *
 * 구성 순서에 이유가 있다.
 *   1. 서문 한 줄        — 이름이 어디서 왔는지 먼저 보인다
 *   2. 무슨 문제였는가   — 580년 전 문제와 지금 문제가 같은 모양이다
 *   3. 만든 방법(표)     — 형용사 대신 표를 놓는다. 판단은 읽는 사람이 한다
 *   4. 정인지의 문장     — 그 문자의 설계 목표가 우리 제품의 약속과 같다
 *   5. 숫자              — 유네스코 · 문해상. 남이 인정한 것만 적는다
 */
function HangeulSection() {
  return (
    <section
      style={{
        background: 'var(--hanji)',
        borderTop: '1px solid var(--hanji-rule)',
        borderBottom: '1px solid var(--hanji-rule)',
        padding: 'var(--sp-section) 0',
      }}
    >
      <Wrap>
        <Eyebrow>이름의 내력</Eyebrow>

        {/*
         * 서문을 제목 자리에 놓는다.
         *
         * 이 문장이 제품 이름의 출처이므로 설명문으로 아래에 깔면 안 된다.
         * 제목 크기로 놓아야 "이 회사는 여기서 왔다" 가 된다.
         * 옛 표기를 현대 자모로 옮긴 것이라는 사실은 바로 아래에 밝힌다 —
         * 원문인 척하면 그 순간 이 구간 전체가 광고가 된다.
         */}
        <h2
          style={{
            fontSize: 'var(--fs-h1)',
            fontWeight: 'var(--fw-semibold)',
            letterSpacing: 'var(--ls-h1)',
            lineHeight: 1.45,
            margin: '12px 0 0',
            maxWidth: 'var(--measure)',
          }}
        >
          {SAMAT_ORIGIN.line}
        </h2>

        <p
          style={{
            fontSize: 'var(--fs-body-lg)',
            lineHeight: 1.75,
            color: 'var(--ink-2)',
            margin: '14px 0 0',
            maxWidth: 'var(--measure)',
          }}
        >
          {SAMAT_ORIGIN.modern}
        </p>

        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', margin: '10px 0 0' }}>
          {SAMAT_ORIGIN.note} ·{' '}
          <a
            href={SAMAT_ORIGIN.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit' }}
          >
            {SAMAT_ORIGIN.source}
          </a>
        </p>

        {/*
         * 이름 풀이. 한 낱말만 떼어 카드로 세운다.
         *
         * 위의 긴 문장 안에서는 '사맛디' 가 그냥 지나간다.
         * 떼어 놓아야 방문자가 상호와 연결한다 — 이 구간이 존재하는 이유가 그것이다.
         */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 'clamp(10px, 1.6vw, 16px)',
            flexWrap: 'wrap',
            background: 'var(--hanji-card)',
            border: '1px solid var(--hanji-rule)',
            borderRadius: 'var(--r-lg)',
            padding: 'clamp(14px, 2vw, 20px) clamp(18px, 2.4vw, 26px)',
            margin: 'var(--sp-block) 0 0',
          }}
        >
          <strong
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 'var(--fw-semibold)',
              letterSpacing: 'var(--ls-h1)',
            }}
          >
            {SAMAT_ORIGIN.word}
          </strong>
          <span style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-2)' }}>
            {SAMAT_ORIGIN.gloss}
          </span>
        </div>

        <p
          style={{
            fontSize: 'var(--fs-body)',
            lineHeight: 1.85,
            color: 'var(--ink-2)',
            margin: '18px 0 0',
            maxWidth: 'var(--measure)',
          }}
        >
          580년 전의 문제는 글이 있는데 백성이 읽지 못한다는 것이었습니다. 세종은 설명을 늘리는
          대신 글자를 새로 만들어 그 사이를 이었습니다. 지금 우리가 보는 문제도 모양이 같습니다 —
          배우려는 사람은 밀려오는데 가르칠 교재가 없습니다.
        </p>

        {/* ── 만든 방법 ─────────────────────────────────
            원문과 표를 나란히 둔다.

            왼쪽은 한글이 아니라 한문이고, 그 점이 이 구간의 요점이다 —
            글자가 생기기 전에는 저것을 써야 했고 백성은 저것을 읽지 못했다.
            그런데 저 페이지에 적힌 내용이 바로 그 문제를 진술한 문장이다.
            왼쪽에 "읽을 수 없던 글", 오른쪽에 "누구나 읽는 글" 을 두면
            문장 하나 없이도 무슨 일이 있었는지 읽힌다.

            PhotoFrame 을 쓰지 않는다. 이건 사진이 아니라 누끼다 —
            테두리와 바탕색을 두르면 액자에 든 사진이 되고, aspect 로 자르면
            문서가 잘린다. 종이를 지운 이유가 한지 바닥에 직접 앉히기 위해서였다. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--sp-block)',
            alignItems: 'start',
            marginTop: 'var(--sp-block)',
          }}
        >
          <figure style={{ margin: 0 }}>
            <img alt={photo('hunmin-preface').alt}
              src={photo('hunmin-preface').src}
              width={photo('hunmin-preface').width}
              height={photo('hunmin-preface').height}
              loading="lazy"
              decoding="async"
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
            <figcaption
              style={{
                fontSize: 'var(--fs-caption)',
                lineHeight: 1.7,
                color: 'var(--ink-4)',
                margin: '12px 0 0',
              }}
            >
              훈민정음 해례본 첫 장(1446). 셋째 줄의 「不相流通」 — 서로 통하지
              아니하여 — 에서 이 회사의 이름이 나왔습니다. 규장각 소장본에서
              종이와 장서인을 지우고 먹만 남겼습니다.
            </figcaption>
          </figure>

          <div>
            <h3
              style={{
                fontSize: 'var(--fs-h2)',
                fontWeight: 'var(--fw-medium)',
                margin: 0,
              }}
            >
              글자를 이렇게 만들었습니다
            </h3>
            <p
              style={{
                fontSize: 'var(--fs-body-sm)',
                lineHeight: 1.75,
                color: 'var(--ink-2)',
                margin: '8px 0 var(--sp-block)',
              }}
            >
              소리를 낼 때 입안이 만드는 모양을 글자로 그렸고, 소리가 세지면 획을 하나 더했습니다.
            </p>

            <JamoOrigin
              rows={JAMO_ORIGINS}
              samjae={SAMJAE}
              caption={`모음 기본자 셋은 하늘 · 땅 · 사람을 뜻합니다. — ${JAMO_SOURCE.source}`}
            />
          </div>
        </div>

        {/* ── 정인지의 문장 ─────────────────────────────
            자랑으로 넣은 것이 아니다. 이 문장이 말하는 설계 목표가
            우리가 강사에게 하는 약속과 같은 말이라서 넣는다.
            그래서 인용 바로 아래에 그 연결을 한 줄로 적는다 —
            적지 않으면 그냥 예쁜 옛말이 되고 만다. */}
        <figure
          style={{
            margin: 'var(--sp-section) 0 0',
            paddingLeft: 'clamp(16px, 2.4vw, 26px)',
            borderLeft: '2px solid var(--ink)',
            maxWidth: 'var(--measure)',
          }}
        >
          <blockquote
            style={{
              margin: 0,
              fontSize: 'var(--fs-h2)',
              fontWeight: 'var(--fw-medium)',
              lineHeight: 1.7,
              letterSpacing: 'var(--ls-h2)',
            }}
          >
            {JEONGINJI_LINE.line}
          </blockquote>
          <figcaption
            style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', margin: '12px 0 0' }}
          >
            {JEONGINJI_LINE.who} ·{' '}
            <a
              href={JEONGINJI_LINE.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit' }}
            >
              {JEONGINJI_LINE.source}
            </a>
          </figcaption>
        </figure>

        <p
          style={{
            fontSize: 'var(--fs-body)',
            lineHeight: 1.85,
            color: 'var(--ink-2)',
            margin: '18px 0 0',
            maxWidth: 'var(--measure)',
          }}
        >
          배우는 데 오래 걸리지 않게 만드는 것이 이 문자의 설계 목표였습니다. 우리가 강사에게
          드리는 것도 같습니다 — 가르치기까지 오래 걸리지 않게.
        </p>

        {/* ── 자질 문자 ─────────────────────────────────
            이 구간에서 가장 센 근거인데 숫자가 아니라 분류라서 Stat 로 못 그린다.
            그래서 카드 하나로 따로 세운다. 우리가 좋다고 한 말이 아니라
            기존 분류에 안 들어가서 학계가 칸을 새로 만들었다는 사실이 요점이다. */}
        <div
          style={{
            background: 'var(--hanji-card)',
            border: '1px solid var(--hanji-rule)',
            borderRadius: 'var(--r-lg)',
            padding: 'clamp(20px, 2.4vw, 28px)',
            marginTop: 'var(--sp-block)',
            maxWidth: 'var(--measure)',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--fs-h2)',
              fontWeight: 'var(--fw-medium)',
              margin: 0,
            }}
          >
            {FEATURAL_CLAIM.term}{' '}
            <span
              className="mono"
              style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)' }}
            >
              {FEATURAL_CLAIM.english}
            </span>
          </h3>
          <p
            style={{
              fontSize: 'var(--fs-body-sm)',
              lineHeight: 1.8,
              color: 'var(--ink-2)',
              margin: '10px 0 0',
            }}
          >
            {FEATURAL_CLAIM.body}
          </p>
          <Cite source={FEATURAL_CLAIM.source} url={FEATURAL_CLAIM.sourceUrl} />
        </div>

        {/* ── 남이 한 말 ─────────────────────────────────
            우리가 하는 칭찬은 광고지만 남이 한 말은 근거다.
            그런데 인터넷에 도는 한글 찬사는 절반이 출처가 없다 —
            13번 §3-A 가 하나씩 원출처를 확인했고 통과한 것만 여기 있다.
            검증 안 된 인용을 하나 실으면 검증된 나머지까지 같이 의심받는다. */}
        <div style={{ marginTop: 'var(--sp-section)' }}>
          {SCHOLAR_VOICES.map((v, i) => (
            <figure
              key={v.who}
              style={{
                margin: 0,
                padding: 'var(--sp-block) 0',
                borderTop: i === 0 ? '1px solid var(--hanji-rule)' : '1px solid var(--hanji-rule)',
                maxWidth: 'var(--measure)',
              }}
            >
              <blockquote
                style={{
                  margin: 0,
                  fontSize: 'var(--fs-h2)',
                  fontWeight: 'var(--fw-medium)',
                  lineHeight: 1.65,
                }}
              >
                {v.line}
              </blockquote>
              <figcaption
                style={{
                  fontSize: 'var(--fs-caption)',
                  color: 'var(--ink-4)',
                  lineHeight: 1.7,
                  margin: '10px 0 0',
                }}
              >
                {/* 영어 원문을 함께 둔다 — 옮긴 말만 실으면 확인할 길이 없다 */}
                {v.original && (
                  <>
                    <span lang="en">{v.original}</span>
                    <br />
                  </>
                )}
                {v.who} ·{' '}
                <a
                  href={v.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit' }}
                >
                  {v.work}
                </a>
              </figcaption>
            </figure>
          ))}

          {/*
           * 다이아몬드는 극찬하지 않았다 — 소개했다.
           *
           * 원문은 "학자들에 의해 그렇게 묘사되어 왔다" 다.
           * "다이아몬드가 세계 최고라고 했다" 로 쓰면 과장이고,
           * 과장 하나가 들키면 이 구간의 나머지 숫자까지 같이 죽는다.
           * 그래서 단서를 카드 안에 넣어 뗄 수 없게 만들었다.
           */}
          <div
            style={{
              background: 'var(--hanji-card)',
              border: '1px solid var(--hanji-rule)',
              borderRadius: 'var(--r-lg)',
              padding: 'clamp(18px, 2.2vw, 24px)',
              maxWidth: 'var(--measure)',
            }}
          >
            <p style={{ fontSize: 'var(--fs-body)', lineHeight: 1.8, margin: 0 }}>
              {DIAMOND_NOTE.line}
            </p>
            <p
              style={{
                fontSize: 'var(--fs-caption)',
                color: 'var(--ink-3)',
                lineHeight: 1.7,
                margin: '10px 0 0',
              }}
            >
              {DIAMOND_NOTE.caveat}
            </p>
            <p
              style={{
                fontSize: 'var(--fs-caption)',
                color: 'var(--ink-4)',
                lineHeight: 1.7,
                margin: '8px 0 0',
              }}
            >
              {DIAMOND_NOTE.who} ·{' '}
              <a
                href={DIAMOND_NOTE.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit' }}
              >
                {DIAMOND_NOTE.work}
              </a>
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--sp-block)',
            marginTop: 'var(--sp-section)',
            paddingTop: 'var(--sp-block)',
            borderTop: '1px solid var(--hanji-rule)',
          }}
        >
          {HANGEUL_FACTS.map((f) => (
            <Stat key={f.label} fact={f} />
          ))}
        </div>
      </Wrap>
    </section>
  );
}

/*
 * ══ 한류 구간 ═══════════════════════════════════════════
 *
 * 바닥을 먹으로 깐다. 여기 놓는 사진이 어두운 공연장이라
 * 밝은 바닥에 두면 사진만 검은 구멍처럼 남는다.
 *
 * ── 이름은 쓰고 이미지는 쓰지 않는다 ────────────────────
 *
 * 오징어 게임 · BTS · 케이팝 데몬 헌터스가 이름으로 나온다.
 * 출처를 단 사실 진술이라 문제가 없다 — 08번 §6 이 막는 것은 복제다.
 *
 * 그런데 이미지는 다르다. 스틸컷 · 포스터 · 공연 사진 · 로고는
 * 넷플릭스와 소속사의 저작물이고 거기에 출연자 개인의 초상이 겹친다.
 * 홍보용으로 풀린 이미지라도 남의 유료 서비스 랜딩에 쓰라고 준 것이 아니다.
 * 판단 기록은 licenses.ts 의 hallyu-ip-imagery 에 남겼다.
 *
 * 그래서 사진은 어느 공연인지 특정되지 않는 객석 한 장이다.
 * 캡션에 가수 이름을 붙이면 그 순간 위반이 된다 — 붙이지 않았다.
 */
function HallyuSection() {
  return (
    <section
      style={{
        background: 'var(--ink)',
        color: 'var(--on-ink)',
        padding: 'var(--sp-section) 0',
      }}
    >
      <Wrap>
        <Eyebrow tone="ink">지금 벌어지는 일</Eyebrow>

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
          세계가 한국 것을 봅니다
        </h2>

        {/*
         * 이 구간을 여는 숫자로 시청 수가 아니라 팬 수를 골랐다.
         *
         * 시청 수는 한 작품의 것이고 차트는 한 곡의 것이라 다음 해에 낡는다.
         * 이 숫자는 "한국 문화를 좋아한다고 스스로 등록한 사람" 을 센 것이고,
         * 정부 기관이 11년째 같은 방법으로 세고 있어서 추세를 믿을 수 있다.
         * 두 해를 나란히 놓기만 하면 배수는 읽는 사람이 스스로 계산한다.
         */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 'clamp(10px, 2vw, 20px)',
            margin: 'var(--sp-block) 0 0',
          }}
        >
          <span className="mono" style={{ fontSize: 'var(--fs-body)', color: 'var(--on-ink-2)' }}>
            {HALLYU_FANS.from.year}년 {HALLYU_FANS.from.value}
          </span>
          <span aria-hidden="true" style={{ color: 'var(--on-ink-2)' }}>
            →
          </span>
          <span className="t-stat">{HALLYU_FANS.to.value}</span>
        </div>
        <p
          style={{
            fontSize: 'var(--fs-body-lg)',
            fontWeight: 'var(--fw-medium)',
            margin: '8px 0 0',
          }}
        >
          {HALLYU_FANS.label} — 11년 만에 {HALLYU_FANS.multiple}
        </p>
        <p
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--on-ink-2)',
            lineHeight: 1.7,
            margin: '8px 0 0',
            maxWidth: 'var(--measure)',
          }}
        >
          {HALLYU_FANS.note}
        </p>
        <Cite source={HALLYU_FANS.source} url={HALLYU_FANS.sourceUrl} tone="ink" />

        <PhotoFrame
          src={photo('hallyu-lightsticks').src}
          alt={photo('hallyu-lightsticks').alt}
          width={photo('hallyu-lightsticks').width}
          height={photo('hallyu-lightsticks').height}
          aspect="21 / 9"
          tone="ink"
          caption="가사를 따라 부르려고 발음을 찾고, 발음을 찾다 문법에 닿습니다. 그 다음에 강사를 찾습니다."
          style={{ marginTop: 'var(--sp-block)' }}
        />

        {/* ── 연표 ──────────────────────────────────────
            줄마다 출처가 다르다. 넷플릭스 시청 수와 듀오링고 등록 수는
            전혀 다른 곳에서 온 숫자라 각주 하나로 묶으면 둘 다 못 믿을 숫자가 된다.
            그래서 출처를 줄 안에 넣었다. */}
        <div style={{ marginTop: 'var(--sp-block)' }}>
          {HALLYU_SPIKES.map((d, i) => (
            <div
              key={`${d.when}-${d.what}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(88px, auto) 1fr auto',
                gap: 'clamp(12px, 2vw, 24px)',
                alignItems: 'baseline',
                padding: '18px 0',
                borderTop: i === 0 ? '1px solid var(--on-ink-rule)' : 'none',
                borderBottom: '1px solid var(--on-ink-rule)',
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 'var(--fs-caption)', color: 'var(--on-ink-2)' }}
              >
                {d.when}
              </span>
              <span>
                <span style={{ display: 'block', fontSize: 'var(--fs-body)' }}>{d.what}</span>
                <a
                  href={d.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 'var(--fs-caption)',
                    color: 'var(--on-ink-2)',
                    textDecoration: 'none',
                  }}
                >
                  {d.source}
                </a>
              </span>
              <span
                style={{
                  fontSize: 'var(--fs-body)',
                  fontWeight: 'var(--fw-medium)',
                  textAlign: 'right',
                }}
              >
                {d.effect}
              </span>
            </div>
          ))}
        </div>

        {/* ── 규모 ──────────────────────────────────────
            연표가 "언제" 를 말했으니 여기는 "얼마나" 를 말한다.
            케데헌을 크게 두고 나머지를 옆에 세운다 — 2026년에 한국어 강사에게
            말을 걸면서 이 작품을 작게 다루면 시장을 모르는 회사가 된다. */}
        <div style={{ marginTop: 'var(--sp-section)', maxWidth: 'var(--measure)' }}>
          <Stat fact={KDH_FACT} tone="ink" />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--sp-block)',
            marginTop: 'var(--sp-block)',
            paddingTop: 'var(--sp-block)',
            borderTop: '1px solid var(--on-ink-rule)',
          }}
        >
          {HALLYU_FACTS.map((f) => (
            <Stat key={f.label} fact={f} tone="ink" />
          ))}
        </div>

        {/* ── 다음 구간으로 넘기는 자리 ──────────────────
            여기까지가 "세계가 한국 것을 본다" 였다. 다음 구간이 답할 질문을
            이 자리에서 던져야 그래프가 답으로 읽힌다.

            인과를 말하는 유일한 문장이 여기 있는데 우리 말이 아니라 인용이다.
            듀오링고 한국 총괄이 한 말이고, 회사 공식 블로그가 아니라 언론
            인터뷰라서 출처를 그 인터뷰로 정확히 적는다. */}
        <div
          style={{
            marginTop: 'var(--sp-section)',
            paddingTop: 'var(--sp-block)',
            borderTop: '1px solid var(--on-ink-rule)',
            maxWidth: 'var(--measure)',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--fs-h2)',
              fontWeight: 'var(--fw-medium)',
              margin: 0,
            }}
          >
            {WORLD_LEARNERS.headline}
          </h3>
          <p
            style={{
              fontSize: 'var(--fs-body)',
              lineHeight: 1.85,
              color: 'var(--on-ink-2)',
              margin: '10px 0 0',
            }}
          >
            {WORLD_LEARNERS.body}
          </p>

          <p
            style={{
              fontSize: 'var(--fs-body)',
              lineHeight: 1.8,
              margin: 'var(--sp-block) 0 0',
            }}
          >
            「{WORLD_LEARNERS.quote}」
          </p>
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--on-ink-2)', margin: '8px 0 0' }}>
            <a
              href={WORLD_LEARNERS.quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit' }}
            >
              {WORLD_LEARNERS.quoteWho}
            </a>
          </p>
          <Cite source={WORLD_LEARNERS.source} url={WORLD_LEARNERS.sourceUrl} tone="ink" />
        </div>
      </Wrap>
    </section>
  );
}

/*
 * ══ 수요 구간 ═══════════════════════════════════════════
 *
 * 이 랜딩의 심장이다. 13번 문서 §2 가 그 이유를 적었다.
 *
 * 앞의 두 구간(한글 · 한류)은 방문자가 이미 아는 이야기다.
 * "한글 대단하다", "한류 크다" 는 아무도 새로 배우지 않는다.
 * 여기만이 모르던 것을 준다 — 미국 대학에서 스페인어가 18% 줄어드는 동안
 * 한국어는 38% 늘었다는 사실은 한국어 강사조차 대부분 모른다.
 * 그래서 그래프를 여기 놓고, 스크롤이 여기서 멈추게 만든다.
 *
 * ── 인과를 우리 입으로 말하지 않는다 ────────────────────
 *
 * 앞 구간은 한류 팬 2억 2,500만 명을 보였고 이 구간은 학습자 수를 보인다.
 * 그런데 "한류 때문에 한국어를 배운다" 를 우리 문장으로 쓰지 않는다.
 * 그렇게 말한 1차 공식 발언은 조사에서 확인되지 않았다.
 * 나란히 놓기만 하고 연결은 읽는 사람이 한다. 그래야 나머지 숫자도 산다.
 *
 * ── 그래프 두 장을 다 놓는 이유 ─────────────────────────
 *
 * TOPIK 은 이해가 빠르고(시험 보러 온 사람 수), MLA 는 대비가 세다
 * (다른 언어는 다 줄었다). 하나만 놓으면 각각 반쪽이다.
 * 앞의 것으로 이해시키고 뒤의 것으로 놀라게 한다.
 */
function DemandSection() {
  return (
    <section
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--rule)',
        borderBottom: '1px solid var(--rule)',
        padding: 'var(--sp-section) 0',
      }}
    >
      <Wrap>
        <Eyebrow>수요</Eyebrow>
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
          그래서 몇 명이 실제로 배우기 시작했는가
        </h2>

        <p
          style={{
            fontSize: 'var(--fs-body-lg)',
            lineHeight: 1.75,
            color: 'var(--ink-2)',
            margin: '18px 0 0',
            maxWidth: 'var(--measure)',
          }}
        >
          좋아하는 것과 배우는 것은 다릅니다. 좋아하는 사람은 세어도 의미가 적지만, 시험을 치르러
          오거나 학점을 걸고 수강 신청을 한 사람은 다릅니다. 그 숫자만 봅니다.
        </p>

        {/* ── 그래프 A ─────────────────────────────────── */}
        <div style={{ marginTop: 'var(--sp-section)' }}>
          <h3 style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-medium)', margin: 0 }}>
            {TOPIK_SERIES.title}
          </h3>
          <p
            style={{
              fontSize: 'var(--fs-body-sm)',
              lineHeight: 1.75,
              color: 'var(--ink-2)',
              margin: '8px 0 var(--sp-block)',
              maxWidth: 'var(--measure)',
            }}
          >
            {TOPIK_SERIES.note}
          </p>

          <YearBars
            points={TOPIK_SERIES.points}
            unit={TOPIK_SERIES.unit}
            tableLabel={TOPIK_SERIES.title}
          />

          {/*
           * 결측을 캡션으로 밝힌다.
           *
           * 빠진 해를 조용히 건너뛰면 그래프가 매끈해 보이지만,
           * 그건 우리가 모르는 것을 아는 척한 것이다. 밝히면 오히려 나머지가 믿긴다.
           */}
          <p
            style={{
              fontSize: 'var(--fs-caption)',
              color: 'var(--ink-4)',
              lineHeight: 1.7,
              margin: '12px 0 0',
            }}
          >
            {TOPIK_SERIES.missing}
          </p>
          <Cite source={TOPIK_SERIES.source} url={TOPIK_SERIES.sourceUrl} />
        </div>

        {/* ── 그래프 B — 결정타 ───────────────────────────
            사진을 옆에 두지 않는다. 이 그래프가 이 구간의 그림이다. */}
        <div
          style={{
            marginTop: 'var(--sp-section)',
            paddingTop: 'var(--sp-block)',
            borderTop: '1px solid var(--rule)',
          }}
        >
          <h3 style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-medium)', margin: 0 }}>
            {MLA_SERIES.title}
          </h3>
          <p
            style={{
              fontSize: 'var(--fs-body-sm)',
              lineHeight: 1.75,
              color: 'var(--ink-2)',
              margin: '8px 0 var(--sp-block)',
              maxWidth: 'var(--measure)',
            }}
          >
            미국 대학에서 외국어 수강은 전체적으로 줄고 있습니다. 그 안에서 한국어만 늘었습니다.
          </p>

          <DivergingBars bars={MLA_SERIES.bars} ariaLabel={MLA_SERIES.title} />

          {/*
           * 원문 한 줄. 우리가 요약하면 힘이 빠지고, 무엇보다
           * 영어 원문이 그대로 있어야 방문자가 직접 확인할 수 있다.
           */}
          <figure
            style={{
              margin: 'var(--sp-block) 0 0',
              paddingLeft: 'clamp(16px, 2.4vw, 26px)',
              borderLeft: '2px solid var(--ink)',
              maxWidth: 'var(--measure)',
            }}
          >
            <blockquote
              style={{
                margin: 0,
                fontSize: 'var(--fs-h2)',
                fontWeight: 'var(--fw-medium)',
                lineHeight: 1.6,
              }}
            >
              {MLA_SERIES.quoteKo}
            </blockquote>
            <figcaption
              style={{
                fontSize: 'var(--fs-caption)',
                color: 'var(--ink-4)',
                margin: '10px 0 0',
                lineHeight: 1.7,
              }}
            >
              <span lang="en">{MLA_SERIES.quote}</span>
              <br />
              {MLA_SERIES.source}
            </figcaption>
          </figure>

          <p
            style={{
              fontSize: 'var(--fs-caption)',
              color: 'var(--ink-4)',
              lineHeight: 1.7,
              margin: '14px 0 0',
              maxWidth: 'var(--measure)',
            }}
          >
            {MLA_SERIES.caption}
          </p>
          <Cite source="Modern Language Association" url={MLA_SERIES.sourceUrl} />
        </div>

        {/* ── 규모 ─────────────────────────────────────
            그래프는 추세를 보이고 이 숫자들은 규모를 보인다.
            사진을 여기 붙인다 — 앞의 두 그래프가 추상이라 사람의 자리가 필요하다. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--sp-block)',
            alignItems: 'start',
            marginTop: 'var(--sp-section)',
            paddingTop: 'var(--sp-block)',
            borderTop: '1px solid var(--rule)',
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--sp-block)' }}>
            {DEMAND_FACTS.map((f) => (
              <Stat key={f.label} fact={f} />
            ))}
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
      </Wrap>
    </section>
  );
}

/*
 * 플랫폼의 실상 — 공백 구간의 첫 증거.
 *
 * 숫자 두 개면 끝난다. 앞 구간에서 학습자를 수십만 명 세어 놓고
 * 바로 다음에 강사 537명을 보이면, 문장을 하나도 안 써도 논증이 선다.
 *
 * 이 숫자는 오늘 목록을 직접 센 것이다. 실시간으로 변한다.
 * 그래서 확인 날짜를 화면에 적는다 — 안 적으면 언젠가 조용히 틀린 숫자가 된다.
 */
function PlatformGapBlock() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--sp-block)',
        marginTop: 'var(--sp-block)',
        paddingBottom: 'var(--sp-block)',
        borderBottom: '1px solid var(--on-ink-rule)',
      }}
    >
      {PLATFORM_GAPS.map((g) => (
        <div key={g.platform}>
          <div className="t-stat">{g.teachers.toLocaleString('ko-KR')}명</div>
          <p
            style={{
              fontSize: 'var(--fs-body-sm)',
              fontWeight: 'var(--fw-medium)',
              margin: '6px 0 0',
            }}
          >
            {g.platform} 의 한국어 강사 전부
          </p>
          <p
            style={{
              fontSize: 'var(--fs-caption)',
              color: 'var(--on-ink-2)',
              lineHeight: 1.65,
              margin: '6px 0 0',
            }}
          >
            {g.how} · <span className="mono">{g.checkedOn}</span> 기준
          </p>
          <p style={{ fontSize: 'var(--fs-caption)', margin: '6px 0 0' }}>
            <a
              href={g.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--on-ink-2)' }}
            >
              직접 세어 보기
            </a>
          </p>
        </div>
      ))}
    </div>
  );
}

/*
 * 공백의 나머지 증거.
 *
 * 여기서 가장 값싸고 가장 센 것은 PLATFORM_ADMISSION 이다 —
 * "강사가 교재를 직접 만들어야 한다" 를 우리가 주장할 필요가 없다.
 * 플랫폼이 공식 핸드북에 그렇게 써 두었다. 옮기기만 하면 된다.
 * 우리 주장은 의심받지만 상대가 쓴 문서는 의심받지 않는다.
 */
function GapEvidence() {
  return (
    <div style={{ marginTop: 'var(--sp-section)' }}>
      <figure
        style={{
          margin: 0,
          paddingLeft: 'clamp(16px, 2.4vw, 26px)',
          borderLeft: '2px solid var(--on-ink)',
          maxWidth: 'var(--measure)',
        }}
      >
        <blockquote
          style={{
            margin: 0,
            fontSize: 'var(--fs-h2)',
            fontWeight: 'var(--fw-medium)',
            lineHeight: 1.65,
          }}
        >
          {PLATFORM_ADMISSION.line}
        </blockquote>
        <figcaption
          style={{ fontSize: 'var(--fs-caption)', color: 'var(--on-ink-2)', margin: '12px 0 0' }}
        >
          <a
            href={PLATFORM_ADMISSION.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit' }}
          >
            {PLATFORM_ADMISSION.who}
          </a>
        </figcaption>
      </figure>

      <p
        style={{
          fontSize: 'var(--fs-body)',
          lineHeight: 1.85,
          color: 'var(--on-ink-2)',
          margin: '18px 0 0',
          maxWidth: 'var(--measure)',
        }}
      >
        플랫폼은 학생을 데려다줍니다. 그 다음은 강사 몫이라고 문서에 적혀 있습니다. 그래서 강사는
        매 차시를 맨손으로 시작합니다.
      </p>

      {/* 실제 강사의 말. 우리가 만든 페르소나가 아니라 공개된 글에서 가져왔다 */}
      <p
        style={{
          fontSize: 'var(--fs-body)',
          lineHeight: 1.8,
          margin: 'var(--sp-block) 0 0',
          maxWidth: 'var(--measure)',
        }}
      >
        「{TEACHER_VOICE.line}」
      </p>
      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--on-ink-2)', margin: '8px 0 0' }}>
        {TEACHER_VOICE.who} ·{' '}
        <a
          href={TEACHER_VOICE.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit' }}
        >
          {TEACHER_VOICE.source}
        </a>
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--sp-block)',
          marginTop: 'var(--sp-section)',
          paddingTop: 'var(--sp-block)',
          borderTop: '1px solid var(--on-ink-rule)',
        }}
      >
        {GAP_FACTS.map((f) => (
          <Stat key={f.label} fact={f} tone="ink" />
        ))}
      </div>

      {/*
       * "이미 있는 거 아니야?" 를 닫는 문단.
       *
       * 없으면 방문자가 여기서 멈춘다. 있는 것과 없는 것을 이름으로 대야
       * 그 질문이 닫힌다 — 그런데 남의 제품을 깎아내리지 않는다. 자리를 말할 뿐이다.
       */}
      <div
        style={{
          marginTop: 'var(--sp-section)',
          paddingTop: 'var(--sp-block)',
          borderTop: '1px solid var(--on-ink-rule)',
          maxWidth: 'var(--measure)',
        }}
      >
        <h3 style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-medium)', margin: 0 }}>
          {COMPETITIVE_GAP.headline}
        </h3>
        <p
          style={{
            fontSize: 'var(--fs-body)',
            lineHeight: 1.85,
            color: 'var(--on-ink-2)',
            margin: '10px 0 0',
          }}
        >
          {COMPETITIVE_GAP.body}
        </p>
      </div>
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 clamp(20px, 4vw, 32px)' }}>
      {children}
    </div>
  );
}

/**
 * 구간 라벨.
 *
 * tone 이 생긴 이유: 먹 바닥에서 --indigo 는 거의 검정이라 안 보인다.
 * 06번 §7 의 대비비를 맞추려면 어두운 면 전용 색이 따로 있어야 한다.
 */
function Eyebrow({ children, tone = 'paper' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <p
      style={{
        fontSize: 'var(--fs-eyebrow)',
        fontWeight: 'var(--fw-medium)',
        letterSpacing: 'var(--ls-eyebrow)',
        textTransform: 'uppercase',
        color: tone === 'ink' ? 'var(--on-ink-2)' : 'var(--indigo)',
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

type Tone = 'paper' | 'ink';

/** 숫자는 크게, 출처는 작게. 근거 없는 숫자를 못 올리게 출처를 구조에 넣었다. */
function Stat({ fact, tone = 'paper' }: { fact: MarketFact; tone?: Tone }) {
  const faint = tone === 'ink' ? 'var(--on-ink-2)' : 'var(--ink-4)';

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
            color: faint,
            lineHeight: 1.65,
            margin: '8px 0 0',
          }}
        >
          {fact.note}
        </p>
      )}
      <Cite source={fact.source} url={fact.sourceUrl} tone={tone} />
    </div>
  );
}

function Cite({ source, url, tone = 'paper' }: { source: string; url: string; tone?: Tone }) {
  return (
    <p
      style={{
        fontSize: 'var(--fs-caption)',
        color: tone === 'ink' ? 'var(--on-ink-2)' : 'var(--ink-4)',
        margin: '8px 0 0',
      }}
    >
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
        {/*
         * 표식은 이름의 첫 글자다. 로그인한 뒤의 Shell · 로그인 화면과 같은 것을 쓴다 —
         * 방문자가 가입하면서 화면이 바뀌는데 표식까지 바뀌면 다른 제품처럼 보인다.
         * 그리는 방법과 이유는 primitives.tsx 의 Logo 에 적혀 있다.
         */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Logo size={22} />
          <strong style={{ fontSize: 'var(--fs-body-lg)', letterSpacing: 'var(--ls-h2)' }}>
            SAMAT
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
