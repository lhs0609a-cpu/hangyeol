import Link from 'next/link';
import { TIER_PRICE } from '@hangyeol/billing';
import type { StudentStatus } from '@hangyeol/shared';
import { loadToday, type TodayStudent } from '../data';
import { Shell } from '../Shell';

export const dynamic = 'force-dynamic';

/*
 * T-01 · 오늘 (강사 홈) — 07번 문서 구현.
 *
 * DB 가 붙어 있으면 실제 학생 레코드를, 없으면 목업을 읽는다(app/data.ts).
 * 어느 쪽이든 금액은 packages/billing 의 계산식을 그대로 쓴다.
 * 화면 숫자와 과금 엔진이 어긋나는 상태를 만들지 않기 위해서다.
 */

/** 07번 문서 T-01 의 상태 배지 표. 색만으로 의미를 전달하지 않도록 라벨을 함께 둔다. */
const STATUS_STYLE: Record<
  StudentStatus,
  { label: string; fg: string; bg: string; opacity: number; bar: string }
> = {
  active: { label: '활성', fg: 'var(--jade)', bg: 'var(--jade-w)', opacity: 1, bar: 'var(--indigo)' },
  dormant: { label: '휴면 · 청구 없음', fg: 'var(--chija)', bg: 'var(--chija-w)', opacity: 0.62, bar: 'var(--chija)' },
  pending: { label: '인증 대기', fg: 'var(--honghwa)', bg: 'var(--honghwa-w)', opacity: 0.62, bar: 'var(--chija)' },
  locked: { label: '잠금', fg: 'var(--honghwa)', bg: 'var(--honghwa-w)', opacity: 0.5, bar: 'var(--honghwa)' },
  completed: { label: '종료', fg: 'var(--ink-3)', bg: 'var(--rule-soft)', opacity: 0.62, bar: 'var(--ink-4)' },
};

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default async function TodayPage() {
  const data = await loadToday();
  const billable = data.students.filter((s) => s.status === 'active');

  return (
    <Shell>
      <>
        <section className="teacher-welcome"><div><p className="eyebrow">오늘의 수업</p><h1 className="t-h1">학생과 나눌 다음 이야기를 준비해요.</h1><p className="t-body tone-muted">학생을 선택하면 지난 표현과 오늘의 지도안을 바로 볼 수 있어요.</p></div><Link href="/learn" className="teacher-workbook-link">그림으로 배우는 입문 교재 ↗</Link></section>
        {!data.live && <p className="teacher-demo-notice" role="status">체험용 예시 데이터입니다. 실제 학생의 수업 기록이나 청구 내역이 아닙니다.</p>}
        {/* 15분 이내 수업이 없으면 패널 자체를 렌더하지 않는다. 빈 자리를 남기지 않는다 (07번 T-01) */}
        {data.imminent && <LaunchPanel {...data.imminent} />}

        <section className="teacher-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 26 }}>
          <Metric eyebrow="현재 학생 기준 예상 이용료" value={won(data.monthTotal)} note={`28일 이용 기준 · 활성 ${billable.length}명`} big />
          <Metric eyebrow="전체 학생" value={`${data.students.length}명`} note="등록된 학생" />
          <Metric eyebrow="활성 학생" value={`${billable.length}명`} note="현재 수업을 이어 가는 학생" />
        </section>

        <section style={{ marginTop: 34 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="eyebrow">학생 {data.students.length}명</div>
            {/* 우회 심리를 사전에 차단하는 카피. 07번 문서에서 삭제 금지로 명시돼 있다. */}
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)' }}>수업 자료는 학생을 선택해야 열립니다</div>
          </div>

          <div style={{ border: '1px solid var(--rule)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
            {data.students.map((s, i) => (
              <StudentRow key={s.id} student={s} first={i === 0} />
            ))}
          </div>
        </section>

        <NewStudentCard />

        <p style={{ marginTop: 40, fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', lineHeight: 1.7 }}>
          예상 금액은 현재 학생 수와 이용 구간(학생당 {won(TIER_PRICE[data.tier])}
          {data.discountPct > 0 ? ` · 학생 수 할인 ${data.discountPct}%` : ''})으로 계산합니다. 실제 청구 내역은 청구 화면에서 확인해 주세요.
        </p>
      </>
    </Shell>
  );
}

function LaunchPanel(props: {
  studentId: string;
  flag: string;
  nameKo: string;
  meta: string;
  at: string;
  minutesUntil: number;
  expressions: string[];
  fix: string | null;
}) {
  return (
    <section
      className="hg-rise teacher-launch-panel"
      style={{ background: 'var(--ink)', borderRadius: 10, padding: 20, color: '#fff' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 99,
                background: 'var(--jade)',
                animation: 'hg-pulse 2s infinite',
              }}
              aria-hidden="true"
            />
            <span className="eyebrow" style={{ color: 'var(--ink-4)' }}>
              다음 수업
            </span>
          </div>
          <div style={{ fontSize: 'var(--fs-h1)', fontWeight: 600, letterSpacing: '-0.02em' }}>
            {props.flag} {props.nameKo}
          </div>
          <div className="mono" style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 3 }}>
            {props.meta}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 'var(--fs-display)', fontWeight: 500, letterSpacing: '-0.03em' }}>
            {props.at}
          </div>
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--jade)' }}>{props.minutesUntil}분 뒤 시작</div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--ink-2)', margin: '16px 0 14px' }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {props.expressions.map((e) => (
            <span
              key={e}
              className="mono"
              style={{ fontSize: 'var(--fs-eyebrow)', padding: '3px 7px', borderRadius: 3, background: 'var(--ink-2)', color: 'var(--rule)' }}
            >
              {e}
            </span>
          ))}
        </div>
        {props.fix && <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-4)' }}>고칠 것 · {props.fix}</div>}
      </div>

      {/* 버튼 라벨은 결과를 말한다 (06번 §8) */}
      <Link
        href={`/plan/${props.studentId}`}
        className="hg-tap"
        style={{
          display: 'block',
          marginTop: 16,
          width: '100%',
          padding: '14px 16px',
          borderRadius: 8,
          background: '#fff',
          color: 'var(--ink)',
          fontSize: 'var(--fs-body)',
          fontWeight: 600,
          textAlign: 'center',
          textDecoration: 'none',
        }}
      >
        오늘 뭘 할지 보기 — 복습 5분부터
      </Link>
    </section>
  );
}

function Metric({ eyebrow, value, note, big = false }: { eyebrow: string; value: string; note: string; big?: boolean }) {
  return (
    <div style={{ border: '1px solid var(--rule)', borderRadius: 10, background: 'var(--surface)', padding: 18 }}>
      <div className="eyebrow">{eyebrow}</div>
      <div
        className="mono"
        style={{ fontSize: big ? 'var(--fs-h1)' : 'var(--fs-h1)', fontWeight: 500, letterSpacing: '-0.03em', marginTop: 8 }}
      >
        {value}
      </div>
      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 4 }}>{note}</div>
    </div>
  );
}

function StudentRow({ student, first }: { student: TodayStudent; first: boolean }) {
  const st = STATUS_STYLE[student.status];
  const progress = Math.min(100, (student.lessonNo / 30) * 100);

  return (
    <div
      className="teacher-student-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(150px, 1.5fr) 1fr 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 18px',
        borderTop: first ? 'none' : '1px solid var(--rule-soft)',
        opacity: st.opacity,
      }}
    >
      <div>
        <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>
          {student.flag} {student.nameKo}
        </div>
        <div className="mono" style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)' }}>
          {student.name}
        </div>
      </div>

      <div>
        <div className="mono" style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-2)' }}>
          {student.lessonNo}차시 · {student.level}
        </div>
        <div style={{ height: 3, borderRadius: 99, background: 'var(--rule)', marginTop: 6 }}>
          <div style={{ width: `${progress}%`, height: '100%', borderRadius: 99, background: st.bar }} />
        </div>
      </div>

      <div>
        {/* 색만으로 의미를 전달하지 않는다 — 텍스트 라벨을 반드시 병기 (06번 §1) */}
        <span
          className="mono"
          style={{
            fontSize: 'var(--fs-eyebrow)',
            padding: '3px 7px',
            borderRadius: 3,
            background: st.bg,
            color: st.fg,
            whiteSpace: 'nowrap',
          }}
        >
          {st.label}
        </span>
        <div className="mono" style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 5 }}>
          {student.lastActivity}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <Link href={`/plan/${student.id}`} style={{ textDecoration: 'none' }}>
          <SmallButton label="플랜" kind="ghost" />
        </Link>
        <Link href={`/lesson/${student.id}`} style={{ textDecoration: 'none' }}>
          <SmallButton label="수업" kind="primary" />
        </Link>
      </div>
    </div>
  );
}

function SmallButton({ label, kind }: { label: string; kind: 'ghost' | 'primary' }) {
  const primary = kind === 'primary';
  return (
    <span
      className="hg-tap"
      style={{
        padding: '7px 12px',
        fontSize: 'var(--fs-body-sm)',
        borderRadius: 7,
        fontFamily: 'inherit',
        cursor: 'pointer',
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        background: primary ? 'var(--ink)' : 'var(--surface)',
        color: primary ? '#fff' : 'var(--ink-2)',
        border: primary ? '1px solid var(--ink)' : '1px solid var(--rule)',
      }}
    >
      {label}
    </span>
  );
}

function NewStudentCard() {
  return (
    <section
      style={{
        marginTop: 14,
        border: '1px dashed var(--rule)',
        borderRadius: 10,
        padding: 20,
        textAlign: 'center',
        color: 'var(--ink-3)',
      }}
    >
      <div style={{ fontSize: 'var(--fs-body)' }}>예약이 잡혔는데 목록에 없나요</div>
      <Link
        href="/students/new"
        className="hg-tap"
        style={{
          display: 'inline-block',
          marginTop: 10,
          padding: '10px 16px',
          fontSize: 'var(--fs-body)',
          borderRadius: 8,
          border: '1px solid var(--rule)',
          background: 'var(--surface)',
          color: 'var(--ink-2)',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        새 학생 등록 · 30초
      </Link>
      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 8 }}>
        등록과 1차시는 무료입니다. 2차시부터 요금이 발생합니다
      </div>
    </section>
  );
}
