'use client';

import { useEffect, useState } from 'react';
import { TIER_PRICE } from '@hangyeol/billing';
import type { RateTier } from '@hangyeol/shared';
import { Button, Eyebrow, Panel, Tag } from '@hangyeol/ui';
import { get } from '../api-client';
import { Shell } from '../Shell';

/*
 * T-05 · 청구 — 07번 문서.
 *
 * 휴면 학생을 목록에서 숨기지 않는다. 0원으로 명시하는 것이 신뢰를 만든다.
 * 내역이 투명해야 분쟁이 안 생긴다.
 */

interface Summary {
  billingMonth: string;
  total: number;
  creditBalance: number;
  chargeAmount: number;
  activeCount: number;
  lines: { studentId: string; nameKo: string; amount: number; note: string }[];
  waived: { studentId: string; nameKo: string; reason: string }[];
  tier: RateTier;
  nextCyclePrice: number;
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function BillingPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<Summary>('/api/billing/summary')
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Shell>
        <Panel>
          <p style={{ margin: 0, fontSize: 'var(--fs-body)' }}>{error}</p>
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => location.reload()}>다시 시도</Button>
          </div>
        </Panel>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <p style={{ color: 'var(--ink-3)', fontSize: 'var(--fs-body)' }}>불러오는 중</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <Eyebrow>{data.billingMonth.slice(0, 7).replace('-', '년 ')}월 청구</Eyebrow>

      <div className="mono" style={{ fontSize: 'var(--fs-display)', fontWeight: 500, letterSpacing: '-0.03em', marginTop: 8 }}>
        {won(data.total)}
      </div>
      <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', marginTop: 4 }}>
        학생별 28일 주기로 계산하고, 카드는 월 1회만 청구합니다
      </p>

      {data.creditBalance > 0 && (
        <p className="mono" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--jade)', marginTop: 6 }}>
          크레딧 {won(data.creditBalance)} 보유 · 카드 청구 {won(data.chargeAmount)}
        </p>
      )}

      <Panel style={{ marginTop: 22 }}>
        <Eyebrow>학생별 내역 · 활성 {data.activeCount}명</Eyebrow>

        <div style={{ marginTop: 12 }}>
          {data.lines.map((l) => (
            <Row key={l.studentId} name={l.nameKo} right={won(l.amount)} note={l.note} />
          ))}

          {/* 휴면 학생도 목록에 남긴다. 숨기면 그게 분쟁의 씨앗이 된다. */}
          {data.waived.map((w) => (
            <Row
              key={w.studentId}
              name={w.nameKo}
              right="청구 없음"
              note={w.reason}
              muted
            />
          ))}

          {data.lines.length === 0 && data.waived.length === 0 && (
            <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-4)', margin: '10px 0' }}>
              아직 청구할 것이 없습니다. 2차시부터 요금이 발생합니다
            </p>
          )}
        </div>
      </Panel>

      <Panel style={{ marginTop: 14, background: 'var(--indigo-w)', border: '1px solid transparent' }}>
        <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)', color: 'var(--indigo)', lineHeight: 1.7 }}>
          수업이 없으면 청구하지 않습니다. 28일 동안 한 번도 수업하지 않은 학생은
          자동 휴면 처리되고, 다시 수업을 시작하면 그날부터 새 주기가 열립니다.
        </p>
      </Panel>

      <Panel style={{ marginTop: 14 }}>
        <Eyebrow>요금 기준</Eyebrow>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 'var(--fs-body-sm)' }}>
          <thead>
            <tr style={{ color: 'var(--ink-4)', textAlign: 'left' }}>
              <th style={{ fontWeight: 500, padding: '6px 0' }}>티어</th>
              <th style={{ fontWeight: 500 }}>시급(USD)</th>
              <th style={{ fontWeight: 500, textAlign: 'right' }}>학생 1명 / 28일</th>
            </tr>
          </thead>
          <tbody>
            {(['A', 'B', 'C', 'D'] as RateTier[]).map((tier) => {
              const current = tier === data.tier;
              return (
                <tr
                  key={tier}
                  style={{
                    background: current ? 'var(--indigo-w)' : undefined,
                    borderTop: '1px solid var(--rule-soft)',
                  }}
                >
                  <td className="mono" style={{ padding: '8px 6px' }}>
                    {tier} {current && <Tag tone="i">현재</Tag>}
                  </td>
                  <td className="mono" style={{ color: 'var(--ink-3)' }}>
                    {{ A: '< 15', B: '15 ~ 25', C: '25 ~ 40', D: '40 이상' }[tier]}
                  </td>
                  <td className="mono" style={{ textAlign: 'right', paddingRight: 6 }}>
                    {won(TIER_PRICE[tier])}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 12, lineHeight: 1.7 }}>
          전 구간 실효 부담률 약 12%. 11명부터 20% 할인.
          온보딩 · 트레이닝 · 교재 · 도구는 전부 무료입니다.
          {' '}다음 주기 개시 요금은 <span className="mono">{won(data.nextCyclePrice)}</span>입니다.
        </p>
      </Panel>
    </Shell>
  );
}

function Row({
  name,
  right,
  note,
  muted = false,
}: {
  name: string;
  right: string;
  note: string;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 0',
        borderTop: '1px solid var(--rule-soft)',
        opacity: muted ? 0.66 : 1,
      }}
    >
      <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>{name}</span>
      <span style={{ flex: 1, fontSize: 'var(--fs-caption)', color: 'var(--ink-4)' }}>{note}</span>
      <span
        className="mono"
        style={{ fontSize: 'var(--fs-body)', color: muted ? 'var(--chija)' : 'var(--ink)', whiteSpace: 'nowrap' }}
      >
        {right}
      </span>
    </div>
  );
}
