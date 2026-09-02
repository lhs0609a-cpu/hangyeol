import Link from 'next/link';
import type { StudentStatus } from '@hangyeol/shared';
import { Button, Eyebrow, Panel, Tag, type Tone } from '@hangyeol/ui';
import { loadToday } from '../data';
import { Shell } from '../Shell';

export const dynamic = 'force-dynamic';

/*
 * T-02 · 학생 목록.
 *
 * 홈(T-01)은 "오늘 할 일" 이라 오늘 수업이 있는 학생만 보인다.
 * 강사가 전체를 훑어야 하는 순간 — 누가 잠겼는지, 누가 몇 차시인지 — 은 따로 있다.
 * 그게 여기다.
 *
 * 상태는 색과 라벨을 함께 준다. 색만으로 의미를 전달하지 않는다(06번 §7).
 */

const STATUS: Record<StudentStatus, { label: string; tone: Tone }> = {
  active: { label: '활성', tone: 'j' },
  dormant: { label: '휴면 · 청구 없음', tone: 'c' },
  pending: { label: '인증 대기', tone: 'h' },
  locked: { label: '잠금', tone: 'h' },
  completed: { label: '종료', tone: 'n' },
};

/** 07번 문서 T-02 의 정렬. 손이 가야 하는 학생이 위로 온다. */
const ORDER: StudentStatus[] = ['locked', 'pending', 'active', 'dormant', 'completed'];

export default async function StudentsPage() {
  const { students } = await loadToday();
  const sorted = [...students].sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || b.lessonNo - a.lessonNo,
  );
  const needsAttention = sorted.filter((s) => s.status === 'locked' || s.status === 'pending');

  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow>학생</Eyebrow>
          <h1 className="t-h1" style={{ margin: '6px 0 0' }}>
            {students.length}명
          </h1>
        </div>
        <Link href="/students/new" style={{ textDecoration: 'none' }}>
          <Button kind="jade">학생 등록</Button>
        </Link>
      </div>

      {needsAttention.length > 0 && (
        <Panel style={{ marginTop: 18 }}>
          <Eyebrow>먼저 볼 것</Eyebrow>
          <p className="t-body" style={{ margin: '8px 0 0' }}>
            {needsAttention.length}명이 수업을 못 듣고 있어요. 아래 목록 맨 위에 있습니다.
          </p>
        </Panel>
      )}

      <Panel style={{ marginTop: 14, padding: 0, overflow: 'hidden' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '38px 22px', textAlign: 'center' }}>
            <p className="t-body-lg" style={{ margin: 0 }}>
              아직 등록한 학생이 없어요
            </p>
            <p className="t-body-sm tone-muted" style={{ margin: '6px 0 16px' }}>
              학생을 등록하면 첫 3차시는 무료로 진행됩니다
            </p>
            <Link href="/students/new" style={{ textDecoration: 'none' }}>
              <Button kind="jade">첫 학생 등록</Button>
            </Link>
          </div>
        ) : (
          sorted.map((s, i) => {
            const st = STATUS[s.status];
            return (
              <Link
                key={s.id}
                href={`/students/${s.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1fr auto auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 18px',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
                  // 손이 가야 하는 학생은 흐리게 두지 않는다
                  opacity: s.status === 'completed' ? 0.62 : 1,
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 'var(--fs-body-lg)' }}>
                  {s.flag}
                </span>

                <span>
                  <span className="t-body-lg" style={{ display: 'block' }}>
                    {s.nameKo}
                  </span>
                  <span className="t-caption tone-muted">
                    {s.name} · {s.level} · 마지막 활동 {s.lastActivity}
                  </span>
                </span>

                <span className="t-body-sm mono tone-muted">{s.lessonNo}차시</span>

                <Tag tone={st.tone}>{st.label}</Tag>
              </Link>
            );
          })
        )}
      </Panel>

      <p className="t-caption tone-muted" style={{ marginTop: 12 }}>
        잠금·인증 대기가 위에 옵니다. 그다음은 차시가 많은 순서입니다.
      </p>
    </Shell>
  );
}
