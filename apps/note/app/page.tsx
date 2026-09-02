import Link from 'next/link';
import { cookies } from 'next/headers';
import { noteHome, verifyStudentToken, type NoteHome } from '@hangyeol/core';
import { SyllableProgress } from './SyllableProgress';

export const dynamic = 'force-dynamic';

/** 과제 id → 화면. noteHome 이 내는 id 와 맞춰 둔다. */
const TASK_HREF: Record<string, string> = {
  srs: '/srs',
};

/*
 * S-01 · 학습 노트 홈 — 07번 문서.
 *
 * 절대 규칙 (릴리즈 게이트):
 *   □ 페이지 어디에도 서비스명 문자열 없음
 *   □ title = "{강사명} 선생님의 학습 노트"
 *   □ 예약 · 결제 · 충전 · 강사검색 UI 없음
 */

async function loadHome(): Promise<NoteHome | null> {
  const token = cookies().get('hg_note')?.value;
  if (!token) return null;
  try {
    const claims = await verifyStudentToken(token, 'session');
    return await noteHome(BigInt(claims.studentId));
  } catch {
    return null;
  }
}

export default async function NoteHomePage() {
  const home = await loadHome();

  if (!home) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--ink-3)' }}>
        <SyllableProgress done={0} size={96} />
        <p style={{ marginTop: 20 }}>선생님이 보내드린 링크로 들어와 주세요</p>
      </div>
    );
  }

  return (
    <div className="hg-rise">
      <div style={{ textAlign: 'center' }}>
        <SyllableProgress done={home.syllableProgress.done} />
        <div className="mono" style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 8 }}>
          {home.syllableProgress.done} / {home.syllableProgress.total} · 이번 주 글자
        </div>
      </div>

      <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 600, marginTop: 26, marginBottom: 2 }}>
        안녕하세요, {home.studentNameKo} 씨
      </h1>
      <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', margin: 0 }}>
        {home.teacherDisplayName} 선생님의 학습 노트
        {home.streakDays > 0 ? ` · ${home.streakDays}일 연속` : ''}
      </p>

      <section style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {home.tasks.map((task, i) => (
          <Link
            key={task.id}
            href={TASK_HREF[task.id] ?? '/'}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 14px',
              borderRadius: 10,
              background: task.done ? 'transparent' : 'var(--hanji-card)',
              border: task.done ? '1px solid transparent' : '1px solid var(--hanji-rule)',
              opacity: task.done ? 0.55 : 1,
            }}
          >
            <span
              className="mono"
              style={{
                width: 24,
                height: 24,
                borderRadius: 99,
                display: 'grid',
                placeItems: 'center',
                fontSize: 'var(--fs-caption)',
                background: task.done ? 'var(--jade-w)' : 'var(--surface)',
                color: task.done ? 'var(--jade)' : 'var(--ink-3)',
                border: '1px solid var(--hanji-rule)',
                flexShrink: 0,
              }}
            >
              {task.done ? '✓' : i + 1}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 'var(--fs-body-lg)', fontWeight: 600 }}>{task.label}</span>
              <span style={{ display: 'block', fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)' }}>{task.sub}</span>
            </span>
            <span className="mono" style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)' }}>
              {task.minutes}분
            </span>
          </Link>
        ))}
      </section>

      {home.lastLesson && (
        <section
          style={{
            marginTop: 26,
            background: 'var(--hanji-card)',
            border: '1px solid var(--hanji-rule)',
            borderRadius: 10,
            padding: 18,
          }}
        >
          <div className="eyebrow">지난 수업에서</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {home.lastLesson.expressions.map((e) => (
              <span
                key={e}
                style={{
                  fontSize: 'var(--fs-body-sm)',
                  padding: '3px 8px',
                  borderRadius: 3,
                  background: 'var(--indigo-w)',
                  color: 'var(--indigo)',
                }}
              >
                {e}
              </span>
            ))}
          </div>
          {home.lastLesson.correction && (
            <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-2)', marginTop: 10 }}>
              고칠 것 · {home.lastLesson.correction}
            </div>
          )}
        </section>
      )}

      <nav style={{ display: 'flex', gap: 8, marginTop: 26 }}>
        {[
          { href: '/vocab', label: '내 단어장' },
          { href: '/progress', label: '지금까지' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              padding: '13px 0',
              textAlign: 'center',
              borderRadius: 10,
              border: '1px solid var(--hanji-rule)',
              background: 'var(--hanji-card)',
              color: 'var(--ink-2)',
              fontSize: 'var(--fs-body)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/*
        강사가 미납으로 잠겨도 학생 화면은 계속 돈다 (TC-10).
        학생에게는 잠금 사실을 알리지 않는다 — 07번 문서 "결제 잠금(학생): 아무 안내 없음".
        새 차시 자료만 조용히 열리지 않는다.
      */}
    </div>
  );
}
