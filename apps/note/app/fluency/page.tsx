'use client';

import { useEffect, useRef, useState } from 'react';
import { FLUENCY_ROUNDS, FLUENCY_TOPICS } from '@hangyeol/content';
import { TopBar } from '../ui';

/*
 * S-03 · 4·3·2 유창성 — 07번 문서.
 *
 * 같은 이야기를 4분 → 3분 → 2분으로 세 번. 내용은 같고 시간만 압축한다.
 * 새 언어를 다루지 않는다. 아는 것을 더 빠르게 꺼내는 연습이다.
 *
 * 라운드가 끝나면 자동으로 다음 라운드로 넘어가지 않는다.
 * 사용자가 다시 [시작]을 눌러야 한다 — 숨 고를 시간이 필요하다.
 */

export default function FluencyPage() {
  const topic = FLUENCY_TOPICS[0]!;
  const [round, setRound] = useState(0);
  // FLUENCY_ROUNDS 는 as const 라 seconds 가 리터럴 타입으로 좁혀진다. 초 단위 카운터이므로 넓힌다.
  const [remaining, setRemaining] = useState<number>(FLUENCY_ROUNDS[0]!.seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;

    timer.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(timer.current!);
          setRunning(false);
          void completeRound(round);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [running, round]);

  async function completeRound(r: number) {
    await fetch('/api/note/fluency/round', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ round: r + 1, topicId: topic.id }),
    }).catch(() => undefined);

    if (r + 1 >= FLUENCY_ROUNDS.length) {
      setDone(true);
    } else {
      setRound(r + 1);
      setRemaining(FLUENCY_ROUNDS[r + 1]!.seconds);
    }
  }

  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  if (done) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 50 }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>같은 내용을 절반의 시간에</p>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 8 }}>이게 자동화입니다.</p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: 22,
            padding: '12px 20px',
            borderRadius: 8,
            background: 'var(--indigo)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          완료
        </a>
      </div>
    );
  }

  return (
    <div className="hg-rise">
      <TopBar />

      <h1 style={{ fontSize: 20, fontWeight: 600, marginTop: 22 }}>4 · 3 · 2 유창성 훈련</h1>
      <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.7 }}>
        같은 이야기를 4분 → 3분 → 2분으로 세 번. 새 표현은 쓰지 않습니다.
        아는 것을 더 빠르게 꺼내는 연습이에요.
      </p>

      <div
        style={{
          marginTop: 20,
          background: 'var(--surface)',
          border: '1px solid var(--hanji-rule)',
          borderRadius: 10,
          padding: 18,
        }}
      >
        <div className="eyebrow">오늘의 주제</div>
        <p style={{ fontSize: 16, fontWeight: 600, margin: '8px 0 12px' }}>{topic.prompt}</p>
        <div className="eyebrow">쓸 표현</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
          {topic.useExpressions.map((e) => (
            <span
              key={e}
              style={{
                fontSize: 12.5,
                padding: '3px 8px',
                borderRadius: 3,
                background: 'var(--indigo-w)',
                color: 'var(--indigo)',
              }}
            >
              {e}
            </span>
          ))}
        </div>
      </div>

      {/* 3칸 획 스텝퍼 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 22 }}>
        {FLUENCY_ROUNDS.map((r, i) => (
          <div key={r.round}>
            <div
              style={{
                height: 3,
                borderRadius: 99,
                background: i <= round ? 'var(--ink)' : 'var(--hanji-rule)',
                transition: 'background .3s',
              }}
            />
            <div className="mono" style={{ fontSize: 10, marginTop: 6, color: i <= round ? 'var(--ink-2)' : 'var(--ink-4)' }}>
              {r.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mono" style={{ fontSize: 54, fontWeight: 500, textAlign: 'center', marginTop: 26, letterSpacing: '-0.03em' }}>
        {mmss}
      </div>

      <button
        className="hg-tap"
        onClick={() => setRunning((v) => !v)}
        style={{
          marginTop: 16,
          width: '100%',
          padding: '16px',
          borderRadius: 8,
          border: running ? '1px solid var(--hanji-rule)' : 'none',
          background: running ? 'var(--surface)' : 'var(--indigo)',
          color: running ? 'var(--ink-2)' : '#fff',
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {running ? '일시정지' : `${FLUENCY_ROUNDS[round]!.label} 시작 — 지금부터 말하세요`}
      </button>
    </div>
  );
}
