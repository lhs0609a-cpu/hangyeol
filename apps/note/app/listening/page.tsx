'use client';

import { useState } from 'react';
import { LISTENING_ITEMS } from '@hangyeol/content';
import { TopBar } from '../ui';

/*
 * S-05 · 그냥 듣기 (다청) — 07번 문서.
 *
 * "공부하지 마세요. 95% 알아들을 수 있는 것만 골라뒀습니다. 흘려들어도 됩니다."
 * 학습이 아니라 노출이다. 그래서 문제도 채점도 없다.
 */

export default function ListeningPage() {
  const [doneIds, setDoneIds] = useState<number[]>([]);

  // 학생 레벨은 세션에서 받아야 한다. 그 전까지는 초급만 보여준다.
  const items = LISTENING_ITEMS.filter((i) => i.levelCode === 'topik1');

  async function markDone(id: number, playedSec: number) {
    setDoneIds((v) => (v.includes(id) ? v : [...v, id]));
    await fetch(`/api/note/listening/${id}/progress`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playedSec, completed: true }),
    }).catch(() => undefined);
  }

  const total = items.length;
  const done = doneIds.length;

  return (
    <div className="hg-rise">
      <TopBar right={`${done} / ${total}`} />

      <h1 style={{ fontSize: 20, fontWeight: 600, marginTop: 22 }}>그냥 듣기</h1>
      <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.7 }}>
        공부하지 마세요. 95% 알아들을 수 있는 것만 골라뒀습니다. 흘려들어도 됩니다.
      </p>

      <div style={{ marginTop: 20 }}>
        {items.map((item) => {
          const isDone = doneIds.includes(item.id);
          const mmss = `${Math.floor(item.durationSec / 60)}:${String(item.durationSec % 60).padStart(2, '0')}`;

          return (
            <button
              key={item.id}
              className="hg-tap"
              onClick={() => markDone(item.id, item.durationSec)}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                gap: 12,
                padding: '14px 14px',
                marginBottom: 2,
                borderRadius: 10,
                textAlign: 'left',
                border: isDone ? '1px solid transparent' : '1px solid var(--hanji-rule)',
                background: isDone ? 'transparent' : 'var(--hanji-card)',
                opacity: isDone ? 0.55 : 1,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 99,
                  display: 'grid',
                  placeItems: 'center',
                  background: isDone ? 'var(--jade-w)' : 'var(--surface)',
                  color: isDone ? 'var(--jade)' : 'var(--ink-3)',
                  border: '1px solid var(--hanji-rule)',
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {isDone ? '✓' : '▶'}
              </span>

              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{item.title}</span>
                <span className="mono" style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-4)', marginTop: 2 }}>
                  {item.levelCode.replace('topik', '')}급 · {mmss}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/*
        오디오 파일이 아직 없다. 목록은 대본 개요로 채워져 있고,
        재생하면 완료로만 표시된다. 그 사실을 숨기지 않는다.
      */}
      <p style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 18, lineHeight: 1.7 }}>
        음원은 준비 중이에요. 목록만 먼저 보여드려요.
      </p>

      <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 22 }}>
        의미중심 입력 · 이번 주 {Math.round((done / Math.max(1, total)) * 25)}% · 목표 25%
      </p>
    </div>
  );
}
