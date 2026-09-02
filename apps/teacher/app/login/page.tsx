'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Eyebrow, Logo, Panel } from '@hangyeol/ui';
import { post, setToken } from '../api-client';

/** 강사 로그인·가입 — 02번 문서 A-01. 소셜 로그인은 P2 다. */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    form.email.trim() !== '' &&
    form.password.length >= 10 &&
    (mode === 'login' || form.name.trim() !== '');

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : { email: form.email, password: form.password, name: form.name };

      const result = await post<{ access: string }>(path, body);
      setToken(result.access);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리하지 못했습니다');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 380, margin: '0 auto', padding: '80px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'center' }}>
        <Logo size={20} />
        <span style={{ fontSize: 'var(--fs-h2)', fontWeight: 600 }}>한결</span>
      </div>

      <Panel style={{ marginTop: 26 }}>
        <Eyebrow>{mode === 'login' ? '로그인' : '강사 가입'}</Eyebrow>

        {mode === 'signup' && (
          <LabeledInput
            label="이름"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="이지은"
          />
        )}

        <LabeledInput
          label="이메일"
          type="email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          placeholder="teacher@example.com"
        />

        <LabeledInput
          label="비밀번호"
          type="password"
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          hint="10자 이상"
        />

        {error && (
          <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--honghwa)', marginTop: 12 }}>{error}</p>
        )}

        <div style={{ marginTop: 18 }}>
          <Button kind="primary" size="lg" full disabled={!ready || busy} onClick={submit}>
            {busy
              ? '처리하는 중'
              : !ready
                ? '이메일과 10자 이상 비밀번호를 입력하세요'
                : mode === 'login'
                  ? '로그인'
                  : '가입하고 시작하기'}
          </Button>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <Button
            kind="quiet"
            size="sm"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
            }}
          >
            {mode === 'login' ? '아직 계정이 없어요' : '이미 계정이 있어요'}
          </Button>
        </div>
      </Panel>

      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 18, textAlign: 'center', lineHeight: 1.7 }}>
        온보딩 · 트레이닝 · 교재 · 도구는 전부 무료입니다.
        활성 학생이 생긴 뒤에만 요금이 발생합니다.
      </p>
    </main>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label style={{ display: 'block', marginTop: 14 }}>
      <span style={{ display: 'block', fontSize: 'var(--fs-body-sm)', fontWeight: 600, marginBottom: 5 }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '9px 11px',
          fontSize: 'var(--fs-body)',
          fontFamily: 'inherit',
          border: '1px solid var(--rule)',
          borderRadius: 7,
          background: 'var(--surface)',
          color: 'var(--ink)',
        }}
      />
      {hint && <span style={{ display: 'block', fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 4 }}>{hint}</span>}
    </label>
  );
}
