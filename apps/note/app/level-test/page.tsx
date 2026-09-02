'use client';

import { useEffect, useState } from 'react';
import type { TestState } from '@hangyeol/content';
import { TopBar } from '../ui';

/*
 * 레벨 테스트 — 02번 문서 B-06.
 *
 * "첫 수업 전에 완료." 레벨을 수업에서 재면 50분 중 20분이 날아간다.
 * 학생이 링크를 열었을 때 5분 안에 끝내고 오면 강사는 첫 수업부터 가르친다.
 *
 * 적응형이라 맞히면 어려워지고 틀리면 쉬워진다.
 * 학생이 자기 수준 근처에서만 풀어서 좌절하지 않는다.
 */

interface Question {
  id: string;
  prompt: string;
  choices: string[];
}

interface StepResponse {
  done: boolean;
  progress: { asked: number; total: number };
  question: Question | null;
  state: TestState;
}

interface Result {
  levelCode: string;
  level: number;
  correct: number;
  asked: number;
  weakPoints: string[];
}

export default function LevelTestPage() {
  const [step, setStep] = useState<StepResponse | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/note/level-test')
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body?.error?.message ?? '시작하지 못했어요');
        return body as StepResponse;
      })
      .then(setStep)
      .catch((e: Error) => setError(e.message));
  }, []);

  async function answer(choiceIndex: number) {
    if (!step?.question || busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch('/api/note/level-test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          state: step.state,
          questionId: step.question.id,
          choiceIndex,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? '처리하지 못했어요');

      const next = body as StepResponse;

      if (next.done) {
        const fin = await fetch('/api/note/level-test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ state: next.state, finish: true }),
        });
        const finBody = await fin.json();
        if (!fin.ok) throw new Error(finBody?.error?.message ?? '저장하지 못했어요');
        setResult(finBody as Result);
      } else {
        setStep(next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리하지 못했어요');
    } finally {
      setBusy(false);
    }
  }

  if (error && !step) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 50 }}>
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-3)' }}>{error}</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="hg-rise" style={{ textAlign: 'center', paddingTop: 40 }}>
        <div className="eyebrow">레벨 배정 완료</div>
        <div className="mono" style={{ fontSize: 'var(--fs-display)', fontWeight: 500, marginTop: 12, letterSpacing: '-0.03em' }}>
          {result.level}급
        </div>
        <p className="mono" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-4)', marginTop: 4 }}>
          {result.correct} / {result.asked} 정답
        </p>

        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-2)', marginTop: 22, lineHeight: 1.8 }}>
          여기서 시작해요.
          <br />
          선생님이 이 결과를 보고 첫 수업을 준비해요.
        </p>

        {result.weakPoints.length > 0 && (
          <div
            style={{
              marginTop: 22,
              padding: 16,
              background: 'var(--hanji-card)',
              border: '1px solid var(--hanji-rule)',
              borderRadius: 10,
              textAlign: 'left',
            }}
          >
            <div className="eyebrow">먼저 볼 것</div>
            <div style={{ marginTop: 8 }}>
              {result.weakPoints.map((w) => (
                <div key={w} style={{ fontSize: 'var(--fs-body)', marginBottom: 3 }}>
                  · {w}
                </div>
              ))}
            </div>
          </div>
        )}

        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: 24,
            padding: '13px 22px',
            borderRadius: 8,
            background: 'var(--indigo)',
            color: '#fff',
            fontSize: 'var(--fs-body-lg)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          오늘의 학습으로
        </a>
      </div>
    );
  }

  if (!step) {
    return <p style={{ textAlign: 'center', paddingTop: 40, color: 'var(--ink-3)' }}>준비 중</p>;
  }

  const pct = (step.progress.asked / step.progress.total) * 100;

  return (
    <div className="hg-rise">
      <TopBar right={`${step.progress.asked + 1} / ${step.progress.total}`} />

      <div style={{ height: 3, borderRadius: 99, background: 'var(--hanji-rule)', marginTop: 14 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'var(--indigo)', transition: 'width .3s' }} />
      </div>

      <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', marginTop: 18, lineHeight: 1.7 }}>
        빈칸에 알맞은 것을 고르세요. 모르면 아무거나 골라도 괜찮아요.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: '28px 20px',
          background: 'var(--hanji-card)',
          border: '1px solid var(--hanji-rule)',
          borderRadius: 10,
          fontSize: 'var(--fs-h1)',
          lineHeight: 1.7,
          textAlign: 'center',
        }}
      >
        {step.question?.prompt}
      </div>

      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        {step.question?.choices.map((choice, i) => (
          <button
            key={choice}
            className="hg-tap"
            disabled={busy}
            onClick={() => answer(i)}
            style={{
              padding: '16px 18px',
              fontSize: 'var(--fs-h2)',
              textAlign: 'left',
              borderRadius: 8,
              border: '1px solid var(--hanji-rule)',
              background: 'var(--surface)',
              opacity: busy ? 0.6 : 1,
            }}
          >
            {choice}
          </button>
        ))}
      </div>

      {error && <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--honghwa)', marginTop: 12 }}>{error}</p>}
    </div>
  );
}
