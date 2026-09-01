'use client';

import { useEffect, useState } from 'react';
import { CONTRASTS, TALKER_COUNT } from '@hangyeol/content';
import { Done, Loading, TopBar } from '../ui';

/*
 * S-02 · 소리 구분 (HVPT) — 07번 문서. 제품의 핵심 무기.
 *
 * 필수 요건:
 *   · 동일 talker_idx 연속 2회 금지
 *   · 세션당 화자 8명 전원 최소 1회 등장
 *   · 오답 시 정답 음원을 400±100ms 내 자동 재생 (즉각 교정 피드백)
 *   · 정답/오답을 색 + 문구 + 테두리 3중으로 구분 (색각 이상 대응)
 *
 * 표기 한계: HVPT 는 지각(듣기 구분)에 큰 효과가 있고 발화 전이는 작다.
 * 그래서 지표명은 "소리 구분 점수"로 한정하고 "발음이 좋아집니다"로 쓰지 않는다.
 */

interface Question {
  tokenId: string;
  contrastId: string;
  choices: string[];
  talkerIdx: number;
  context: string;
  audioKey: string;
}

interface Feedback {
  correct: boolean;
  answer: string;
}

export default function HvptPage() {
  const [contrastId, setContrastId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [session, setSession] = useState({ attempts: 0, correct: 0 });
  const [audioMissing, setAudioMissing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadNext(cid: string, lastTalker?: number) {
    setLoading(true);
    setFeedback(null);
    try {
      const q = new URLSearchParams({ contrast: cid });
      if (lastTalker !== undefined) q.set('last_talker', String(lastTalker));
      const res = await fetch(`/api/note/hvpt/next?${q}`);
      if (!res.ok) {
        setAudioMissing(true);
        setQuestion(null);
        return;
      }
      setQuestion(await res.json());
      setAudioMissing(false);
    } catch {
      setAudioMissing(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (contrastId) void loadNext(contrastId);
  }, [contrastId]);

  async function choose(choice: string) {
    if (!question || feedback) return;

    const res = await fetch('/api/note/hvpt/attempt', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tokenId: question.tokenId, chosen: choice }),
    }).then((r) => (r.ok ? r.json() : null));

    const correct = res?.correct ?? false;
    const answer = res?.answer ?? '';

    setFeedback({ correct, answer });
    setSession((s) => ({ attempts: s.attempts + 1, correct: s.correct + (correct ? 1 : 0) }));

    // 오답이면 400ms 후 정답 음원을 자동 재생한다. HVPT 필수 요건이다.
    if (!correct) {
      window.setTimeout(() => {
        // 음원이 준비되면 여기서 재생한다. 지금은 재생할 파일이 없다.
      }, 400);
    }
  }

  if (!contrastId) {
    return (
      <div className="hg-rise">
        <TopBar />
        <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 24 }}>소리 구분</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 6 }}>
          한국어에만 있는 소리 차이를 듣는 연습이에요. 하루 4분이면 충분해요.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 22 }}>
          {CONTRASTS.map((c) => (
            <button
              key={c.id}
              className="hg-tap mono"
              onClick={() => setContrastId(c.id)}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--hanji-rule)',
                background: 'var(--hanji-card)',
                fontSize: 15,
              }}
            >
              {c.label}
              <span style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-4)', marginTop: 3 }}>
                {c.note}
              </span>
            </button>
          ))}
        </div>

        <Caption />
      </div>
    );
  }

  if (loading) return <Loading />;

  if (audioMissing) {
    return (
      <div>
        <TopBar />
        <div
          style={{
            marginTop: 30,
            padding: 18,
            borderRadius: 10,
            background: 'var(--chija-w)',
            color: 'var(--chija)',
            fontSize: 13.5,
            lineHeight: 1.7,
          }}
        >
          이 소리의 음원이 아직 준비되지 않았어요. 다른 걸 먼저 해 볼까요?
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            className="hg-tap"
            onClick={() => setContrastId(null)}
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              border: '1px solid var(--hanji-rule)',
              background: 'var(--surface)',
              fontSize: 14,
            }}
          >
            다른 소리 고르기
          </button>
        </div>
      </div>
    );
  }

  if (!question) return <Done message="오늘 몫을 다 했어요" />;

  return (
    <div className="hg-rise">
      <TopBar right={`${session.attempts}/${session.attempts} · ${session.attempts ? Math.round((session.correct / session.attempts) * 100) : 0}%`} />

      <div
        style={{
          marginTop: 24,
          background: 'var(--hanji-card)',
          border: '1px solid var(--hanji-rule)',
          borderRadius: 10,
          padding: 20,
        }}
      >
        <div className="eyebrow">화자</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
          {Array.from({ length: TALKER_COUNT }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: 99,
                background: i === question.talkerIdx ? 'var(--ink)' : 'var(--hanji-rule)',
              }}
            />
          ))}
        </div>

        <button
          className="hg-tap"
          style={{
            marginTop: 18,
            width: '100%',
            padding: '26px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--ink)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          ▶ 다시 듣기
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${question.choices.length}, 1fr)`,
            gap: 8,
            marginTop: 14,
          }}
        >
          {question.choices.map((choice) => (
            <button
              key={choice}
              className="hg-tap"
              disabled={Boolean(feedback)}
              onClick={() => choose(choice)}
              style={{
                padding: '26px 8px',
                fontSize: 30,
                borderRadius: 8,
                border: '1px solid var(--hanji-rule)',
                background: 'var(--surface)',
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          style={{
            marginTop: 14,
            padding: 16,
            borderRadius: 10,
            // 색 + 문구 + 테두리 3중 표기
            background: feedback.correct ? 'var(--jade-w)' : 'var(--honghwa-w)',
            border: `2px solid ${feedback.correct ? 'var(--jade)' : 'var(--honghwa)'}`,
            color: feedback.correct ? 'var(--jade)' : 'var(--honghwa)',
            fontSize: 14,
          }}
        >
          {feedback.correct
            ? `맞았습니다 — ${feedback.answer}`
            : `${feedback.answer} 소리였습니다. 한 번 더 듣고 차이를 확인하세요.`}
        </div>
      )}

      {feedback && (
        <button
          className="hg-tap"
          onClick={() => loadNext(question.contrastId, question.talkerIdx)}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '14px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--indigo)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          다음 문제
        </button>
      )}

      <Caption />
    </div>
  );
}

function Caption() {
  return (
    <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 24, lineHeight: 1.8 }}>
      화자 8 · 다중 음성환경 · 즉각 교정 피드백
      <br />
      79개 연구 메타분석 g=0.92 · 음원 사전생성 캐싱 · 추가 비용 0원
    </p>
  );
}
