'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eyebrow, Panel, Tag } from '@hangyeol/ui';
import { get } from '../api-client';
import { Shell } from '../Shell';

/*
 * A-01 · 관리자 지표.
 *
 * 05번 §10 과 11번 핵심 지표 표가 무엇을 볼지 정해 두었고,
 * 거기에 SaaS 표준(MRR · ARPU)을 얹었다.
 *
 * 경고선을 숫자 옆에 붙인다. 숫자만 보여주면 매번 사람이 판단해야 하고,
 * 판단을 매번 시키면 언젠가 놓친다.
 *
 * 09번 문서는 관리자에 IP 화이트리스트 + 2FA 를 요구한다. 아직 없다.
 * 그래서 이 화면은 개인정보를 일절 내보내지 않는다 — 전부 집계값이다.
 */

interface Metric {
  key: string;
  label: string;
  value: number;
  unit: 'count' | 'percent' | 'krw' | 'ratio';
  threshold?: { value: number; direction: 'below' | 'above'; note: string };
  warning: boolean;
  meaning: string;
}

interface Dashboard {
  generatedAt: string;
  billingMonth: string;
  revenue: Metric[];
  students: Metric[];
  teachers: Metric[];
  funnel: Metric[];
  payments: Metric[];
  integrity: Metric[];
  content: {
    items: { key: string; label: string; drafted: number; target: number }[];
    images: { total: number; uploaded: number };
  };
}

function format(m: Metric): string {
  switch (m.unit) {
    case 'krw':
      return `${m.value.toLocaleString('ko-KR')}원`;
    case 'percent':
      return `${m.value}%`;
    case 'ratio':
      return `${m.value}명`;
    default:
      return m.value.toLocaleString('ko-KR');
  }
}

export default function AdminPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<Dashboard>('/api/admin/metrics')
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

  const warnings = [
    ...data.students,
    ...data.teachers,
    ...data.funnel,
    ...data.payments,
    ...data.integrity,
  ].filter((m) => m.warning);

  return (
    <Shell>
      <Eyebrow>관리자 · {data.billingMonth.slice(0, 7)}</Eyebrow>
      <h1 style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em', margin: '8px 0 4px' }}>
        운영 현황
      </h1>
      <p className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', margin: 0 }}>
        {data.generatedAt.slice(0, 16).replace('T', ' ')} 기준
      </p>

      {warnings.length > 0 && (
        <Panel style={{ marginTop: 18, background: 'var(--honghwa-w)', border: '1px solid transparent' }}>
          <Eyebrow>경고선을 벗어난 지표 {warnings.length}개</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {warnings.map((m) => (
              <div key={m.key} style={{ fontSize: 12.5, color: 'var(--honghwa)', marginBottom: 4 }}>
                · {m.label} <span className="mono">{format(m)}</span> — {m.threshold?.note}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Section title="매출" metrics={data.revenue} />
      <Section title="퍼널 — 매출이 나오는 길목" metrics={data.funnel} />
      <Section title="학생" metrics={data.students} />
      <Section title="강사 (고객)" metrics={data.teachers} />
      <Section title="결제" metrics={data.payments} />
      <Section title="잠금장치 무결성" metrics={data.integrity} />

      <Panel style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Eyebrow>콘텐츠 제작 현황</Eyebrow>
          <Link href="/admin/images" style={{ fontSize: 12 }}>
            이미지 자산 →
          </Link>
        </div>

        <div style={{ marginTop: 12 }}>
          {data.content.items.map((c) => {
            const pct = c.target === 0 ? 0 : Math.min(100, Math.round((c.drafted / c.target) * 100));
            return (
              <div key={c.key} style={{ padding: '9px 0', borderTop: '1px solid var(--rule-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13 }}>{c.label}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {c.drafted} / {c.target}
                  </span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: 'var(--rule)', marginTop: 5 }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: 99,
                      background: pct >= 100 ? 'var(--jade)' : 'var(--indigo)',
                    }}
                  />
                </div>
              </div>
            );
          })}

          <div style={{ padding: '9px 0', borderTop: '1px solid var(--rule-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13 }}>이미지 자산</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {data.content.images.uploaded} / {data.content.images.total}
              </span>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: 'var(--rule)', marginTop: 5 }}>
              <div
                style={{
                  width: `${(data.content.images.uploaded / Math.max(1, data.content.images.total)) * 100}%`,
                  height: '100%',
                  borderRadius: 99,
                  background: 'var(--indigo)',
                }}
              />
            </div>
          </div>
        </div>

        <p style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 12, lineHeight: 1.7 }}>
          전부 AI 초안입니다. 한국어교원 자격 2급 검수 전에는 실제 수업에 쓰지 않습니다.
        </p>
      </Panel>
    </Shell>
  );
}

function Section({ title, metrics }: { title: string; metrics: Metric[] }) {
  return (
    <Panel style={{ marginTop: 14 }}>
      <Eyebrow>{title}</Eyebrow>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
          marginTop: 12,
        }}
      >
        {metrics.map((m) => (
          <div key={m.key}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{m.label}</span>
              {m.warning && <Tag tone="h">경고</Tag>}
            </div>

            <div
              className="mono"
              style={{
                fontSize: 24,
                fontWeight: 500,
                letterSpacing: '-0.03em',
                marginTop: 4,
                color: m.warning ? 'var(--honghwa)' : 'var(--ink)',
              }}
            >
              {format(m)}
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 3, lineHeight: 1.6 }}>
              {m.meaning}
            </div>

            {m.threshold && (
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 3 }}>
                {m.threshold.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
