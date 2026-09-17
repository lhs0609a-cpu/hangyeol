'use client';

import { useEffect, useState } from 'react';
import { Button, Eyebrow, Panel, Tag } from '@hangyeol/ui';
import { get, patch, post } from '../api-client';
import { Shell } from '../Shell';

/*
 * 강사 프로필 · 시급 — 02번 문서 A-02·A-03.
 *
 * 시급은 단순한 프로필 항목이 아니라 요금 티어의 산정 근거다.
 * 그래서 저장하면 "언제부터 적용되는지"를 반드시 함께 보여준다.
 * 진행 중 주기의 요금은 바뀌지 않는다 — 그게 05번 §8-1 이다.
 */

interface Me {
  id: string;
  email: string;
  name: string;
  timezone: string;
  spokenLangs: string[];
  hourlyRateUsd: number | null;
  rateTier: string | null;
  billingStatus: string;
  creditBalance: number;
  onboardingStage: string;
}

interface RateResult {
  hourlyRateUsd: number | null;
  rateTier: string;
  currentCyclePrice: number | null;
  nextCyclePrice: number;
  note: string;
}

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [rate, setRate] = useState('');
  const [name, setName] = useState('');
  const [saved, setSaved] = useState<RateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get<Me>('/api/me')
      .then((d) => {
        setMe(d);
        setName(d.name);
        setRate(d.hourlyRateUsd === null ? '' : String(d.hourlyRateUsd));
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { name };
      if (rate.trim() !== '') body.hourlyRateUsd = Number(rate);
      setSaved(await patch<RateResult>('/api/me', body));
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다. 잠시 후 다시 시도하세요');
    } finally {
      setBusy(false);
    }
  }

  if (error && !me) {
    return (
      <Shell wide={false}>
        <Panel>
          <p style={{ margin: 0, fontSize: 'var(--fs-body)' }}>{error}</p>
        </Panel>
      </Shell>
    );
  }

  if (!me) {
    return (
      <Shell wide={false}>
        <p style={{ color: 'var(--ink-3)', fontSize: 'var(--fs-body)' }}>불러오는 중</p>
      </Shell>
    );
  }

  return (
    <Shell wide={false}>
      <Eyebrow>설정</Eyebrow>
      <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 600, letterSpacing: '-0.02em', margin: '8px 0 20px' }}>
        프로필
      </h1>

      <Panel>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', fontSize: 'var(--fs-body-sm)', fontWeight: 600, marginBottom: 5 }}>이름</span>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </label>

        <label style={{ display: 'block', marginTop: 16 }}>
          <span style={{ display: 'block', fontSize: 'var(--fs-body-sm)', fontWeight: 600, marginBottom: 5 }}>
            시급 (USD)
          </span>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="18"
            style={inputStyle}
          />
          <span style={{ display: 'block', fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 4 }}>
            요금 티어의 산정 근거입니다. 미입력 시 B 티어로 봅니다
          </span>
        </label>

        <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag tone="i">현재 티어 {me.rateTier ?? 'B'}</Tag>
          <Tag tone={me.billingStatus === 'locked' ? 'h' : 'j'}>결제 {me.billingStatus}</Tag>
          {me.creditBalance > 0 && <Tag tone="j">크레딧 {me.creditBalance.toLocaleString('ko-KR')}원</Tag>}
        </div>

        {saved && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 8,
              background: 'var(--indigo-w)',
              color: 'var(--indigo)',
              fontSize: 'var(--fs-body-sm)',
              lineHeight: 1.7,
            }}
          >
            티어 {saved.rateTier} · 다음 주기 요금{' '}
            <span className="mono">{saved.nextCyclePrice.toLocaleString('ko-KR')}원</span>
            <br />
            {saved.note}
            {saved.currentCyclePrice !== null && (
              <>
                <br />
                진행 중 주기는{' '}
                <span className="mono">{saved.currentCyclePrice.toLocaleString('ko-KR')}원</span>으로 유지됩니다
              </>
            )}
          </div>
        )}

        {error && <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--honghwa)', marginTop: 12 }}>{error}</p>}

        <div style={{ marginTop: 18 }}>
          <Button kind="primary" full disabled={busy} onClick={save}>
            {busy ? '저장하는 중' : '저장 — 다음 주기부터 적용'}
          </Button>
        </div>
      </Panel>

      <WithdrawPanel email={me?.email ?? ''} />

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <Button
          kind="quiet"
          size="sm"
          onClick={async () => {
            // 서버가 쿠키를 지운다. 클라이언트에서 지울 수 없다(HttpOnly).
            await post('/api/auth/logout', {});
            location.href = '/login';
          }}
        >
          로그아웃
        </Button>
      </div>
    </Shell>
  );
}

/*
 * 탈퇴 — 09번 문서 §4 보관기간.
 *
 * 되돌리는 버튼을 만들지 않았다. 되돌릴 수 있게 하려면 탈퇴 상태를
 * 계속 들고 있어야 하고, 그러면 "탈퇴했는데 데이터가 남아 있다" 가 된다.
 * 대신 무엇이 언제 지워지는지를 누르기 전에 말한다.
 */
function WithdrawPanel({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function withdraw() {
    setBusy(true);
    setFailed(null);
    try {
      await post('/api/me/withdraw', { confirmEmail });
      location.href = '/login';
    } catch (e) {
      setFailed(e instanceof Error ? e.message : '처리하지 못했습니다. 다시 시도해 주세요');
      setBusy(false);
    }
  }

  return (
    <Panel style={{ marginTop: 20 }}>
      <h2 className="t-h2" style={{ margin: 0 }}>
        탈퇴
      </h2>
      <p className="t-body-sm tone-muted" style={{ margin: '8px 0 0' }}>
        계정은 바로 막힙니다. 학생의 학습 기록은 90일 뒤에 지워지고, 청구·정산 기록은 거래 근거라
        더 오래 보관합니다.
      </p>

      {open ? (
        <div style={{ marginTop: 14 }}>
          <label className="t-body-sm" htmlFor="withdraw-email">
            확인을 위해 <span className="mono">{email}</span> 를 그대로 입력해 주세요
          </label>
          <input
            id="withdraw-email"
            className="t-body"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            style={{ ...inputStyle, marginTop: 8 }}
          />
          {failed && (
            <p className="t-body-sm" style={{ color: 'var(--honghwa)', marginTop: 10 }}>
              {failed}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button kind="ghost" onClick={() => setOpen(false)}>
              그만두기
            </Button>
            <Button
              kind="primary"
              disabled={busy || confirmEmail.trim().toLowerCase() !== email.toLowerCase()}
              onClick={() => void withdraw()}
            >
              {busy ? '처리하는 중' : '탈퇴하기'}
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <Button kind="ghost" size="sm" onClick={() => setOpen(true)}>
            탈퇴 진행
          </Button>
        </div>
      )}
    </Panel>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  fontSize: 'var(--fs-body)',
  fontFamily: 'inherit',
  border: '1px solid var(--rule)',
  borderRadius: 7,
  background: 'var(--surface)',
  color: 'var(--ink)',
};
