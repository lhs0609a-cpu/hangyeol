'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Button,
  Eyebrow,
  Panel,
  SlidePlaceholder,
  SlideRenderer,
  Stepper,
  Tag,
  TeacherNote,
  type SlideView,
} from '@hangyeol/ui';
import { get, post, ApiClientError } from '../../api-client';
import { Shell } from '../../Shell';

/*
 * T-02 · 수업 진행 4단계 — 07번 문서.
 *
 * 목적은 하나다. 수업 시작 버튼 이후 강사가 아무것도 결정하지 않게 한다.
 * 각 단계는 앞으로만 진행한다. 뒤로가기는 [나가기]뿐이다.
 */

const STEPS = ['지난 기록', '복습 5분', '본 차시', '기록 3분'];

interface PrevReport {
  date: string;
  expressions: string[];
  errors: string[];
}

interface StartResult {
  lessonId: string;
  lessonNo: number;
  unitId: string | null;
  billing: { cycleOpened: boolean; amount: number | null; cycleNo: number | null };
}

export default function LessonPage({ params }: { params: { studentId: string } }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [lesson, setLesson] = useState<StartResult | null>(null);
  const [prev, setPrev] = useState<PrevReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const result = await post<StartResult>('/api/lessons', { studentId: params.studentId });
      setLesson(result);
      setStep(1);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : '수업을 시작하지 못했습니다. 잠시 후 다시 시도하세요');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell wide={false}>
      <Stepper steps={STEPS} current={step} />

      <div style={{ marginTop: 26 }}>
        {step === 0 && <StepPrev prev={prev} onPrev={setPrev} studentId={params.studentId} onStart={start} busy={busy} />}
        {step === 1 && <StepReview prev={prev} onNext={() => setStep(2)} lessonNo={lesson?.lessonNo ?? 0} />}
        {step === 2 && (
          <StepUnit
            studentId={params.studentId}
            unitNo={lesson?.lessonNo ?? null}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && lesson && (
          <StepReport lessonId={lesson.lessonId} onDone={() => router.push('/')} />
        )}
      </div>

      {lesson?.billing.cycleOpened && step === 1 && (
        <Panel style={{ marginTop: 18, background: 'var(--chija-w)', border: '1px solid transparent' }}>
          <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)', color: 'var(--chija)' }}>
            {lesson.billing.cycleNo}번째 28일 주기가 시작됐습니다 ·{' '}
            <span className="mono">{lesson.billing.amount?.toLocaleString('ko-KR')}원</span>
          </p>
        </Panel>
      )}

      {error && (
        <Panel style={{ marginTop: 18, background: 'var(--honghwa-w)', border: '1px solid transparent' }}>
          <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)', color: 'var(--honghwa)' }}>{error}</p>
        </Panel>
      )}

      <div style={{ marginTop: 26, textAlign: 'center' }}>
        <Button kind="quiet" size="sm" onClick={() => router.push('/')}>
          나가기
        </Button>
      </div>
    </Shell>
  );
}

/** 단계 0 — 지난 기록. 강사에게만 보인다. 5초. */
function StepPrev({
  prev,
  onPrev,
  studentId,
  onStart,
  busy,
}: {
  prev: PrevReport | null;
  onPrev: (p: PrevReport | null) => void;
  studentId: string;
  onStart: () => void;
  busy: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  // 렌더 도중에 fetch 나 localStorage 를 부르면 서버 렌더에서 터진다.
  // localStorage 는 서버에 존재하지 않는다.
  useEffect(() => {
    get<{ lastReport: PrevReport | null }>(`/api/students/${studentId}`)
      .then((d) => onPrev(d.lastReport ?? null))
      .catch(() => onPrev(null))
      .finally(() => setLoaded(true));
  }, [studentId, onPrev]);

  return (
    <Panel>
      <Eyebrow>강사에게만 보입니다 · 5초</Eyebrow>

      {prev ? (
        <>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', marginBottom: 6 }}>지난 수업 새 표현</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {prev.expressions.map((e) => (
                <Tag key={e} tone="i">
                  {e}
                </Tag>
              ))}
            </div>
          </div>

          {prev.errors.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', marginBottom: 6 }}>고칠 것</div>
              <div style={{ fontSize: 'var(--fs-body)' }}>{prev.errors[0]}</div>
            </div>
          )}
        </>
      ) : (
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-4)', marginTop: 12 }}>
          {loaded ? '지난 기록이 없습니다. 첫 수업이에요' : '불러오는 중'}
        </p>
      )}

      <div style={{ marginTop: 20 }}>
        <Button kind="primary" size="lg" full disabled={busy} onClick={onStart}>
          {busy ? '시작하는 중' : '수업 시작 — 복습 5분부터'}
        </Button>
      </div>
    </Panel>
  );
}

/**
 * 단계 1 — 복습 5분.
 * 직전 리포트의 expression 이 그대로 복습 문항이 된다. 강사가 만들지 않는다.
 * 이 구조가 리포트를 성실히 쓸 동기를 만든다 — 3분 입력한 것이 다음 주에 돌아온다.
 */
function StepReview({ prev, onNext, lessonNo }: { prev: PrevReport | null; onNext: () => void; lessonNo: number }) {
  return (
    <Panel>
      <Eyebrow>복습 5분</Eyebrow>
      <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', marginTop: 10 }}>
        눈으로 훑지 말고 학생이 말하게 하세요. 대답이 나와야 넘어갑니다.
      </p>

      <div style={{ marginTop: 16 }}>
        {(prev?.expressions ?? []).map((e, i) => (
          <div
            key={e}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderTop: '1px solid var(--rule-soft)',
            }}
          >
            <span className="mono" style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', width: 20 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ flex: 1, fontSize: 'var(--fs-h2)', fontWeight: 500 }}>{e}</span>
          </div>
        ))}

        {(!prev || prev.expressions.length === 0) && (
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-4)' }}>
            복습할 표현이 없습니다. 바로 본 차시로 갑니다
          </p>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <Button kind="primary" size="lg" full onClick={onNext}>
          {lessonNo}차시 열기
        </Button>
      </div>
    </Panel>
  );
}

/**
 * 단계 2 — 본 차시.
 *
 * 슬라이드는 지도안에서 생성된다. 이미지 파일을 기다리지 않는다.
 * 강사는 앞뒤로 넘기며 진행하고, 각 장에 붙은 지시는 강사에게만 보인다.
 */
function StepUnit({
  studentId,
  unitNo,
  onNext,
}: {
  studentId: string;
  unitNo: number | null;
  onNext: () => void;
}) {
  const [deck, setDeck] = useState<{
    title: string;
    goalStatement: string;
    watermark: string;
    slides: SlideView[];
  } | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!unitNo) {
      setError('이 수업에 배정된 차시가 없습니다');
      return;
    }
    get<typeof deck>(`/api/units/${unitNo}/deck?student_id=${studentId}`)
      .then(setDeck)
      .catch((e: Error) => setError(e.message));
  }, [unitNo, studentId]);

  // 좌우 화살표로 넘긴다. 수업 중에 마우스를 찾지 않게.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!deck) return;
      if (e.key === 'ArrowRight') setPage((p) => Math.min(deck.slides.length - 1, p + 1));
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(0, p - 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck]);

  const slide = deck?.slides[page];

  return (
    <Panel>
      <Eyebrow>차시 목표</Eyebrow>
      <p className="t-body-lg" style={{ margin: '8px 0 16px' }}>
        {deck?.goalStatement ?? (error ? '—' : '불러오는 중')}
      </p>

      {error ? (
        <SlidePlaceholder label={error} />
      ) : slide && deck ? (
        <>
          <SlideRenderer slide={slide} watermark={deck.watermark} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              이전
            </Button>
            <span className="t-body-sm mono tone-muted" style={{ flex: 1, textAlign: 'center' }}>
              {page + 1} / {deck.slides.length}
            </span>
            <Button
              size="sm"
              disabled={page >= deck.slides.length - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>

          <p className="t-caption" style={{ textAlign: 'center', marginTop: 6 }}>
            ← → 로 넘길 수 있어요
          </p>

          {slide.teacherNote && <TeacherNote note={slide.teacherNote} />}
        </>
      ) : (
        <SlidePlaceholder label="불러오는 중" />
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
        <Button kind="jade" size="lg" style={{ flex: 1 }} onClick={onNext}>
          통과 — 다음 차시 열기
        </Button>
        <Button size="lg" onClick={onNext}>
          재수행
        </Button>
      </div>
    </Panel>
  );
}

/**
 * 단계 3 — 3분 리포트 (T-03).
 * STT 를 대체하는 장치다. 저장 시 외부 API 호출이 0건이어야 한다.
 */
function StepReport({ lessonId, onDone }: { lessonId: string; onDone: () => void }) {
  const [expressions, setExpressions] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [expInput, setExpInput] = useState('');
  const [errInput, setErrInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ vocabCreated: number; srsScheduled: string[]; externalApiCalls: number } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const MAX_EXP = 5;
  const MAX_ERR = 3;

  async function save() {
    setBusy(true);
    setFailure(null);
    try {
      const r = await post<{ vocabCreated: number; srsScheduled: string[]; externalApiCalls: number }>(
        `/api/lessons/${lessonId}/report`,
        { expressions, errors, outcome: 'pass' },
      );
      setResult(r);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : '저장하지 못했습니다. 입력을 확인하고 다시 시도하세요');
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <Panel>
        <Eyebrow>전달 완료</Eyebrow>
        <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 600, marginTop: 10 }}>학생에게 전달됐습니다</h2>
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-2)', lineHeight: 1.7 }}>
          표현 {result.vocabCreated}개가 학습 노트에 적립됐고, 복습 알림이{' '}
          {result.srsScheduled.slice(0, 3).join(' · ')}에 자동 발송됩니다.
          이 표현들이 다음 수업 복습 슬라이드가 됩니다.
        </p>

        {/* 이 배지는 제품 철학의 증거다. 삭제 금지 (07번 T-03) */}
        <div style={{ marginTop: 14 }}>
          <Tag tone="j">음성 인식 미사용 · 외부 API 호출 {result.externalApiCalls}건 · 추가 비용 0원</Tag>
        </div>

        <div style={{ marginTop: 20 }}>
          <Button kind="primary" full onClick={onDone}>
            학생 목록으로
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <Eyebrow>기록 3분</Eyebrow>
      <p style={{ fontSize: 'var(--fs-body)', fontWeight: 600, marginTop: 8 }}>여기 넣은 것만 학생 노트로 갑니다</p>

      <ChipField
        title={`오늘 나온 새 표현 · ${expressions.length}/${MAX_EXP}`}
        hint="전부 적지 마세요. 다음 주에 반드시 기억해야 할 것만."
        tone="i"
        items={expressions}
        onRemove={(i) => setExpressions((v) => v.filter((_, x) => x !== i))}
        value={expInput}
        onChange={setExpInput}
        onAdd={() => {
          const v = expInput.trim();
          if (v && expressions.length < MAX_EXP) {
            setExpressions((prev) => [...prev, v]);
            setExpInput('');
          }
        }}
        disabled={expressions.length >= MAX_EXP}
      />

      <ChipField
        title={`학생이 틀린 문장 · ${errors.length}/${MAX_ERR}`}
        hint="말하기에서 조사 오류는 발달 단계입니다. 심한 것만."
        tone="c"
        items={errors}
        onRemove={(i) => setErrors((v) => v.filter((_, x) => x !== i))}
        value={errInput}
        onChange={setErrInput}
        onAdd={() => {
          const v = errInput.trim();
          if (v && errors.length < MAX_ERR) {
            setErrors((prev) => [...prev, v]);
            setErrInput('');
          }
        }}
        disabled={errors.length >= MAX_ERR}
      />

      {failure && (
        <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--honghwa)', marginTop: 12 }}>{failure}</p>
      )}

      <div style={{ marginTop: 18 }}>
        <Button
          kind="primary"
          size="lg"
          full
          disabled={expressions.length === 0 || busy}
          onClick={save}
        >
          {busy
            ? '저장하는 중'
            : expressions.length === 0
              ? '새 표현을 1개 이상 입력하세요'
              : '저장하고 학생에게 보내기'}
        </Button>
      </div>
    </Panel>
  );
}

function ChipField({
  title,
  hint,
  tone,
  items,
  onRemove,
  value,
  onChange,
  onAdd,
  disabled,
}: {
  title: string;
  hint: string;
  tone: 'i' | 'c';
  items: string[];
  onRemove: (i: number) => void;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--rule-soft)' }}>
      <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 3 }}>{hint}</div>

      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
          {items.map((item, i) => (
            <button
              key={`${item}-${i}`}
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`${item} 제거`}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            >
              <Tag tone={tone}>{item} ×</Tag>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          disabled={disabled}
          placeholder={disabled ? '최대치에 도달했습니다' : '입력하고 Enter'}
          style={{
            flex: 1,
            padding: '9px 11px',
            fontSize: 'var(--fs-body)',
            fontFamily: 'inherit',
            border: '1px solid var(--rule)',
            borderRadius: 7,
            background: disabled ? 'var(--rule-soft)' : 'var(--surface)',
            color: 'var(--ink)',
          }}
        />
        <Button size="sm" onClick={onAdd} disabled={disabled}>
          추가
        </Button>
      </div>
    </div>
  );
}
