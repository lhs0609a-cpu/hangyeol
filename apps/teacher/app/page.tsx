import { quoteCyclePrice, TIER_PRICE } from '@hangyeol/billing';
import type { StudentStatus } from '@hangyeol/shared';

/*
 * T-01 · 오늘 (강사 홈) — 07번 문서 구현.
 *
 * 아직 API 가 없으므로 데이터는 목업이다.
 * 다만 금액만은 목업으로 적지 않고 packages/billing 의 실제 함수로 계산한다.
 * 화면에 찍힌 숫자와 과금 엔진이 어긋나는 상태를 처음부터 만들지 않기 위해서다.
 */

type Student = {
  id: number;
  flag: string;
  nameKo: string;
  name: string;
  lessonNo: number;
  level: string;
  status: StudentStatus;
  lastActivity: string;
};

const TEACHER = { name: '이지은', tier: 'B' as const, activeStudentCount: 4 };

const STUDENTS: Student[] = [
  { id: 1042, flag: '🇪🇸', nameKo: '마리아', name: 'Maria Santos', lessonNo: 14, level: 'TOPIK 1급', status: 'active', lastActivity: '2시간 전' },
  { id: 1043, flag: '🇯🇵', nameKo: '미사키', name: 'Misaki Ito', lessonNo: 22, level: 'TOPIK 2급', status: 'active', lastActivity: '어제' },
  { id: 1045, flag: '🇻🇳', nameKo: '민', name: 'Nguyen Minh', lessonNo: 6, level: 'TOPIK 1급', status: 'active', lastActivity: '3일 전' },
  { id: 1046, flag: '🇺🇸', nameKo: '루카스', name: 'Lucas Brown', lessonNo: 3, level: 'TOPIK 1급', status: 'pending', lastActivity: '5일 전' },
  { id: 1044, flag: '🇮🇩', nameKo: '사라', name: 'Sarah Putri', lessonNo: 9, level: 'TOPIK 1급', status: 'dormant', lastActivity: '34일 전' },
];

const STATUS_STYLE: Record<StudentStatus, { label: string; fg: string; bg: string; opacity: number; bar: string }> = {
  active: { label: '활성', fg: 'var(--jade)', bg: 'var(--jade-w)', opacity: 1, bar: 'var(--indigo)' },
  dormant: { label: '휴면 · 청구 없음', fg: 'var(--chija)', bg: 'var(--chija-w)', opacity: 0.62, bar: 'var(--chija)' },
  pending: { label: '인증 대기', fg: 'var(--honghwa)', bg: 'var(--honghwa-w)', opacity: 0.62, bar: 'var(--chija)' },
  locked: { label: '잠금', fg: 'var(--honghwa)', bg: 'var(--honghwa-w)', opacity: 0.5, bar: 'var(--honghwa)' },
  completed: { label: '종료', fg: 'var(--ink-3)', bg: 'var(--rule-soft)', opacity: 0.62, bar: 'var(--ink-4)' },
};

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function TodayPage() {
  // 청구 대상은 active 학생뿐이다. 휴면·인증대기는 0원으로 명시한다(05번 §5).
  const quote = quoteCyclePrice(TEACHER.tier, TEACHER.activeStudentCount);
  const billable = STUDENTS.filter((s) => s.status === 'active');
  const monthTotal = billable.length * quote.amount;

  const imminent = {
    flag: '🇪🇸',
    nameKo: '마리아',
    platform: 'Preply',
    meta: '15차시 · TOPIK 1급 · 스페인어',
    at: '14:00',
    minutesUntil: 8,
    expressions: ['-고 싶어요', '그런데', '-아/어 주세요'],
    fix: '학교를 갔어요 → 학교에 갔어요',
  };

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '26px 20px 70px' }}>
        <LaunchPanel {...imminent} />

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 26 }}>
          <Metric eyebrow="이번 달 청구" value={won(monthTotal)} note={`활성 ${billable.length}명 · 티어 ${quote.tier}`} big />
          <Metric eyebrow="이번 주 수업" value="11" note="지난주 9회" />
          <Metric eyebrow="평균 학생 발화" value="47%" note="목표 50% 이상" />
        </section>

        <section style={{ marginTop: 34 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="eyebrow">학생 {STUDENTS.length}명</div>
            {/* 우회 심리를 사전에 차단하는 카피. 07번 문서에서 삭제 금지로 명시돼 있다. */}
            <div style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>수업 자료는 학생을 선택해야 열립니다</div>
          </div>

          <div style={{ border: '1px solid var(--rule)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
            {STUDENTS.map((s, i) => (
              <StudentRow key={s.id} student={s} first={i === 0} />
            ))}
          </div>
        </section>

        <NewStudentCard />

        <p style={{ marginTop: 40, fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.7 }}>
          이 화면은 아직 목업 데이터로 렌더됩니다. API 는 미착수이고, 금액만 packages/billing 의
          실제 계산식(티어 {quote.tier} {won(TIER_PRICE[quote.tier])}
          {quote.discountPct > 0 ? ` · 볼륨 할인 ${quote.discountPct}%` : ''})으로 산출했습니다.
        </p>
      </main>
    </>
  );
}

function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 54,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '0 20px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--rule)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        {/* 로고는 아이콘 세트가 아니라 획으로 그린다 (06번 §9) */}
        <svg width="17" height="17" viewBox="0 0 100 100" aria-hidden="true">
          <path
            d="M22 20 V80 M78 20 V80 M22 50 H78"
            stroke="var(--ink)"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>한결</span>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 14 }}>
          <NavItem label="오늘" active />
          <NavItem label="청구" />
        </nav>
      </div>
    </header>
  );
}

function NavItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      style={{
        fontSize: 13,
        padding: '5px 10px',
        borderRadius: 7,
        color: active ? 'var(--ink)' : 'var(--ink-3)',
        background: active ? 'var(--rule-soft)' : 'transparent',
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </span>
  );
}

function LaunchPanel(props: {
  flag: string;
  nameKo: string;
  platform: string;
  meta: string;
  at: string;
  minutesUntil: number;
  expressions: string[];
  fix: string;
}) {
  return (
    <section
      className="hg-rise"
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
              다음 수업 · {props.platform}
            </span>
          </div>
          <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {props.flag} {props.nameKo}
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 3 }}>
            {props.meta}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.03em' }}>
            {props.at}
          </div>
          <div style={{ fontSize: 11, color: 'var(--jade)' }}>{props.minutesUntil}분 뒤 시작</div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #262a35', margin: '16px 0 14px' }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {props.expressions.map((e) => (
            <span
              key={e}
              className="mono"
              style={{ fontSize: 10, padding: '3px 7px', borderRadius: 3, background: '#262a35', color: '#c9cdd8' }}
            >
              {e}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>고칠 것 · {props.fix}</div>
      </div>

      {/* 버튼 라벨은 결과를 말한다 (06번 §8) */}
      <button
        className="hg-tap"
        style={{
          marginTop: 16,
          width: '100%',
          padding: '14px 16px',
          border: 'none',
          borderRadius: 8,
          background: '#fff',
          color: 'var(--ink)',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        수업 시작 — 복습 5분부터
      </button>
    </section>
  );
}

function Metric({ eyebrow, value, note, big = false }: { eyebrow: string; value: string; note: string; big?: boolean }) {
  return (
    <div style={{ border: '1px solid var(--rule)', borderRadius: 10, background: 'var(--surface)', padding: 18 }}>
      <div className="eyebrow">{eyebrow}</div>
      <div
        className="mono"
        style={{ fontSize: big ? 30 : 26, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 8 }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 4 }}>{note}</div>
    </div>
  );
}

function StudentRow({ student, first }: { student: Student; first: boolean }) {
  const st = STATUS_STYLE[student.status];
  const progress = Math.min(100, (student.lessonNo / 30) * 100);

  return (
    <div
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
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>
          {student.flag} {student.nameKo}
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
          {student.name}
        </div>
      </div>

      <div>
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>
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
            fontSize: 10,
            padding: '3px 7px',
            borderRadius: 3,
            background: st.bg,
            color: st.fg,
            whiteSpace: 'nowrap',
          }}
        >
          {st.label}
        </span>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 5 }}>
          {student.lastActivity}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <SmallButton label="상세" kind="ghost" />
        <SmallButton label="기록" kind="primary" />
      </div>
    </div>
  );
}

function SmallButton({ label, kind }: { label: string; kind: 'ghost' | 'primary' }) {
  const primary = kind === 'primary';
  return (
    <button
      className="hg-tap"
      style={{
        padding: '7px 12px',
        fontSize: 12,
        borderRadius: 7,
        fontFamily: 'inherit',
        cursor: 'pointer',
        background: primary ? 'var(--ink)' : 'var(--surface)',
        color: primary ? '#fff' : 'var(--ink-2)',
        border: primary ? '1px solid var(--ink)' : '1px solid var(--rule)',
      }}
    >
      {label}
    </button>
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
      <div style={{ fontSize: 13 }}>예약이 잡혔는데 목록에 없나요</div>
      <button
        className="hg-tap"
        style={{
          marginTop: 10,
          padding: '10px 16px',
          fontSize: 13,
          borderRadius: 8,
          border: '1px solid var(--rule)',
          background: 'var(--surface)',
          color: 'var(--ink-2)',
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        새 학생 등록 · 30초
      </button>
      <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 8 }}>
        등록과 1차시는 무료입니다. 2차시부터 요금이 발생합니다
      </div>
    </section>
  );
}
