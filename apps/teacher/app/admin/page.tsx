'use client';

import { useEffect, useState } from 'react';
import { Eyebrow, Metric, Panel, Tag } from '@hangyeol/ui';
import { get } from '../api-client';
import { Shell } from '../Shell';

/*
 * A-01 · 관리자 지표 — 07번 문서.
 *
 * 우회 의심은 플래그만 띄운다. 자동 제재는 하지 않는다. 사람이 확인한다.
 * 09번 문서가 요구하는 IP 화이트리스트 + 2FA 게이트는 아직 없다 —
 * 그 전까지 이 화면은 개인정보를 일절 내보내지 않는다.
 */

interface Metrics {
  students: { active: number; dormant: number; locked: number };
  teachers: number;
  avgStudentsPerTeacher: number;
  cycles: Record<string, number>;
  invoices: Record<string, number>;
  dormantRatePct: number;
  creditBalanceTotal: number;
  bypassSuspects: number;
  content: Record<string, { drafted?: number; target?: number; note?: string; [k: string]: unknown }>;
}

const CONTENT_LABEL: Record<string, string> = {
  curriculum: '커리큘럼 차시',
  classroomEnglish: '교실영어 문장',
  hvpt: 'HVPT 음원',
  scenarios: '시나리오 드릴',
  fluency: '4·3·2 주제',
  pronunciation: '발음 시트',
  trialPacks: '체험수업 팩',
  listening: '다청 오디오',
};

export default function AdminPage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<Metrics>('/api/admin/metrics')
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Shell>
        <Panel>
          <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
        </Panel>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>불러오는 중</p>
      </Shell>
    );
  }

  const dormantWarn = data.dormantRatePct > 30;
  const bypassWarn = data.bypassSuspects > 0;

  return (
    <Shell>
      <Eyebrow>관리자 지표</Eyebrow>
      <h1 style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em', margin: '8px 0 20px' }}>
        운영 현황
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <Metric eyebrow="활성 학생" value={String(data.students.active)} note={`휴면 ${data.students.dormant} · 잠금 ${data.students.locked}`} size={30} />
        <Metric eyebrow="강사" value={String(data.teachers)} note={`강사당 평균 ${data.avgStudentsPerTeacher}명`} />
        <Metric
          eyebrow="휴면 전환율"
          value={`${data.dormantRatePct}%`}
          note={dormantWarn ? '경고선 30% 초과' : '경고선 30%'}
        />
        <Metric
          eyebrow="크레딧 예치 총액"
          value={`${data.creditBalanceTotal.toLocaleString('ko-KR')}원`}
        />
      </div>

      {/*
        11번 문서: "마지막에서 두 번째가 가장 중요하다.
        이 수치가 올라가면 잠금장치가 새고 있다는 뜻이다."
      */}
      <Panel
        style={{
          marginTop: 14,
          background: bypassWarn ? 'var(--honghwa-w)' : 'var(--surface)',
          border: bypassWarn ? '1px solid transparent' : '1px solid var(--rule)',
        }}
      >
        <Eyebrow>우회 의심 — 열람은 있으나 학생활동 0 (30일)</Eyebrow>
        <div
          className="mono"
          style={{ fontSize: 30, fontWeight: 500, marginTop: 8, color: bypassWarn ? 'var(--honghwa)' : 'var(--ink)' }}
        >
          {data.bypassSuspects}건
        </div>
        <p style={{ fontSize: 12, color: bypassWarn ? 'var(--honghwa)' : 'var(--ink-4)', marginTop: 6, lineHeight: 1.7 }}>
          이 수치가 올라가면 잠금장치가 새고 있다는 뜻입니다.
          플래그만 띄웁니다 — 자동 제재는 하지 않습니다. 사람이 확인합니다.
        </p>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginTop: 14 }}>
        <Panel>
          <Eyebrow>주기 상태</Eyebrow>
          <CountList counts={data.cycles} />
        </Panel>
        <Panel>
          <Eyebrow>청구 상태</Eyebrow>
          <CountList counts={data.invoices} />
        </Panel>
      </div>

      <Panel style={{ marginTop: 14 }}>
        <Eyebrow>콘텐츠 제작 현황</Eyebrow>
        <p style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 6 }}>
          목표 대비 실제. 오디오는 코드로 만들 수 없습니다 — 녹음 또는 TTS 배치가 필요합니다.
        </p>

        <div style={{ marginTop: 12 }}>
          {Object.entries(data.content).map(([key, v]) => {
            const drafted = Number(v.drafted ?? v.plannedTokens ?? 0);
            const target = Number(v.target ?? v.plannedTokens ?? 0);
            const pct = target === 0 ? 0 : Math.min(100, Math.round((drafted / target) * 100));
            const audio = key === 'hvpt' ? Number(v.generatedAudio ?? 0) : key === 'listening' ? Number(v.recordedAudio ?? 0) : null;

            return (
              <div key={key} style={{ padding: '10px 0', borderTop: '1px solid var(--rule-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{CONTENT_LABEL[key] ?? key}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {drafted} / {target}
                  </span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: 'var(--rule)', marginTop: 6 }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: pct >= 100 ? 'var(--jade)' : 'var(--indigo)' }} />
                </div>
                {audio !== null && (
                  <div style={{ marginTop: 6 }}>
                    <Tag tone={audio === 0 ? 'h' : 'j'}>오디오 {audio}개</Tag>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </Shell>
  );
}

function CountList({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    return <p style={{ fontSize: 12.5, color: 'var(--ink-4)', marginTop: 10 }}>아직 없습니다</p>;
  }
  return (
    <div style={{ marginTop: 10 }}>
      {entries.map(([k, v]) => (
        <div
          key={k}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '7px 0',
            borderTop: '1px solid var(--rule-soft)',
            fontSize: 12.5,
          }}
        >
          <span className="mono" style={{ color: 'var(--ink-3)' }}>{k}</span>
          <span className="mono">{v}</span>
        </div>
      ))}
    </div>
  );
}
