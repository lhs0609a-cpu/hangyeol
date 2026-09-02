'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Eyebrow, Panel, Tag } from '@hangyeol/ui';
import { get, getToken } from '../../api-client';
import { Shell } from '../../Shell';

/*
 * 이미지 자산 관리 — 관리자 전용.
 *
 * 만들어야 할 이미지가 어디에 몇 장인지 보이고, 각각의 생성 프롬프트를
 * 복사할 수 있고, 만든 이미지를 그 자리에 바로 올릴 수 있다.
 * 올리면 코드를 고치지 않아도 슬라이드 뷰어가 찾아간다 —
 * 저장 키가 자산 id 에서 결정되기 때문이다.
 */

interface ImageItem {
  id: string;
  slot: string;
  usedAt: string;
  aspect: string;
  unitNo: number | null;
  storageKey: string;
  uploaded: boolean;
  prompt: string;
}

interface Payload {
  storageConfigured: boolean;
  total: number;
  uploadedCount: number;
  items: ImageItem[];
}

const SLOT_LABEL: Record<string, string> = {
  unit_cover: '표지',
  unit_goal: '목표',
  unit_vocab: '어휘',
  unit_dialogue: '대화',
  unit_roleplay: '롤플레이',
  pronunciation_diagram: '발음 단면도',
  trial_cover: '체험팩 표지',
};

export default function ImagesPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [unit, setUnit] = useState<string>('');

  async function load() {
    try {
      setData(await get<Payload>('/api/admin/images'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (error) {
    return (
      <Shell>
        <Panel>
          <p style={{ margin: 0, fontSize: 'var(--fs-body)' }}>{error}</p>
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

  const items = data.items
    .filter((i) => (filter === 'all' ? true : filter === 'done' ? i.uploaded : !i.uploaded))
    .filter((i) => (unit === '' ? true : String(i.unitNo) === unit));

  const units = [...new Set(data.items.map((i) => i.unitNo).filter((n): n is number => n !== null))].sort(
    (a, b) => a - b,
  );

  return (
    <Shell>
      <Eyebrow>관리자 · 이미지 자산</Eyebrow>
      <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 600, letterSpacing: '-0.02em', margin: '8px 0 6px' }}>
        만들어야 할 이미지 {data.total}장
      </h1>
      <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', margin: 0, lineHeight: 1.7 }}>
        프롬프트를 복사해 이미지를 만들고 여기에 올리면 그 자리에 자동으로 들어갑니다.
        코드를 고칠 필요가 없습니다.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <div className="mono" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)' }}>
          {data.uploadedCount} / {data.total} 업로드됨
        </div>
        <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'var(--rule)', minWidth: 120 }}>
          <div
            style={{
              width: `${(data.uploadedCount / data.total) * 100}%`,
              height: '100%',
              borderRadius: 99,
              background: 'var(--indigo)',
            }}
          />
        </div>
      </div>

      {!data.storageConfigured && (
        <Panel style={{ marginTop: 14, background: 'var(--chija-w)', border: '1px solid transparent' }}>
          <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)', color: 'var(--chija)', lineHeight: 1.7 }}>
            자산 스토리지(R2)가 연결되지 않아 업로드가 되지 않습니다.
            프롬프트 복사는 지금도 됩니다. <span className="mono">R2_*</span> 환경변수를 채우면 업로드가 열립니다.
          </p>
        </Panel>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
          options={[
            { value: 'pending', label: `남은 것 ${data.total - data.uploadedCount}` },
            { value: 'done', label: `완료 ${data.uploadedCount}` },
            { value: 'all', label: '전체' },
          ]}
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          style={{
            padding: '7px 10px',
            fontSize: 'var(--fs-body-sm)',
            fontFamily: 'inherit',
            border: '1px solid var(--rule)',
            borderRadius: 7,
            background: 'var(--surface)',
          }}
        >
          <option value="">전체 차시</option>
          {units.map((u) => (
            <option key={u} value={String(u)}>
              {u}차시
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 16 }}>
        {items.length === 0 ? (
          <Panel>
            <p style={{ margin: 0, fontSize: 'var(--fs-body)', color: 'var(--ink-3)' }}>해당하는 이미지가 없습니다</p>
          </Panel>
        ) : (
          items.map((item) => (
            <ImageRow
              key={item.id}
              item={item}
              storageConfigured={data.storageConfigured}
              onUploaded={load}
            />
          ))
        )}
      </div>
    </Shell>
  );
}

function ImageRow({
  item,
  storageConfigured,
  onUploaded,
}: {
  item: ImageItem;
  storageConfigured: boolean;
  onUploaded: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setFailure('클립보드에 접근하지 못했습니다. 프롬프트를 직접 선택해 복사하세요');
    }
  }

  async function upload(file: File) {
    setBusy(true);
    setFailure(null);
    try {
      const res = await fetch(`/api/admin/images/${item.id}`, {
        method: 'POST',
        headers: {
          'content-type': file.type,
          authorization: `Bearer ${getToken() ?? ''}`,
        },
        body: file,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? '업로드하지 못했습니다');
      onUploaded();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : '업로드하지 못했습니다');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel style={{ marginBottom: 10, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>{item.usedAt}</span>
        <Tag tone={item.uploaded ? 'j' : 'n'}>{item.uploaded ? '올라감' : '필요'}</Tag>
        <Tag tone="n">{SLOT_LABEL[item.slot] ?? item.slot}</Tag>
        <Tag tone="n">{item.aspect}</Tag>
      </div>

      <div className="mono" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--ink-4)', marginTop: 4 }}>
        {item.storageKey}
      </div>

      <pre
        style={{
          marginTop: 10,
          padding: 12,
          background: 'var(--rule-soft)',
          borderRadius: 7,
          fontSize: 'var(--fs-caption)',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'var(--font-mono), ui-monospace, monospace',
          maxHeight: 168,
          overflowY: 'auto',
        }}
      >
        {item.prompt}
      </pre>

      {failure && <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--honghwa)', marginTop: 8 }}>{failure}</p>}

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <Button size="sm" kind={copied ? 'jade' : 'ghost'} onClick={copy}>
          {copied ? '복사됨' : '프롬프트 복사'}
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="image/webp,image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
        <Button
          size="sm"
          kind="primary"
          disabled={busy || !storageConfigured}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? '올리는 중' : !storageConfigured ? '아직 올릴 수 없어요' : item.uploaded ? '다시 올리기' : '이미지 올리기'}
        </Button>
      </div>
    </Panel>
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
    <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 7, border: '1px solid var(--rule)' }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: '5px 11px',
              fontSize: 'var(--fs-body-sm)',
              fontFamily: 'inherit',
              fontWeight: active ? 600 : 400,
              borderRadius: 5,
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-3)',
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
