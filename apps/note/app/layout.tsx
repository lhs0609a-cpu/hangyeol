import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from 'next/font/google';
import { noteHome, verifyStudentToken } from '@hangyeol/core';
import './globals.css';

/*
 * 화이트라벨 — 09번 문서 §2 릴리즈 게이트.
 *
 *   □ 렌더된 HTML 전문에 서비스명 문자열 없음
 *   □ <title> === "{강사명} 선생님의 학습 노트"
 *   □ favicon · og:image 에 우리 로고 없음
 *
 * title 은 여기서 한 번만 만든다. 하위 화면(복습·소리구분·유창성·듣기)이
 * 각자 title 을 빠뜨리면 브라우저 탭이 URL 로 보이고, 그것도 게이트 위반이다.
 * 기본값은 강사 이름을 모를 때만 쓰는 중립 문자열이어야 한다 —
 * 여기에 서비스명을 박으면 그게 곧 브랜드 누출이 된다.
 */

export async function generateMetadata(): Promise<Metadata> {
  const token = cookies().get('hg_note')?.value;
  if (!token) return { title: '학습 노트' };
  try {
    const claims = await verifyStudentToken(token, 'session');
    const home = await noteHome(BigInt(claims.studentId));
    return { title: `${home.teacherDisplayName} 선생님의 학습 노트` };
  } catch {
    return { title: '학습 노트' };
  }
}

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
