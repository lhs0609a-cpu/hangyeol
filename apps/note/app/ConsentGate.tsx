'use client';

import { useState } from 'react';

/*
 * 개인정보 동의 화면 — 09번 문서 §4.
 *
 * 필수 동의다. 동의 전에는 노트의 어떤 화면도 열리지 않는다.
 * 그래서 이 컴포넌트는 페이지가 아니라 레이아웃이 children 대신 렌더한다 —
 * 페이지로 만들면 새 화면을 추가할 때마다 리다이렉트를 붙여야 하고,
 * 언젠가 하나를 빠뜨린다.
 *
 * 문장은 전부 서버에서 온다. 학생의 모국어로 읽혀야 하고(09번 §4),
 * 고지 내용은 한 파일(packages/content/consent.ts)에만 있어야 한다.
 */

export interface Notice {
  locale: string;
  title: string;
  intro: string;
  items: string[];
  purpose: string;
  retention: string;
  withdrawal: string;
  required: string;
  agree: string;
  decline: string;
  retry: string;
}

export function ConsentGate({ notice }: { notice: Notice }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function agree() {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch('/api/note/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'agree' }),
      });
      if (!res.ok) throw new Error('failed');
      // 레이아웃이 다시 판단하도록 새로 연다. 상태를 두 곳에 두지 않는다.
      window.location.reload();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div className="hg-rise" lang={notice.locale}>
      <h1 className="t-h1" style={{ margin: 0 }}>
        {notice.title}
      </h1>
      <p className="t-body" style={{ marginTop: 12, color: 'var(--ink-2)', lineHeight: 1.75 }}>
        {notice.intro}
      </p>

      <ul className="t-body-sm" style={{ marginTop: 18, paddingLeft: 18, lineHeight: 1.9 }}>
        {notice.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <dl className="t-body-sm" style={{ marginTop: 6, lineHeight: 1.8 }}>
        <dd style={{ margin: '10px 0 0', color: 'var(--ink-2)' }}>{notice.purpose}</dd>
        <dd style={{ margin: '10px 0 0', color: 'var(--ink-2)' }}>{notice.retention}</dd>
        <dd style={{ margin: '10px 0 0', color: 'var(--ink-2)' }}>{notice.withdrawal}</dd>
      </dl>

      <p className="t-body-sm" style={{ marginTop: 18, color: 'var(--ink-3)' }}>
        {notice.required}
      </p>

      {failed && (
        <p className="t-body-sm" role="status" style={{ marginTop: 12, color: 'var(--honghwa)' }}>
          {notice.retry}
        </p>
      )}

      <button
        type="button"
        className="hg-tap"
        onClick={() => void agree()}
        disabled={busy}
        style={{
          marginTop: 22,
          width: '100%',
          minHeight: 'var(--touch-min)',
          padding: '14px 16px',
          borderRadius: 8,
          border: '1px solid var(--ink)',
          background: busy ? 'var(--rule-soft)' : 'var(--ink)',
          color: busy ? 'var(--ink-3)' : '#fff',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-body)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {notice.agree}
      </button>
    </div>
  );
}
