import Link from 'next/link';
import { Logo } from '@hangyeol/ui';
import { LEARNING_SCENES } from '@hangyeol/content';

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return <main className="learning-site auth-page"><div className="learn-container"><Link href="/" className="learn-brand auth-brand"><Logo size={30} /><span>samat.</span></Link><div className="auth-layout"><aside className="auth-intro"><p className="learn-eyebrow">FOR TEACHERS / 선생님을 위한 공간</p><h1>학생의 첫마디를,<br />함께 만들어 가요.</h1><p>준비된 교재와 지도안으로 시작하고,<br />학생이 직접 말하는 시간에 집중하세요.</p><img src={LEARNING_SCENES.friends.src} alt={LEARNING_SCENES.friends.alt.ko} width={1536} height={1024} /><div className="auth-learner-note" lang="en"><strong>Here to learn Korean?</strong><p>Start the free illustrated workbook. For private lesson notes, open the link your teacher sent you.</p><Link href="/learn" className="learn-text-link">Open the beginner workbook →</Link></div></aside><div className="auth-form-area">{children}<p className="auth-home-link"><Link href="/">← 홈페이지 / Back home</Link></p></div></div></div></main>;
}
