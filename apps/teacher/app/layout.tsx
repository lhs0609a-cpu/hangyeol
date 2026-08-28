import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from 'next/font/google';
import './globals.css';

// 06번 문서: Noto Sans KR 을 쓰지 않는다. 모두가 쓰는 기본값이라 제품에 성격이 생기지 않는다.
// IBM Plex Sans KR 은 각진 종단부 때문에 "도구"처럼 읽힌다.
const sans = IBM_Plex_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '한결 — 오늘',
  description: '한국어 강사를 위한 수업 운영 도구',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
