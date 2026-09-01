import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { noteHome, verifyStudentToken, type NoteHome } from '@hangyeol/core';
import { SyllableProgress } from './SyllableProgress';

export const dynamic = 'force-dynamic';

/** 과제 id → 화면. noteHome 이 내는 id 와 맞춰 둔다. */
const TASK_HREF: Record<string, string> = {
  srs: '/srs',
  hvpt: '/hvpt',
  fluency: '/fluency',
  listening: '/listening',
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

export async function generateMetadata(): Promise<Metadata> {
  const home = await loadHome();
  // 강사 이름을 모르는 상태에서 기본 제목을 박으면 그게 곧 브랜드 누출이다.
  return { title: home ? `${home.teacherDisplayName} 선생님의 학습 노트` : '학습 노트' };
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
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 8 }}>
          {home.syllableProgress.done} / {home.syllableProgress.total} · 오늘의 글자
        </div>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 26, marginBottom: 2 }}>
        안녕하세요, {home.studentNameKo} 씨
      </h1>
      <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: 0 }}>
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
                fontSize: 11,
                background: task.done ? 'var(--jade-w)' : 'var(--surface)',
                color: task.done ? 'var(--jade)' : 'var(--ink-3)',
                border: '1px solid var(--hanji-rule)',
                flexShrink: 0,
              }}
            >
              {task.done ? '✓' : i + 1}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{task.label}</span>
              <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-3)' }}>{task.sub}</span>
            </span>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>
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
                  fontSize: 12.5,
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
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 10 }}>
              고칠 것 · {home.lastLesson.correction}
            </div>
          )}
        </section>
      )}

      {/*
        강사가 미납으로 잠겨도 학생 화면은 계속 돈다 (TC-10).
        학생에게는 잠금 사실을 알리지 않는다 — 07번 문서 "결제 잠금(학생): 아무 안내 없음".
        새 차시 자료만 조용히 열리지 않는다.
      */}
    </div>
  );
}
