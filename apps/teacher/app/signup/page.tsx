'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Eyebrow, Panel } from '@hangyeol/ui';

/*
 * 강사 신청 — 02번 문서 A-01.
 *
 * 가입이 아니라 신청이다. 여기서 계정이 만들어지지만 로그인은 안 된다.
 * 그 사실을 버튼을 누르기 전에 말한다 — 누른 뒤에 알면 속았다고 느낀다.
 *
 * 자기소개를 받는 이유: 승인 판단의 유일한 근거다.
 * 이게 없으면 관리자는 이메일 주소만 보고 승인 여부를 정해야 한다.
 */

const MIN_PASSWORD = 10;

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [applyNote, setApplyNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, name, applyNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? '신청하지 못했어요. 잠시 후 다시 시도해 주세요');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '신청하지 못했어요. 잠시 후 다시 시도해 주세요');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Center>
        <Panel>
          <Eyebrow>신청 완료</Eyebrow>
          <h1 className="t-h1" style={{ margin: '10px 0 0' }}>
            신청을 받았어요
          </h1>
          <p className="t-body" style={{ margin: '12px 0 0', color: 'var(--ink-2)', lineHeight: 1.75 }}>
            확인이 끝나면 <strong>{email}</strong> 으로 알려 드릴게요. 보통 하루 안에 끝납니다.
          </p>
          <p className="t-body-sm tone-muted" style={{ margin: '14px 0 0', lineHeight: 1.7 }}>
            교재가 그대로 전달되기 때문에 한 분씩 확인하고 있어요. 기다려 주셔서 고맙습니다.
          </p>
          <div style={{ marginTop: 22 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button>처음으로</Button>
            </Link>
          </div>
        </Panel>
      </Center>
    );
  }

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;

  return (
    <Center>
      <Panel>
        <Eyebrow>강사 신청</Eyebrow>
        <h1 className="t-h1" style={{ margin: '10px 0 0' }}>
          함께 가르칠 분을 찾습니다
        </h1>
        <p className="t-body-sm" style={{ margin: '10px 0 0', color: 'var(--ink-2)', lineHeight: 1.7 }}>
          신청 후 확인을 거쳐 승인해 드립니다. 승인 전에는 로그인이 되지 않습니다.
        </p>

        <form onSubmit={submit} style={{ marginTop: 22 }}>
          <Field label="이름" hint="학생에게 보일 이름입니다">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              style={inputStyle}
            />
          </Field>

          <Field label="이메일" hint="승인 결과를 이 주소로 보냅니다">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
            />
          </Field>

          <Field label="비밀번호" hint={`${MIN_PASSWORD}자 이상`}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_PASSWORD}
              autoComplete="new-password"
              aria-invalid={tooShort}
              style={{
                ...inputStyle,
                borderColor: tooShort ? 'var(--honghwa)' : 'var(--rule)',
              }}
            />
            {tooShort && (
              <p className="t-caption" style={{ margin: '6px 0 0', color: 'var(--honghwa)' }}>
                {MIN_PASSWORD - password.length}자 더 필요해요
              </p>
            )}
          </Field>

          <Field
            label="어디서 가르치고 계신가요"
            hint="italki · Preply 프로필 주소나 경력을 적어 주세요. 승인 판단의 근거가 됩니다"
          >
            <textarea
              value={applyNote}
              onChange={(e) => setApplyNote(e.target.value)}
              rows={4}
              maxLength={1000}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </Field>

          {error && (
            <p
              className="t-body-sm"
              role="alert"
              style={{
                margin: '0 0 14px',
                padding: '10px 12px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--honghwa-w)',
                color: 'var(--honghwa)',
              }}
            >
              {error}
            </p>
          )}

          <Button kind="jade" size="lg" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? '신청하는 중' : '신청하기'}
          </Button>
        </form>

        <p className="t-caption tone-muted" style={{ margin: '16px 0 0', textAlign: 'center' }}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" style={{ color: 'var(--indigo)' }}>
            로그인
          </Link>
        </p>
      </Panel>
    </Center>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  fontSize: 'var(--fs-body)',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  background: 'var(--surface)',
  border: '1px solid var(--rule)',
  borderRadius: 'var(--r-sm)',
  minHeight: 'var(--touch-min)',
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span className="t-body-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </span>
      {hint && (
        <span className="t-caption tone-muted" style={{ display: 'block', marginBottom: 6 }}>
          {hint}
        </span>
      )}
      {children}
    </label>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--canvas)',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
    </main>
  );
}
