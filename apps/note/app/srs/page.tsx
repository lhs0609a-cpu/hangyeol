'use client';

import { useEffect, useState } from 'react';
import { Done, Loading, TopBar } from '../ui';

/*
 * S-04 · 복습 카드 (SRS) — 07번 문서.
 *
 * "선생님 목소리로" 버튼은 그 표현이 나온 실제 수업 음성 클립이다.
 * 일반 단어장 앱과 결정적으로 다른 지점이고, 클립이 없으면 버튼을 아예 띄우지 않는다.
 * 가짜 재생은 신뢰를 한 번에 깎는다.
 */

interface Card {
  id: string;
  term: string;
  glossL1: string | null;
  example: string | null;
  audioKey: string | null;
}

type Grade = 'hard' | 'good' | 'easy';

const GRADES: { grade: Grade; label: string; sub: string; bg: string; fg: string }[] = [
  { grade: 'hard', label: '어려움 / Hard', sub: '1일 후 / 1 day', bg: 'var(--honghwa-w)', fg: 'var(--honghwa)' },
  { grade: 'good', label: '보통 / Good', sub: '3일 후 / 3 days', bg: 'var(--chija-w)', fg: 'var(--chija)' },
  { grade: 'easy', label: '쉬움 / Easy', sub: '7일 후 / 7 days', bg: 'var(--jade-w)', fg: 'var(--jade)' },
];

export default function SrsPage() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const response = await fetch('/api/note/srs/due');
      if (!response.ok) throw new Error('load');
      const data = await response.json();
      setCards(data.items ?? []);
    } catch {
      setError('카드를 불러오지 못했어요. 다시 시도해 주세요. / Could not load your cards. Please retry.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (cards === null) {
    if (error) return <div><TopBar /><p role="alert" style={{ marginTop: 24 }}>{error}</p><button onClick={() => void load()} style={{ marginTop: 16 }}>다시 시도 / Retry</button></div>;
    return <Loading />;
  }

  if (cards.length === 0) {
    return (
      <Done message="오늘 복습을 마쳤어요. / No cards due today. See you tomorrow." />
    );
  }

  if (index >= cards.length) {
    return <Done message={`${cards.length}개 완료! / All ${cards.length} cards reviewed.`} />;
  }

  const card = cards[index]!;

  async function grade(g: Grade) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/note/srs/${card.id}/grade`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ grade: g }),
      });
      if (!response.ok) throw new Error('save');
      setFlipped(false);
      setIndex((i) => i + 1);
    } catch {
      setError('저장하지 못했어요. 같은 카드를 다시 확인해 주세요. / Your review was not saved. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hg-rise">
      <TopBar right={`${index + 1} / ${cards.length}`} />
      <h1 className="t-h1" style={{ marginTop: 24 }}>복습 / A little review</h1>
      <p className="t-body-sm" lang="en" style={{ marginTop: 10, color: 'var(--ink-3)' }}>Try to recall the meaning before you turn the card over.</p>
      {error && <p role="alert" style={{ color: 'var(--honghwa)', marginTop: 16 }}>{error}</p>}

      <div
        style={{
          marginTop: 30,
          background: 'var(--hanji-card)',
          border: '1px solid var(--hanji-rule)',
          borderRadius: 10,
          padding: '36px 20px',
          textAlign: 'center',
          minHeight: 200,
        }}
      >
        <div style={{ fontSize: 'var(--fs-h1)', fontWeight: 600 }}>{card.term}</div>

        {!flipped ? (
          <button
            className="hg-tap"
            onClick={() => setFlipped(true)}
            style={{
              marginTop: 24,
              padding: '12px 22px',
              borderRadius: 8,
              border: '1px solid var(--hanji-rule)',
              background: 'var(--surface)',
              color: 'var(--ink-2)',
              fontSize: 'var(--fs-body)',
            }}
          >
            뜻 보기 / Reveal meaning
          </button>
        ) : (
          <div style={{ marginTop: 20 }}>
            {card.glossL1 && (
              <div className="mono" style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-3)' }}>{card.glossL1}</div>
            )}
            {card.example && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  background: 'var(--surface)',
                  borderRadius: 8,
                  fontSize: 'var(--fs-body-lg)',
                  textAlign: 'left',
                }}
              >
                {card.example}
              </div>
            )}
            {/* 재생 경로가 연결되기 전에는 작동하지 않는 버튼을 표시하지 않는다. */}
            {card.audioKey && (
              <p className="t-body-sm" style={{ marginTop: 14 }}>수업에서 선생님과 발음을 연습해요. / Practice the pronunciation with your teacher.</p>
            )}
          </div>
        )}
      </div>

      {flipped && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 18 }}>
          {GRADES.map((g) => (
            <button
              key={g.grade}
              className="hg-tap"
              disabled={busy}
              onClick={() => grade(g.grade)}
              style={{
                padding: '14px 8px',
                borderRadius: 8,
                border: '1px solid transparent',
                background: g.bg,
                color: g.fg,
                fontSize: 'var(--fs-body)',
                fontWeight: 600,
              }}
            >
              {g.label}
              <span className="mono" style={{ display: 'block', fontSize: 'var(--fs-eyebrow)', fontWeight: 400, marginTop: 3 }}>
                {g.sub}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
