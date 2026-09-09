'use client';

import Link from 'next/link';
import { Logo } from '@hangyeol/ui';

export type Language = 'en' | 'ko';
export function LearningNav({ language, onLanguage, workbook = false }: { language: Language; onLanguage: (language: Language) => void; workbook?: boolean }) {
  const ko = language === 'ko';
  function chooseLanguage(value: Language) {
    try { localStorage.setItem('samat-language', value); } catch { /* The page can still switch language without storage. */ }
    onLanguage(value);
  }
  return <header className="learn-nav"><div className="learn-container nav-inner">
    <Link href="/" className="learn-brand" aria-label="SAMAT home"><Logo size={30} /><span>samat<span className="brand-dot">.</span></span></Link>
    <nav className="learn-nav-links" aria-label={ko ? '주 메뉴' : 'Main navigation'}><Link href="/courses">{ko ? '수강 신청' : 'Find a course'}</Link><Link href="/learn">{ko ? '교재' : 'The workbook'}</Link><Link href="/#teachers">{ko ? '선생님을 위한 도구' : 'For teachers'}</Link></nav>
    <div className="learn-nav-actions"><div className="language-switch" aria-label="Language / 언어"><button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => chooseLanguage('en')}>EN</button><button type="button" lang="ko" aria-pressed={ko} onClick={() => chooseLanguage('ko')}>한국어</button></div><Link className="learn-button small nav-start" href={workbook ? '/login' : '/learn'}>{workbook ? (ko ? '강사 로그인' : 'Teacher login') : (ko ? '시작하기' : 'Start learning')} <span aria-hidden="true">↗</span></Link></div>
  </div></header>;
}
