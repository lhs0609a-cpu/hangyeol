'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Logo } from '@hangyeol/ui';
import { AdminRail, ModeToggle } from './AdminRail';
import { useMode } from './mode';

/*
 * 강사 앱 공통 껍데기 — 06번 문서 §5.
 * sticky header 54px, main max-width 1100, 우측에 역할 토글.
 *
 * 관리자 모드에서는 왼쪽에 레일이 붙고 본문이 그만큼 밀린다.
 */

const NAV = [
  { href: '/', label: '오늘' },
  { href: '/billing', label: '청구' },
  { href: '/settings', label: '설정' },
  { href: '/licenses', label: '출처' },
];

const ADMIN_NAV = [{ href: '/admin', label: '관리자' }];

const RAIL_WIDTH = 208;

export function Shell({ children, wide = true }: { children: ReactNode; wide?: boolean }) {
  const pathname = usePathname();
  const { mode, ready } = useMode();
  const showRail = ready && mode === 'admin';
  const nav = showRail ? [...NAV, ...ADMIN_NAV] : NAV;

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          height: 54,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--rule)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            maxWidth: 1100,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}
          >
            <Logo />
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>한결</span>
          </Link>

          <nav style={{ display: 'flex', gap: 4, marginLeft: 14 }}>
            {nav.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: 13,
                    padding: '5px 10px',
                    borderRadius: 7,
                    textDecoration: 'none',
                    color: active ? 'var(--ink)' : 'var(--ink-3)',
                    background: active ? 'var(--rule-soft)' : 'transparent',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <ModeToggle />
        </div>
      </header>

      <AdminRail />

      <main
        style={{
          maxWidth: wide ? 1100 : 720,
          margin: '0 auto',
          padding: '26px 20px 70px',
          // 레일이 본문을 가리지 않게 민다.
          paddingLeft: showRail ? RAIL_WIDTH + 24 : undefined,
          transition: 'padding-left .18s',
        }}
      >
        {children}
      </main>
    </>
  );
}
