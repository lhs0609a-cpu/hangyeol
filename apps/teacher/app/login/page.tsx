'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Eyebrow, Logo, Panel } from '@hangyeol/ui';
import { post } from '../api-client';

/*
 * 강사 로그인 — 02번 문서 A-01. 소셜 로그인은 P2 다.
 *
 * 가입은 여기서 하지 않는다. 승인제라 절차가 다르고, 같은 화면에서
 * 토글로 처리하면 "가입했는데 왜 로그인이 안 되지" 가 된다. /signup 으로 보낸다.
 */
/*
 * useSearchParams 는 Suspense 안에서만 쓸 수 있다.
 * 이 값(next=)은 클라이언트에서만 정해지므로 서버가 미리 렌더할 수 없다.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = form.email.trim() !== '' && form.password.length >= 10;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      // 세션은 서버가 HttpOnly 쿠키로 세운다. 여기서 토큰을 들고 있지 않는다.
      await post('/api/auth/login', { email: form.email, password: form.password });
      /*
       * 원래 가려던 곳으로 돌려보낸다. 외부 주소로 튕기지 않도록
       * 반드시 / 로 시작하는 내부 경로만 받는다.
       */
      const next = params.get('next');
      router.replace(next?.startsWith('/') && !next.startsWith('//') ? next : '/today');
      router.refresh();
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
        <span style={{ fontSize: 'var(--fs-h2)', fontWeight: 600 }}>사맛</span>
      </div>

      <Panel style={{ marginTop: 26 }}>
        <Eyebrow>로그인</Eyebrow>

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
            {busy ? '처리하는 중' : !ready ? '이메일과 10자 이상 비밀번호를 입력하세요' : '로그인'}
          </Button>
        </div>

        <p
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--ink-4)',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" style={{ color: 'var(--indigo)' }}>
            강사 신청하기
          </Link>
        </p>
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
