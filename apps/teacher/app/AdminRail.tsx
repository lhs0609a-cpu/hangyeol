'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMode } from './mode';

/*
 * 관리자 레일 — 모든 화면을 한 줄로 세워 앞뒤로 오갈 수 있게 한다.
 *
 * 화면이 20개를 넘으면 "그 화면이 어디 있더라" 가 개발 속도를 잡아먹는다.
 * 레일은 그 문제만 푼다. 유저 모드에서는 보이지 않는다.
 *
 * 키보드: Alt+← / Alt+→ 로 앞뒤 이동. 마우스를 안 쓰고 훑을 수 있어야 쓸모가 있다.
 */

export interface RailEntry {
  href: string;
  label: string;
  group: string;
  /** 명세 어디에 해당하는가. 화면과 문서를 잇는다. */
  spec?: string;
  /** 동적 경로는 예시 id 로 연다. */
  sample?: boolean;
}

export const RAIL: RailEntry[] = [
  { href: '/', label: '랜딩', group: '진입', spec: '02번 A-01' },
  { href: '/signup', label: '강사 신청', group: '진입', spec: '02번 A-01' },
  { href: '/login', label: '로그인', group: '진입', spec: '02번 A-01' },

  { href: '/today', label: 'T-01 오늘', group: '강사', spec: '07번 T-01' },
  { href: '/students/new', label: 'T-06 새 학생 등록', group: '강사', spec: '07번 T-06' },
  { href: '/students/1', label: 'T-04 학생 상세', group: '강사', spec: '07번 T-04', sample: true },
  { href: '/plan/1', label: '교수 플랜', group: '강사', spec: '결정기록 D-002', sample: true },
  { href: '/lesson/1', label: 'T-02·T-03 수업 4단계', group: '강사', spec: '07번 T-02·T-03', sample: true },
  { href: '/billing', label: 'T-05 청구', group: '강사', spec: '07번 T-05' },
  { href: '/settings', label: '설정 · 시급', group: '강사', spec: '02번 A-02·A-03' },
  { href: '/licenses', label: '출처 표시', group: '강사', spec: '08번 §6' },

  { href: '/admin', label: 'A-01 지표', group: '관리자', spec: '05번 §10 · 11번 핵심지표' },
  { href: '/admin/teachers', label: '강사 승인', group: '관리자', spec: '02번 A-01' },
  { href: '/admin/images', label: '이미지 자산', group: '관리자', spec: '08번 §2' },
  { href: '/admin/content', label: '콘텐츠 현황', group: '관리자', spec: '08번 §9' },
];

function indexOf(pathname: string): number {
  // 동적 경로는 앞부분만 맞춘다.
  return RAIL.findIndex((e) => {
    if (e.sample) return pathname.startsWith(e.href.replace(/\/\d+$/, '/'));
    return e.href === '/' ? pathname === '/' : pathname.startsWith(e.href);
  });
}

export function AdminRail() {
  const { mode, ready } = useMode();
  const pathname = usePathname();
  const router = useRouter();
  const current = indexOf(pathname);

  useEffect(() => {
    if (mode !== 'admin') return;

    function onKey(e: KeyboardEvent) {
      if (!e.altKey) return;
      if (e.key === 'ArrowLeft' && current > 0) {
        e.preventDefault();
        router.push(RAIL[current - 1]!.href);
      }
      if (e.key === 'ArrowRight' && current >= 0 && current < RAIL.length - 1) {
        e.preventDefault();
        router.push(RAIL[current + 1]!.href);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, current, router]);

  if (!ready || mode !== 'admin') return null;

  const groups = [...new Set(RAIL.map((e) => e.group))];
  const prev = current > 0 ? RAIL[current - 1] : null;
  const next = current >= 0 && current < RAIL.length - 1 ? RAIL[current + 1] : null;

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 54,
        bottom: 0,
        width: 208,
        overflowY: 'auto',
        borderRight: '1px solid var(--rule)',
        background: 'var(--surface)',
        padding: '16px 12px 24px',
        zIndex: 9,
      }}
      aria-label="관리자 화면 레일"
    >
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        화면 {RAIL.length}개
      </div>

      {groups.map((group) => (
        <div key={group} style={{ marginBottom: 14 }}>
          <div className="t-eyebrow" style={{ marginBottom: 5 }}>
            {group}
          </div>

          {RAIL.filter((e) => e.group === group).map((entry) => {
            const active = RAIL.indexOf(entry) === current;
            return (
              <Link
                key={entry.href}
                href={entry.href}
                style={{
                  display: 'block',
                  padding: '6px 8px',
                  marginBottom: 1,
                  borderRadius: 6,
                  fontSize: 'var(--fs-body-sm)',
                  textDecoration: 'none',
                  lineHeight: 1.4,
                  background: active ? 'var(--indigo-w)' : 'transparent',
                  color: active ? 'var(--indigo)' : 'var(--ink-2)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {entry.label}
                {entry.spec && (
                  <span
                    className="mono"
                    style={{ display: 'block', fontSize: 'var(--fs-eyebrow)', color: 'var(--ink-4)', marginTop: 1 }}
                  >
                    {entry.spec}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}

      <div style={{ borderTop: '1px solid var(--rule-soft)', paddingTop: 12, marginTop: 4 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <RailStep entry={prev} dir="prev" />
          <RailStep entry={next} dir="next" />
        </div>
        <div className="mono" style={{ fontSize: 'var(--fs-eyebrow)', color: 'var(--ink-4)', marginTop: 8, lineHeight: 1.6 }}>
          Alt + ← → 로 이동
        </div>
      </div>
    </aside>
  );
}

function RailStep({ entry, dir }: { entry: RailEntry | null | undefined; dir: 'prev' | 'next' }) {
  const label = dir === 'prev' ? '←' : '→';

  if (!entry) {
    return (
      <span
        style={{
          flex: 1,
          padding: '7px 0',
          textAlign: 'center',
          fontSize: 'var(--fs-body-sm)',
          color: 'var(--ink-4)',
          border: '1px solid var(--rule-soft)',
          borderRadius: 6,
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={entry.href}
      title={entry.label}
      style={{
        flex: 1,
        padding: '7px 0',
        textAlign: 'center',
        fontSize: 'var(--fs-body-sm)',
        color: 'var(--ink-2)',
        border: '1px solid var(--rule)',
        borderRadius: 6,
        textDecoration: 'none',
      }}
    >
      {label}
    </Link>
  );
}

/** 헤더에 붙는 모드 토글. 06번 문서 §5 "우: 역할 토글". */
export function ModeToggle() {
  const { mode, setMode, ready } = useMode();
  if (!ready) return null;

  return (
    <div
      style={{
        marginLeft: 'auto',
        display: 'flex',
        gap: 2,
        padding: 2,
        borderRadius: 7,
        border: '1px solid var(--rule)',
        background: 'var(--canvas)',
      }}
      role="group"
      aria-label="화면 모드"
    >
      {(['user', 'admin'] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={active}
            style={{
              padding: '4px 10px',
              fontSize: 'var(--fs-caption)',
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
            {m === 'user' ? '강사 화면' : '관리자'}
          </button>
        );
      })}
    </div>
  );
}
