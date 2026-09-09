'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FIRST_STEPS, LEARNING_SCENES, firstStepById, type FirstStep, type KoreanPhrase } from '@hangyeol/content';
import { LearningNav } from '../LearningNav';
import { EMPTY_PROGRESS, PROGRESS_KEY, readProgress, type WorkbookProgress } from './progress';
import { HangeulBuilder } from './HangeulBuilder';

export function Workbook({ initialLesson }: { initialLesson?: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState<WorkbookProgress>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [active, setActive] = useState(initialLesson ?? FIRST_STEPS[0]!.id);
  const [settings, setSettings] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const language = progress.language;
  const t = (en: string, ko: string) => language === 'ko' ? ko : en;
  const lesson = firstStepById(active) ?? FIRST_STEPS[0]!;
  const index = FIRST_STEPS.findIndex((entry) => entry.id === lesson.id);
  const total = FIRST_STEPS.length;

  useEffect(() => {
    try {
      const saved = readProgress(localStorage.getItem(PROGRESS_KEY));
      const preferredLanguage = localStorage.getItem('samat-language');
      if (preferredLanguage === 'en' || preferredLanguage === 'ko') saved.language = preferredLanguage;
      setProgress(saved);
      setActive(initialLesson ?? saved.lastLesson);
    } catch { setStorageError(true); }
    setReady(true);
    // Only load browser preferences once; URL navigation is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (initialLesson) setActive(initialLesson); }, [initialLesson]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...progress, lastLesson: active })); setStorageError(false); }
    catch { setStorageError(true); }
  }, [progress, active, ready]);

  function open(id: string) {
    setActive(id);
    router.push(`/learn?lesson=${id}`, { scroll: false });
    requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start' }); });
  }
  function start() {
    setProgress((p) => ({ ...p, started: true }));
    setSettings(false);
    const recommended = progress.goal === 'travel' ? 'cafe-order' : progress.goal === 'connection' ? 'say-hello' : 'first-hangeul';
    open(initialLesson ?? (progress.started ? active : recommended));
  }
  function complete() {
    setProgress((p) => ({ ...p, started: true, completed: [...new Set([...p.completed, lesson.id])] }));
  }
  const onboarding = (ready && !progress.started && !initialLesson) || settings;
  return <div className="learning-site workbook-site" lang={language}>
    <a className="learn-skip" href="#lesson-heading">{t('Skip to lesson', '교재 본문으로')}</a>
    <LearningNav language={language} onLanguage={(value) => setProgress((p) => ({ ...p, language: value }))} workbook />
    <main className="learn-container workbook-main">
      <div className="workbook-page-heading"><div><p className="learn-eyebrow">SAMAT / FIRST STEPS</p><h1>{t('A little Korean, every day.', '매일, 한국어 한 걸음.')}</h1><p>{t('Your illustrated guide to first conversations.', '그림과 함께 시작하는 나의 첫 한국어 대화')}</p></div><div className="workbook-utilities"><button className="learn-button secondary small" onClick={() => setSettings(!settings)} aria-expanded={onboarding}>{t('My learning plan', '나의 학습 계획')}</button><Link className="learn-button secondary small" href="/learn/print">{t('Print workbook', '교재 인쇄')} ↗</Link></div></div>
      {!ready && <p role="status">{t('Opening your workbook…', '교재를 여는 중이에요…')}</p>}
      {onboarding && <section className="learning-onboarding" aria-labelledby="plan-title"><div><p className="learn-eyebrow">{t('MAKE YOURSELF AT HOME', '나에게 맞게 시작하기')}</p><h2 id="plan-title">{t('What brings you to Korean?', '어떤 한국어를 배우고 싶나요?')}</h2><p>{t('Choose a starting point. Every mission stays open, so you can change direction anytime.', '시작점을 골라 주세요. 모든 미션이 열려 있어 언제든 바꿀 수 있어요.')}</p></div><fieldset><legend>{t('My starting point', '나의 시작점')}</legend><div className="goal-options">{([
        ['foundation', 'Start with the letters', '한글부터 차근차근'], ['travel', 'Get ready for Korea', '여행에서 바로 쓰기'], ['connection', 'Connect with people', '사람들과 대화하기'],
      ] as const).map(([value, en, ko]) => <label key={value} className={progress.goal === value ? 'selected' : ''}><input type="radio" name="goal" value={value} checked={progress.goal === value} onChange={() => setProgress((p) => ({ ...p, goal: value }))} />{t(en, ko)}</label>)}</div></fieldset><fieldset><legend>{t('My daily practice target', '하루 연습 목표')}</legend><div className="goal-options">{([10, 15] as const).map((value) => <label key={value} className={progress.dailyMinutes === value ? 'selected' : ''}><input type="radio" name="minutes" checked={progress.dailyMinutes === value} onChange={() => setProgress((p) => ({ ...p, dailyMinutes: value }))} />{value}{t(' minutes', '분')}</label>)}</div></fieldset><button className="learn-button" onClick={start}>{t('Let’s begin', '시작할게요')} →</button><p className="learn-small">{t('No sign-up. Your choices and progress stay on this browser.', '가입 없이 이용해요. 선택과 진도는 이 브라우저에만 저장돼요.')}</p></section>}
      <div className="workbook-layout">
        <aside className="workbook-sidebar" aria-label={t('Your missions', '미션 목록')}><div className="progress-summary"><span className="learn-eyebrow">{t('YOUR LEARNING JOURNEY', '나의 학습 여정')}</span><p><strong>{progress.completed.length}<span> / {total}</span></strong><span>{t('completed', '완료')}</span></p><progress value={progress.completed.length} max={total} aria-label={t('Completed missions', '완료한 미션')} /><small>{t(`Your daily target: ${progress.dailyMinutes} minutes`, `하루 목표: ${progress.dailyMinutes}분`)}</small></div><nav className="mission-list">{FIRST_STEPS.map((entry, i) => <button type="button" key={entry.id} onClick={() => open(entry.id)} aria-current={entry.id === active ? 'step' : undefined}><span className={progress.completed.includes(entry.id) ? 'mission-index is-complete' : 'mission-index'}>{progress.completed.includes(entry.id) ? '✓' : String(i + 1).padStart(2, '0')}</span><span>{entry.title[language]}<small>{entry.minutes}{t(' min', '분')} {progress.completed.includes(entry.id) ? t('· Completed', '· 완료') : ''}</small></span></button>)}</nav><p className="sidebar-note">{t('A little review goes a long way. Revisit a previous mission before starting a new one.', '새 미션 전에 지난 표현을 보지 않고 말해 보세요. 짧은 복습도 도움이 돼요.')}</p></aside>
        <div className="workbook-content"><div className="mobile-mission-select"><label htmlFor="mission-select">{t('Choose a mission', '미션 선택')}</label><select id="mission-select" value={active} onChange={(event) => open(event.target.value)}>{FIRST_STEPS.map((entry, i) => <option value={entry.id} key={entry.id}>{i + 1}. {entry.title[language]}{progress.completed.includes(entry.id) ? ' ✓' : ''}</option>)}</select><p>{progress.completed.length} / {total} {t('missions completed', '미션 완료')}</p></div>
          <div className="lesson-heading"><p className="learn-eyebrow">{t('MISSION', '미션')} {String(index + 1).padStart(2, '0')} / {total} <span>· {lesson.minutes}{t(' min suggested practice', '분 권장 연습')}</span></p><h2 id="lesson-heading" ref={heading} tabIndex={-1}>{lesson.title[language]}</h2><p>{lesson.goal[language]}</p></div>
          <Lesson key={lesson.id} lesson={lesson} language={language} completed={progress.completed.includes(lesson.id)} onComplete={complete} note={progress.notes[lesson.id] ?? ''} onNote={(value) => setProgress((p) => ({ ...p, notes: { ...p.notes, [lesson.id]: value } }))} />
          {lesson.review.length > 0 && <section className="lesson-review"><h3>{t('Bring a little back', '이 표현도 기억나요?')}</h3><p>{t('Before moving on, try a phrase from one of these earlier scenes without looking.', '다음으로 가기 전, 지난 장면의 표현을 보지 않고 말해 보세요.')}</p><div>{lesson.review.map((id) => <button className="learn-button secondary small" key={id} onClick={() => open(id)}>{firstStepById(id)!.title[language]} ↗</button>)}</div></section>}
          <div className="lesson-navigation">{index > 0 ? <button className="learn-button secondary" onClick={() => open(FIRST_STEPS[index - 1]!.id)}>← {t('Previous', '이전 미션')}</button> : <Link className="learn-text-link" href="/">← {t('Home', '홈으로')}</Link>}{index < total - 1 ? <button className="learn-button" onClick={() => open(FIRST_STEPS[index + 1]!.id)}>{t('Next mission', '다음 미션')} →</button> : <button className="learn-button" onClick={() => open(FIRST_STEPS.find((entry) => !progress.completed.includes(entry.id))?.id ?? FIRST_STEPS[0]!.id)}>{t('Keep practicing', '계속 연습하기')} ↗</button>}</div>
          {progress.completed.length === total && <section className="workbook-celebration" role="status"><span aria-hidden="true">✳</span><h3>{t('Fourteen first steps. Your story is just beginning.', '열네 번의 첫걸음, 이제 내 이야기를 시작해요.')}</h3><p>{t('You completed the practice checks and speaking self-checks. Take your notes to your tutor and choose what to work on next.', '연습 문제와 말하기 자기 점검을 마쳤어요. 작성한 메모를 선생님과 함께 보고 다음 목표를 골라요.')}</p></section>}
        </div>
      </div>
      <p className={`workbook-storage ${storageError ? 'storage-error' : ''}`} role="status">{storageError ? t('This browser cannot save your progress right now. You can keep learning, but progress may be lost when you leave.', '이 브라우저에서 현재 진도를 저장할 수 없어요. 학습은 가능하지만 나가면 진도가 사라질 수 있어요.') : t('Progress and notes are saved on this browser only. Clearing browser data removes them. Private notes: use the link your teacher sent you.', '진도와 메모는 이 브라우저에만 저장되며 브라우저 데이터를 지우면 사라져요. 개인 학습 노트는 선생님이 보낸 링크로 열어 주세요.')}</p>
    </main>
  </div>;
}

function Lesson({ lesson, language, completed, onComplete, note, onNote }: { lesson: FirstStep; language: 'en' | 'ko'; completed: boolean; onComplete: () => void; note: string; onNote: (value: string) => void }) {
  const [meaning, setMeaning] = useState(true);
  const [roman, setRoman] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const [hidePartner, setHidePartner] = useState(false);
  const t = (en: string, ko: string) => language === 'ko' ? ko : en;
  const allAnswered = lesson.questions.every((_, i) => answers[i] !== undefined);
  const allCorrect = lesson.questions.every((question, i) => answers[i] === question.answer);
  const canComplete = checked && allCorrect && spoken;
  const scene = LEARNING_SCENES[lesson.scene];
  const phrase = (entry: KoreanPhrase) => <><strong lang="ko">{entry.ko}</strong>{roman && <span className="reading-hint" lang="en">{entry.roman}</span>}{meaning && <span className="phrase-meaning" lang="en">{entry.en}</span>}</>;
  return <article className="lesson-body">
    <figure className="lesson-scene"><img src={scene.src} alt={scene.alt[language]} width={1536} height={1024} /><figcaption>{t('Look at the scene. What could you say here?', '장면을 보세요. 여기서 어떤 말을 할 수 있을까요?')}</figcaption></figure>
    <div className="lesson-controls"><label><input type="checkbox" checked={meaning} onChange={(e) => setMeaning(e.target.checked)} />{t('English meanings', '영어 뜻풀이')}</label><label><input type="checkbox" checked={roman} onChange={(e) => setRoman(e.target.checked)} />{t('Reading hints', '로마자 도움말')}</label><span>{t('Try reading Korean first.', '한글부터 읽어 보세요.')}</span></div>
    {roman && <p className="lesson-callout">{t('Reading hints are approximate, not audio. Ask a Korean speaker or tutor to model the sounds.', '로마자는 대략적인 읽기 도움말이에요. 선생님이나 한국어 화자의 소리를 듣고 연습해요.')}</p>}
    {['first-hangeul', 'read-a-menu'].includes(lesson.id) && <HangeulBuilder language={language} batchim={lesson.id === 'read-a-menu'} />}
    <section className="lesson-section"><p className="learn-eyebrow">01 / {t('NOTICE THE WORDS', '핵심 단어')}</p><h3>{t('A few words to get you there.', '이 단어부터 시작해요.')}</h3><div className="vocabulary-grid">{lesson.words.map((entry) => <div className="vocabulary-card" key={entry.ko}>{phrase(entry)}</div>)}</div></section>
    <section className="lesson-section"><p className="learn-eyebrow">02 / {t('SAY SOMETHING USEFUL', '오늘의 표현')}</p><h3>{t('Your words for this moment.', '이 장면에서 쓰는 한마디.')}</h3><div className="phrase-list">{lesson.phrases.map((entry, i) => <div className="phrase-row" key={entry.ko}><span className="phrase-number">0{i + 1}</span><div>{phrase(entry)}</div></div>)}</div><div className="pattern-note"><span className="learn-eyebrow">{t('HOW IT FITS TOGETHER', '문장을 만드는 방법')}</span><h4 lang="ko">{lesson.pattern.form}</h4><p>{lesson.pattern.explanation[language]}</p><p lang="ko" className="pattern-example">{lesson.pattern.example}</p></div></section>
    <section className="lesson-section"><div className="dialogue-heading"><div><p className="learn-eyebrow">03 / {t('HAVE A CONVERSATION', '대화해요')}</p><h3>{t('One line each. Then switch.', '한 줄씩, 역할을 바꿔서.')}</h3></div><button className="learn-button secondary small" aria-pressed={hidePartner} onClick={() => setHidePartner(!hidePartner)}>{hidePartner ? t('Show all lines', '전체 대사 보기') : t('Hide alternate lines', '한 사람 대사 가리기')}</button></div><p className="learn-small">{t('Read with a partner or tutor. When you are ready, hide alternate lines and answer aloud.', '친구나 선생님과 읽어요. 익숙해지면 한 사람의 대사를 가리고 소리 내어 답해요.')}</p><div className="dialogue-lines">{lesson.dialogue.map((entry, i) => <div className={`dialogue-line ${i % 2 ? 'dialogue-right' : ''}`} key={i}><span className="dialogue-avatar" aria-hidden="true">{i % 2 ? 'B' : 'A'}</span><div><span className="dialogue-speaker" lang="en">{entry.speaker}</span>{hidePartner && i % 2 ? <p className="hidden-dialogue">{t('Your turn. Say the line from memory.', '내 차례예요. 기억해서 말해 보세요.')}</p> : phrase(entry)}</div></div>)}</div></section>
    <aside className="culture-note"><span aria-hidden="true">✳</span><div><h4>{t('A little real-life context', '알아 두면 좋은 한 가지')}</h4><p>{lesson.culture[language]}</p></div></aside>
    <section className="lesson-section"><p className="learn-eyebrow">04 / {t('TRY IT YOURSELF', '직접 풀어 보기')}</p><h3>{t('Let’s see what stayed.', '기억에 남은 것을 확인해요.')}</h3>{lesson.questions.map((question, i) => <fieldset className="practice-question" key={i}><legend>{i + 1}. {question.prompt[language]}</legend><div>{question.options.map((option, optionIndex) => <label key={option} className={`answer-option ${answers[i] === optionIndex ? 'selected' : ''} ${checked && optionIndex === question.answer ? 'correct' : ''}`}><input type="radio" name={`question-${lesson.id}-${i}`} checked={answers[i] === optionIndex} onChange={() => { setAnswers((prev) => ({ ...prev, [i]: optionIndex })); setChecked(false); }} /><span lang={/[가-힣]/.test(option) ? 'ko' : 'en'}>{option}</span>{checked && optionIndex === question.answer && <span className="answer-result">✓ {t('Correct answer', '정답')}</span>}</label>)}</div>{checked && <p className={`answer-feedback ${answers[i] === question.answer ? 'is-correct' : ''}`}>{answers[i] === question.answer ? t('Yes! ', '맞아요! ') : t('Try this: ', '이렇게 생각해 보세요: ')}{question.explanation[language]}</p>}</fieldset>)}<button className="learn-button secondary" onClick={() => setChecked(true)} disabled={!allAnswered}>{allAnswered ? t('Check my answers', '정답 확인') : t('Choose an answer for each question', '각 문제의 답을 골라 주세요')}</button>{checked && <p role="status" className="quiz-status">{allCorrect ? t('All correct. Now put it into your own words below.', '모두 맞았어요. 아래에서 내 말로 연습해 보세요.') : t('Read the explanations, change your answers, then check again.', '설명을 읽고 답을 바꾼 뒤 다시 확인해 보세요.')}</p>}</section>
    <section className="speaking-mission"><p className="learn-eyebrow">05 / {t('MAKE IT YOURS', '내 말로 완성하기')}</p><h3>{t('Your real-life mini mission.', '오늘의 작은 말하기 미션.')}</h3><p>{lesson.mission[language]}</p><details className="sample-details"><summary>{t('Need a starting point? See an example.', '시작이 어렵다면 예시를 보세요.')}</summary><p lang="ko">{lesson.sample}</p></details><label className="note-label" htmlFor={`note-${lesson.id}`}>{t('My version / a question for my tutor', '나의 문장 / 선생님에게 물어볼 것')}</label><textarea id={`note-${lesson.id}`} rows={3} maxLength={2000} value={note} onChange={(e) => onNote(e.target.value)} placeholder={t('Write your own sentence here…', '나만의 문장을 적어 보세요…')} /><label className="speaking-check"><input type="checkbox" checked={spoken} onChange={(e) => setSpoken(e.target.checked)} />{t('I tried the speaking mission aloud. (Self-check)', '소리 내어 말하기 미션을 해 봤어요. (자기 점검)')}</label><button className="learn-button" disabled={!canComplete || completed} onClick={onComplete}>{completed ? t('Mission completed ✓', '미션 완료 ✓') : canComplete ? t('Complete this mission', '이번 미션 완료하기') : t('Check answers and try speaking to finish', '정답 확인과 말하기 후 완료할 수 있어요')}</button><p className="learn-small">{t('Speaking is self-assessed. No microphone, recording, or automatic scoring is used.', '말하기는 스스로 점검해요. 마이크·녹음·자동 채점은 사용하지 않아요.')}</p>{completed && <p role="status">{t('Well done. Revisit these words tomorrow, then a few days later.', '잘했어요. 내일 한 번, 며칠 뒤 한 번 더 표현을 떠올려 보세요.')}</p>}</section>
  </article>;
}
