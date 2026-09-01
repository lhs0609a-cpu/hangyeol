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
  { grade: 'hard', label: '어려움', sub: '1일 후', bg: 'var(--honghwa-w)', fg: 'var(--honghwa)' },
  { grade: 'good', label: '보통', sub: '3일 후', bg: 'var(--chija-w)', fg: 'var(--chija)' },
  { grade: 'easy', label: '쉬움', sub: '7일 후', bg: 'var(--jade-w)', fg: 'var(--jade)' },
];

export default function SrsPage() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/note/srs/due')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setCards(d.items ?? []))
      .catch(() => setCards([]));
  }, []);

  if (cards === null) {
    return <Loading />;
  }

  if (cards.length === 0) {
    return (
      <Done message="오늘 복습할 카드가 없습니다. 내일 또 만나요" />
    );
  }

  if (index >= cards.length) {
    return <Done message={`${cards.length}개 다 했어요. 잘했어요`} />;
  }

  const card = cards[index]!;

  async function grade(g: Grade) {
    setBusy(true);
    try {
      await fetch(`/api/note/srs/${card.id}/grade`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ grade: g }),
      });
    } finally {
      setBusy(false);
      setFlipped(false);
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="hg-rise">
      <TopBar right={`${index + 1} / ${cards.length}`} />

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
        <div style={{ fontSize: 30, fontWeight: 600 }}>{card.term}</div>

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
              fontSize: 14,
            }}
          >
            뜻 보기
          </button>
        ) : (
          <div style={{ marginTop: 20 }}>
            {card.glossL1 && (
              <div className="mono" style={{ fontSize: 14, color: 'var(--ink-3)' }}>{card.glossL1}</div>
            )}
            {card.example && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  background: 'var(--surface)',
                  borderRadius: 8,
                  fontSize: 15,
                  textAlign: 'left',
                }}
              >
                {card.example}
              </div>
            )}
            {/* 클립이 없으면 버튼을 띄우지 않는다 — 가짜 재생 금지 */}
            {card.audioKey && (
              <button
                className="hg-tap"
                style={{
                  marginTop: 14,
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1px solid var(--hanji-rule)',
                  background: 'var(--surface)',
                  fontSize: 13,
                }}
              >
                ▶ 선생님 목소리로
              </button>
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
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {g.label}
              <span className="mono" style={{ display: 'block', fontSize: 10.5, fontWeight: 400, marginTop: 3 }}>
                {g.sub}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
