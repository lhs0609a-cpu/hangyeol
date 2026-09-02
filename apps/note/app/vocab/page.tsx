'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '../ui';

/*
 * 개인 단어장 — 02번 문서 D-09.
 *
 * 수업 표현이 자동으로 적립된다. 학생이 만들지 않는다.
 * 강사가 3분 리포트에 적은 것이 여기로 온다.
 */

interface Card {
  id: string;
  term: string;
  glossL1: string | null;
  example: string | null;
  state: string;
  reps: number;
  dueAt: string;
}

const STATE_LABEL: Record<string, string> = {
  learning: '배우는 중',
  review: '복습 중',
  graduated: '외웠어요',
};

export default function VocabPage() {
  const [items, setItems] = useState<Card[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/note/vocab')
      .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
      .then((d) => {
        setItems(d.items ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => setItems([]));
  }, []);

  if (!items) return <p style={{ textAlign: 'center', paddingTop: 40, color: 'var(--ink-3)' }}>불러오는 중</p>;

  return (
    <div className="hg-rise">
      <TopBar right={`${total}개`} />

      <h1 style={{ fontSize: 20, fontWeight: 600, marginTop: 22 }}>내 단어장</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.7 }}>
        수업에서 나온 표현이 여기에 쌓여요. 직접 넣지 않아도 돼요.
      </p>

      {items.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--ink-4)', marginTop: 30, textAlign: 'center' }}>
          아직 표현이 없어요. 첫 수업이 끝나면 여기에 나타나요
        </p>
      ) : (
        <div style={{ marginTop: 18 }}>
          {items.map((c) => (
            <div key={c.id} style={{ padding: '14px 0', borderTop: '1px solid var(--hanji-rule)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 16.5, fontWeight: 600 }}>{c.term}</span>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 3,
                    background: c.state === 'graduated' ? 'var(--jade-w)' : 'var(--hanji-card)',
                    color: c.state === 'graduated' ? 'var(--jade)' : 'var(--ink-4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {STATE_LABEL[c.state] ?? c.state}
                </span>
              </div>
              {c.glossL1 && (
                <div className="mono" style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>
                  {c.glossL1}
                </div>
              )}
              {c.example && (
                <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 5 }}>{c.example}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
