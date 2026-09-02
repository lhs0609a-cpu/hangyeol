'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Eyebrow, Panel } from '@hangyeol/ui';
import { post, ApiClientError } from '../../api-client';
import { Shell } from '../../Shell';

/*
 * T-06 · 새 학생 등록 — 07번 문서.
 *
 * 30초 안에 끝난다. 수업 직전이 아니라 예약 시점에 하도록 유도한다.
 * 등록과 1차시가 무료라는 사실을 화면에 적어 두는 것이 핵심이다 —
 * 그래야 강사가 등록을 미루지 않고, 학생이 첫 수업부터 우리 안으로 들어온다.
 */

const L1 = [
  { code: 'en', label: '영어' },
  { code: 'ja', label: '일본어' },
  { code: 'vi', label: '베트남어' },
  { code: 'id', label: '인도네시아어' },
  { code: 'es', label: '스페인어' },
  { code: 'zh', label: '중국어' },
  { code: 'de', label: '독일어' },
];

const TRACKS = [
  { code: 'kcontent', label: 'K-콘텐츠' },
  { code: 'travel', label: '여행' },
  { code: 'business', label: '비즈니스' },
  { code: 'topik', label: 'TOPIK' },
  { code: 'eps', label: '취업(EPS)' },
];

interface CreateResult {
  id: string;
  status: string;
  noteUrl: string;
  billing: { chargedNow: number; firstChargeAtLesson: number };
  note?: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    nameKo: '',
    email: '',
    l1Code: 'en',
    countryCode: '',
    platform: 'italki',
    platformUrl: '',
    goalTrack: 'kcontent',
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<CreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const ready = form.name.trim() !== '' && form.email.trim() !== '';

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const result = await post<CreateResult>('/api/students', form);
      setDone(result);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'DUPLICATE_STUDENT') {
        // 409 는 실패가 아니다. 기존 레코드로 이어가는 정상 경로다.
        setDuplicate(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : '등록하지 못했습니다. 잠시 후 다시 시도하세요');
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Shell wide={false}>
        <Panel>
          <Eyebrow>등록 완료</Eyebrow>
          <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 600, marginTop: 10 }}>
            학습 노트를 보냈습니다
          </h1>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-2)', lineHeight: 1.7 }}>
            {form.nameKo || form.name} 씨가 링크를 열면 레벨 테스트를 진행합니다.
            첫 수업 전에 끝나 있으면 50분을 온전히 수업에 쓸 수 있어요.
          </p>
          <div
            className="mono"
            style={{
              marginTop: 14,
              padding: 12,
              background: 'var(--rule-soft)',
              borderRadius: 7,
              fontSize: 'var(--fs-caption)',
              wordBreak: 'break-all',
            }}
          >
            {done.noteUrl}
          </div>
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 12 }}>
            지금 청구된 금액 {done.billing.chargedNow}원 · 첫 과금은 {done.billing.firstChargeAtLesson}차시부터입니다
          </p>
          <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
            <Button kind="primary" onClick={() => router.push('/')}>
              학생 목록으로
            </Button>
            <Button onClick={() => router.push(`/students/${done.id}`)}>학생 상세</Button>
          </div>
        </Panel>
      </Shell>
    );
  }

  return (
    <Shell wide={false}>
      <Eyebrow>새 학생</Eyebrow>
      <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 600, letterSpacing: '-0.02em', margin: '8px 0 20px' }}>
        학생 등록
      </h1>

      <Panel>
        <Field label="이름 (로마자)" required>
          <Input value={form.name} onChange={set('name')} placeholder="Maria Santos" />
        </Field>
        <Field label="한국어 이름">
          <Input value={form.nameKo} onChange={set('nameKo')} placeholder="마리아" />
        </Field>
        <Field label="이메일" required hint="학습 노트 링크가 이 주소로 갑니다">
          <Input value={form.email} onChange={set('email')} placeholder="maria@example.com" type="email" />
        </Field>
        <Field label="모국어">
          <Select value={form.l1Code} onChange={set('l1Code')} options={L1.map((l) => ({ value: l.code, label: l.label }))} />
        </Field>
        <Field label="국가 코드" hint="ES · JP · VN 같은 두 글자">
          <Input value={form.countryCode} onChange={set('countryCode')} placeholder="ES" />
        </Field>
        <Field label="플랫폼">
          <Segmented
            value={form.platform}
            onChange={(v) => setForm((f) => ({ ...f, platform: v }))}
            options={[
              { value: 'italki', label: 'italki' },
              { value: 'preply', label: 'Preply' },
              { value: 'direct', label: '직접' },
            ]}
          />
        </Field>
        <Field label="플랫폼 프로필 URL">
          <Input value={form.platformUrl} onChange={set('platformUrl')} placeholder="https://" />
        </Field>
        <Field label="목적 트랙">
          <Select
            value={form.goalTrack}
            onChange={set('goalTrack')}
            options={TRACKS.map((t) => ({ value: t.code, label: t.label }))}
          />
        </Field>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 7,
              background: duplicate ? 'var(--chija-w)' : 'var(--honghwa-w)',
              color: duplicate ? 'var(--chija)' : 'var(--honghwa)',
              fontSize: 'var(--fs-body-sm)',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <Button kind="primary" size="lg" full disabled={!ready || busy} onClick={submit}>
            {busy ? '등록하는 중' : ready ? '등록하고 학습 노트 보내기' : '이름과 이메일을 입력하세요'}
          </Button>
        </div>

        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 12, textAlign: 'center' }}>
          등록과 1차시는 무료입니다. 2차시부터 요금이 발생합니다
        </p>
      </Panel>
    </Shell>
  );
}

function Field({
  label,
  children,
  required = false,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontSize: 'var(--fs-body-sm)', fontWeight: 600, marginBottom: 5 }}>
        {label}
        {required && <span style={{ color: 'var(--honghwa)' }}> *</span>}
      </span>
      {children}
      {hint && <span style={{ display: 'block', fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 4 }}>{hint}</span>}
    </label>
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

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />;
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={onChange} style={inputStyle}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            className="hg-tap"
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: 'var(--fs-body-sm)',
              fontFamily: 'inherit',
              borderRadius: 7,
              cursor: 'pointer',
              border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
              background: active ? 'var(--ink)' : 'var(--surface)',
              color: active ? '#fff' : 'var(--ink-2)',
              boxShadow: active ? 'var(--shadow-toggle)' : undefined,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
