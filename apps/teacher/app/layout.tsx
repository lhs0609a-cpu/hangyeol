import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ModeProvider } from './mode';

// 15번 재설계: 영문 안내와 한글 학습 문장을 구분하되 두 앱에서 동일하게 제공한다.
const sans = localFont({
  src: '../../../packages/ui/fonts/noto-sans-kr.woff2',
  weight: '400 600',
  variable: '--font-sans',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

const latin = localFont({
  src: '../../../packages/ui/fonts/dm-sans.woff2',
  weight: '400 600',
  variable: '--font-latin',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '사맛 — 오늘',
  description: '한국어 강사를 위한 수업 운영 도구',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${latin.variable}`}>
      <body>
        <ModeProvider>{children}</ModeProvider>
      </body>
    </html>
  );
}
