'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '../ui';

/*
 * 진도 대시보드 — 02번 문서 D-08.
 *
 * 없는 숫자를 만들지 않는다. 레벨 테스트를 안 봤으면 안 봤다고 쓴다.
 * 그럴듯한 추정치를 보여주면 학생이 자기 위치를 잘못 안다.
 */

interface Progress {
  levelCode: string;
  currentLessonNo: number;
  lessons: number;
  weeks: number;
  vocab: { total: number; graduated: number };
  levelAssignedAt: string | null;
}

export default function ProgressPage() {
  const [data, setData] = useState<Progress | null>(null);

  useEffect(() => {
    fetch('/api/note/progress')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return <p style={{ textAlign: 'center', paddingTop: 40, color: 'var(--ink-3)' }}>불러오는 중</p>;

  const level = data.levelCode.replace('topik', '');

  return (
    <div className="hg-rise">
      <TopBar />

      <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 600, marginTop: 22 }}>지금까지</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 20 }}>
        <Stat label="지금 급" value={`${level}급`} sub={data.levelAssignedAt ? '레벨 테스트로 배정' : '아직 테스트 전'} />
        <Stat label="차시" value={String(data.currentLessonNo)} sub={`수업 ${data.lessons}회`} />
        <Stat label="배운 표현" value={String(data.vocab.total)} sub={`${data.vocab.graduated}개는 외웠어요`} />
        <Stat label="함께한 기간" value={data.weeks > 0 ? `${data.weeks}주` : '첫 주'} sub="" />
      </div>

      {!data.levelAssignedAt && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: 'var(--hanji-card)',
            border: '1px solid var(--hanji-rule)',
            borderRadius: 10,
          }}
        >
          <p style={{ margin: 0, fontSize: 'var(--fs-body)', lineHeight: 1.7 }}>
            아직 레벨 테스트를 안 봤어요. 5분이면 끝나요.
          </p>
          <a
            href="/level-test"
            style={{
              display: 'inline-block',
              marginTop: 12,
              padding: '11px 18px',
              borderRadius: 8,
              background: 'var(--indigo)',
              color: '#fff',
              fontSize: 'var(--fs-body)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            레벨 테스트 하기
          </a>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        padding: 16,
        background: 'var(--hanji-card)',
        border: '1px solid var(--hanji-rule)',
        borderRadius: 10,
      }}
    >
      <div className="eyebrow">{label}</div>
      <div className="mono" style={{ fontSize: 'var(--fs-h1)', fontWeight: 500, marginTop: 6, letterSpacing: '-0.03em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
