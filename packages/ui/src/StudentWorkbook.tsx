'use client';
import { useState } from 'react';

// Deliberately structural: this renderer accepts only the student projection.
export interface WorkbookView {
  unitNo: number; title: string; goal: string; level: number; levelLabel: string; load: string;
  words: string[]; forms: string[]; model: string[]; tasks: string[]; example: string;
  images: { artwork: { src: string; alt: string }; title: string; prompt: string }[];
  practice: { title: string; prompt: string; hint: string }[];
  extension: string; canDo: string; review: { unitNo: number; title: string }[];
}
export const WORKBOOK_STAGES = ['그림으로 시작', '대화와 표현', '함께 연습', '혼자 해 보기'];
export function StudentWorkbook({ book, stage, onStage, hideModel = false }: {
  book: WorkbookView; stage: number; onStage: (stage: number) => void; hideModel?: boolean;
}) {
  const [showHints, setShowHints] = useState(false);
  const picture = book.images[stage === 0 ? 0 : stage === 3 ? 2 : 1]!;
  return <article className="workbook" aria-label="학생용 교재">
    <header className="workbook-header"><span className="workbook-kicker">{book.unitNo}차시 · {book.level}급 · {book.levelLabel}</span><h2>{book.title}</h2><p>{book.goal}</p><small>{book.load}</small></header>
    <nav className="workbook-tabs" aria-label="교재 활동">{WORKBOOK_STAGES.map((label, i) => <button type="button" key={label} aria-current={stage === i ? 'step' : undefined} onClick={() => { setShowHints(false); onStage(i); }}><span>{i + 1}</span>{label}</button>)}</nav>
    <section className="workbook-page" aria-label={WORKBOOK_STAGES[stage]}>
      <figure className="workbook-picture"><img src={picture.artwork.src} alt={picture.artwork.alt} loading="eager"/><figcaption><strong>{picture.title}</strong><span>{picture.prompt}</span></figcaption></figure>
      {stage === 0 && <><h3>아는 말을 찾아요 <small>Notice & name</small></h3><div className="workbook-words">{book.words.map(word => <span key={word}>{word}</span>)}</div><p>그림을 보며 아는 말을 말해요. 그림에 없는 말은 다른 예를 들어요.</p><div className="workbook-callout">모르면 말해도 괜찮아요. “이게 뭐예요?” · “다시 말해 주세요.”</div></>}
      {stage === 1 && <><h3>듣고, 읽고, 뜻을 확인해요 <small>Listen & understand</small></h3>{hideModel ? <div className="workbook-callout" role="status">먼저 선생님의 말을 들어 보세요. / Listen to your teacher.</div> : <><div className="workbook-dialogue">{book.model.length ? book.model.map((line, i) => <p key={i}><span>{i % 2 ? 'B' : 'A'}</span>{line}</p>) : <p>선생님과 낱말을 읽고 오늘의 표현을 만들어 봐요.</p>}</div><div className="workbook-words">{book.forms.map(form => <span key={form}>{form}</span>)}</div><p>어떤 뜻이에요? 내 말이나 동작으로 나타내요.</p></>}</>}
      {stage === 2 && <><h3>하나씩 바꿔 봐요 <small>Try with support</small></h3><div className="workbook-activities">{book.practice.map((item, i) => <section key={item.title}><span className="workbook-kicker">연습 {i + 1}</span><h4>{item.title}</h4><p>{item.prompt}</p><details><summary>도움말 / Hint</summary><p>{item.hint}</p></details></section>)}</div></>}
      {stage === 3 && <><h3>이제 내 말로 <small>Your own words</small></h3><ol className="workbook-tasks">{book.tasks.map((task, i) => <li key={i}>{task}</li>)}</ol><div className="workbook-callout"><strong>한 걸음 더</strong><p>{book.extension}</p></div><button type="button" className="workbook-hint" aria-expanded={showHints} onClick={() => setShowHints(!showHints)}>{showHints ? '힌트 가리기 / Hide hint' : '막히면 힌트 보기 / Show hint'}</button>{showHints && <p>{book.words.join(' · ')}<br/>먼저 핵심 낱말을 고르고 문장으로 늘려요.</p>}<p className="workbook-can-do">오늘 해 볼 수 있는 것: {book.canDo}</p></>}
    </section>
    <footer className="workbook-footer"><span>{stage + 1} / 4</span><button type="button" disabled={stage === 0} onClick={() => {setShowHints(false); onStage(stage - 1);}}>이전</button><button type="button" disabled={stage === 3} onClick={() => {setShowHints(false); onStage(stage + 1);}}>다음</button></footer>
  </article>;
}
