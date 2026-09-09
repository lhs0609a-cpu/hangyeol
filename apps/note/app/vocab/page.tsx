'use client';

import { useEffect, useState } from 'react';
import { LoadError, Loading, TopBar } from '../ui';

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
  learning: '배우는 중 / Learning',
  review: '복습 중 / Reviewing',
  graduated: '외웠어요 / Learned',
};

export default function VocabPage() {
  const [items, setItems] = useState<Card[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);

  async function load() {
    setError(false);
    try {
      const response = await fetch('/api/note/vocab');
      if (!response.ok) throw new Error('load');
      const data = await response.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { setError(true); }
  }

  useEffect(() => {
    void load();
  }, []);

  if (error) return <LoadError onRetry={() => void load()} />;
  if (!items) return <Loading />;

  return (
    <div className="hg-rise">
      <TopBar right={`${total}개`} />

      <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 600, marginTop: 22 }}>내 단어장 / My words</h1>
      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.7 }}>
        수업에서 나온 표현이 여기에 쌓여요. 직접 넣지 않아도 돼요.
      </p>
      <p lang="en" className="t-body-sm" style={{ color: 'var(--ink-3)' }}>Useful expressions from your lessons appear here automatically.</p>

      {items.length === 0 ? (
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-4)', marginTop: 30, textAlign: 'center' }}>
          아직 표현이 없어요. 첫 수업 후에 만나요. / Your words will appear after your first lesson.
        </p>
      ) : (
        <div style={{ marginTop: 18 }}>
          {items.map((c) => (
            <div key={c.id} style={{ padding: '14px 0', borderTop: '1px solid var(--hanji-rule)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 'var(--fs-h2)', fontWeight: 600 }}>{c.term}</span>
                <span
                  className="mono"
                  style={{
                    fontSize: 'var(--fs-eyebrow)',
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
                <div className="mono" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', marginTop: 3 }}>
                  {c.glossL1}
                </div>
              )}
              {c.example && (
                <div style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-2)', marginTop: 5 }}>{c.example}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
