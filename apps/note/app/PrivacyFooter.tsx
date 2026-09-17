'use client';

import { useState } from 'react';

/*
 * 09번 문서 §4 — "철회 요청 시 30일 내 파기, 강사에게 통지".
 *
 * 철회 경로가 화면에 없으면 그 권리는 없는 것과 같다. 학생에게는
 * 문의할 주소도, 우리 회사 이름도 없다(화이트라벨). 그래서 여기 둔다.
 *
 * 누르는 순간 지우지 않는다. 진행 중인 수업의 진도와 기록이 함께 사라지면
 * 강사는 이유도 모른 채 학생을 잃는다. 요청을 남기고 강사에게 알린 뒤,
 * 30일이 지나면 파기 배치가 지운다.
 */

export interface PrivacyStrings {
  locale: string;
  title: string;
  items: string[];
  purpose: string;
  retention: string;
  withdrawal: string;
  withdrawAction: string;
  withdrawConfirm: string;
  retry: string;
}

export function PrivacyFooter({ strings }: { strings: PrivacyStrings }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');

  async function withdraw() {
    setState('busy');
    try {
      const res = await fetch('/api/note/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw' }),
      });
      if (!res.ok) throw new Error('failed');
      setState('done');
    } catch {
      setState('failed');
    }
  }

  return (
    <section lang={strings.locale} style={{ marginTop: 34, paddingTop: 18, borderTop: '1px solid var(--hanji-rule)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--ink-4)',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-caption)',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        {strings.title}
      </button>

      {open && (
        <div className="t-caption" style={{ marginTop: 12, color: 'var(--ink-3)', lineHeight: 1.8 }}>
          <p style={{ margin: 0 }}>{strings.items.join(' · ')}</p>
          <p style={{ margin: '8px 0 0' }}>{strings.purpose}</p>
          <p style={{ margin: '8px 0 0' }}>{strings.retention}</p>
          <p style={{ margin: '8px 0 0' }}>{strings.withdrawal}</p>

          {state === 'done' ? (
            <p style={{ margin: '12px 0 0', color: 'var(--ink-2)' }}>{strings.withdrawConfirm}</p>
          ) : (
            <>
              {state === 'failed' && (
                <p role="status" style={{ margin: '12px 0 0', color: 'var(--honghwa)' }}>
                  {strings.retry}
                </p>
              )}
              <button
                type="button"
                className="hg-tap"
                onClick={() => void withdraw()}
                disabled={state === 'busy'}
                style={{
                  marginTop: 12,
                  minHeight: 'var(--touch-min)',
                  padding: '9px 14px',
                  borderRadius: 7,
                  border: '1px solid var(--hanji-rule)',
                  background: 'transparent',
                  color: 'var(--ink-3)',
                  fontFamily: 'inherit',
                  fontSize: 'var(--fs-caption)',
                  cursor: 'pointer',
                }}
              >
                {strings.withdrawAction}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
