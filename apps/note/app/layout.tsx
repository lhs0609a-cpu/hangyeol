import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from 'next/font/google';
import './globals.css';

/*
 * 화이트라벨 — 09번 문서 §2 릴리즈 게이트.
 *
 *   □ 렌더된 HTML 전문에 서비스명 문자열 없음
 *   □ <title> === "{강사명} 선생님의 학습 노트"
 *   □ favicon · og:image 에 우리 로고 없음
 *
 * title 은 강사 이름이 필요하므로 각 페이지에서 generateMetadata 로 채운다.
 * 여기에 기본 title 을 박아두면 그게 곧 브랜드 누출이 된다.
 */

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <main style={{ maxWidth: 460, margin: '0 auto', padding: '26px 18px 60px' }}>{children}</main>
      </body>
    </html>
  );
}
