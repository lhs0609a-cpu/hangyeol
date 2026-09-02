'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Eyebrow, Panel, Tag } from '@hangyeol/ui';
import { Shell } from '../../Shell';

/*
 * 강사 승인 — 관리자 전용.
 *
 * 대기 중인 신청이 있으면 그것부터 보인다. 승인은 한 번 누르면 끝나고,
 * 거절은 사유를 적어야만 눌린다 — 그 문장이 강사에게 그대로 가기 때문이다.
 *
 * 되돌리기를 만들지 않았다. 승인 후 정지는 거절과 다른 일이고,
 * 그걸 같은 버튼으로 처리하면 실수로 계정을 끊게 된다.
 */

interface Applicant {
  id: string;
  email: string;
  name: string;
  countryCode: string;
  applyNote: string | null;
  createdAt: string;
  approvedAt: string | null;
  rejectedReason: string | null;
}

type Status = 'pending' | 'approved' | 'rejected';

const TAB: { key: Status; label: string }[] = [
  { key: 'pending', label: '대기' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '거절' },
];

export default function AdminTeachersPage() {
  const [status, setStatus] = useState<Status>('pending');
  const [rows, setRows] = useState<Applicant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (s: Status) => {
    setRows(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/teachers?status=${s}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? '목록을 불러오지 못했어요');
      setRows(data.teachers);
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록을 불러오지 못했어요');
    }
  }, []);

  useEffect(() => {
    void load(status);
  }, [status, load]);

  return (
    <Shell>
      <Eyebrow>강사 승인</Eyebrow>
      <h1 className="t-h1" style={{ margin: '6px 0 0' }}>
        가입 신청
      </h1>
      <p className="t-body-sm tone-muted" style={{ margin: '8px 0 0' }}>
        승인해야 로그인할 수 있습니다. 교재가 그대로 전달되기 때문에 한 분씩 확인합니다.
      </p>

      <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
        {TAB.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            aria-current={status === t.key}
            className="t-body-sm"
            style={{
              padding: '8px 14px',
              minHeight: 'var(--touch-min)',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--rule)',
              cursor: 'pointer',
              background: status === t.key ? 'var(--ink)' : 'var(--surface)',
              color: status === t.key ? 'var(--surface)' : 'var(--ink-2)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        {error ? (
          <Panel>
            <p className="t-body" style={{ margin: 0 }}>
              {error}
            </p>
            <div style={{ marginTop: 12 }}>
              <Button size="sm" onClick={() => void load(status)}>
                다시 시도
              </Button>
            </div>
          </Panel>
        ) : rows === null ? (
          <Panel>
            <p className="t-body tone-muted" style={{ margin: 0 }}>
              불러오는 중
            </p>
          </Panel>
        ) : rows.length === 0 ? (
          <Panel>
            <p className="t-body-lg" style={{ margin: 0 }}>
              {status === 'pending' ? '기다리는 신청이 없어요' : '해당하는 강사가 없어요'}
            </p>
          </Panel>
        ) : (
          rows.map((a) => (
            <Row key={a.id} a={a} status={status} onDone={() => void load(status)} />
          ))
        )}
      </div>
    </Shell>
  );
}

function Row({ a, status, onDone }: { a: Applicant; status: Status; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: 'approved' | 'rejected') {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ teacherId: a.id, decision, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? '처리하지 못했어요');
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리하지 못했어요');
      setBusy(false);
    }
  }

  const waited = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 86_400_000);

  return (
    <Panel style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 className="t-h2" style={{ margin: 0 }}>
            {a.name}
          </h2>
          <p className="t-body-sm tone-muted" style={{ margin: '4px 0 0' }}>
            {a.email} · {a.countryCode}
          </p>
        </div>
        {status === 'pending' && (
          // 오래 기다린 사람을 눈에 띄게 한다. 순서대로 처리하기 위해서다.
          <Tag tone={waited >= 2 ? 'h' : 'n'}>
            {waited === 0 ? '오늘 신청' : `${waited}일 대기`}
          </Tag>
        )}
        {status === 'approved' && <Tag tone="j">승인됨</Tag>}
        {status === 'rejected' && <Tag tone="n">거절됨</Tag>}
      </div>

      {a.applyNote && (
        <p
          className="t-body-sm"
          style={{
            margin: '12px 0 0',
            padding: '11px 13px',
            background: 'var(--rule-soft)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--ink-2)',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}
        >
          {a.applyNote}
        </p>
      )}

      {a.rejectedReason && (
        <p className="t-body-sm" style={{ margin: '12px 0 0', color: 'var(--honghwa)' }}>
          거절 사유 · {a.rejectedReason}
        </p>
      )}

      {error && (
        <p className="t-body-sm" role="alert" style={{ margin: '12px 0 0', color: 'var(--honghwa)' }}>
          {error}
        </p>
      )}

      {status === 'pending' && (
        <div style={{ marginTop: 14 }}>
          {rejecting ? (
            <>
              <label className="t-body-sm" style={{ display: 'block', marginBottom: 6 }}>
                거절 사유 — 강사에게 그대로 보입니다
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 'var(--fs-body-sm)',
                  fontFamily: 'inherit',
                  border: '1px solid var(--rule)',
                  borderRadius: 'var(--r-sm)',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {/* 파괴적 동작이지만 색으로 알리지 않는다. 라벨이 결과를 말한다 — 06번 §4.2 */}
                <Button
                  size="sm"
                  disabled={busy || reason.trim().length === 0}
                  onClick={() => void decide('rejected')}
                >
                  거절 — 사유를 보냅니다
                </Button>
                <Button size="sm" onClick={() => setRejecting(false)}>
                  취소
                </Button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" kind="jade" disabled={busy} onClick={() => void decide('approved')}>
                {busy ? '처리하는 중' : '승인 — 바로 로그인됩니다'}
              </Button>
              <Button size="sm" disabled={busy} onClick={() => setRejecting(true)}>
                거절
              </Button>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
