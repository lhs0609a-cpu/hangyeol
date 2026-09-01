'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Logo } from '@hangyeol/ui';

/*
 * 강사 앱 공통 껍데기 — 06번 문서 §5.
 * sticky header 54px, main max-width 1100.
 */

const NAV = [
  { href: '/', label: '오늘' },
  { href: '/billing', label: '청구' },
  { href: '/settings', label: '설정' },
];

export function Shell({ children, wide = true }: { children: ReactNode; wide?: boolean }) {
  const pathname = usePathname();

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
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
            <Logo />
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>한결</span>
          </Link>

          <nav style={{ display: 'flex', gap: 4, marginLeft: 14 }}>
            {NAV.map((item) => {
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
        </div>
      </header>

      <main style={{ maxWidth: wide ? 1100 : 720, margin: '0 auto', padding: '26px 20px 70px' }}>
        {children}
      </main>
    </>
  );
}
