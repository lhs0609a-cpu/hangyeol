'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Eyebrow, Panel, Tag } from '@hangyeol/ui';
import type { MasteryPlan, TeachingPlan } from '@hangyeol/core';
import { get } from '../../api-client';
import { Shell } from '../../Shell';

/*
 * 교수 플랜 — 이 제품이 교재와 함께 파는 것.
 *
 * italki 는 교재를 안 준다. 그래서 강사는 차시당 1~2시간을 준비에 쓴다.
 * 교재만 주면 그 시간이 30분으로 줄 뿐이다. 이 화면이 0 으로 만든다.
 *
 * 강사가 이 화면을 열면 오늘 무엇을, 몇 분씩, 어떤 말로 할지가 이미 정해져 있다.
 * "우리 교재 없이는 감도 안 온다"는 상태는 슬라이드가 아니라 여기서 나온다.
 */

const PHASE_TONE: Record<string, 'i' | 'j' | 'c' | 'n'> = {
  review: 'c',
  model: 'n',
  drill: 'i',
  roleplay: 'i',
  free: 'j',
  wrap: 'n',
};

export default function PlanPage({ params }: { params: { studentId: string } }) {
  const [data, setData] = useState<{ teaching: TeachingPlan; mastery: MasteryPlan } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<{ teaching: TeachingPlan; mastery: MasteryPlan }>(`/api/students/${params.studentId}/plan`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [params.studentId]);

  if (error) {
    return (
      <Shell wide={false}>
        <Panel>
          <p style={{ margin: 0, fontSize: 'var(--fs-body)' }}>{error}</p>
        </Panel>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell wide={false}>
        <p style={{ color: 'var(--ink-3)', fontSize: 'var(--fs-body)' }}>불러오는 중</p>
      </Shell>
    );
  }

  const { teaching, mastery } = data;

  return (
    <Shell wide={false}>
      <Eyebrow>{teaching.studentName} · {teaching.nextLessonNo}차시</Eyebrow>

      <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 600, letterSpacing: '-0.02em', margin: '8px 0 6px', lineHeight: 1.4 }}>
        {teaching.headline}
      </h1>
      <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', margin: 0 }}>{teaching.modeReason}</p>

      {teaching.unit && (
        <Panel style={{ marginTop: 20 }}>
          <Eyebrow>차시 목표</Eyebrow>
          <p style={{ fontSize: 'var(--fs-h2)', fontWeight: 600, margin: '8px 0 0' }}>{teaching.unit.goalStatement}</p>
          <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-4)', margin: '4px 0 0' }}>
            {teaching.unit.unitNo}차시 · {teaching.unit.title}
          </p>

          {teaching.exitTicket.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--rule-soft)' }}>
              <Eyebrow>이걸 말하면 통과</Eyebrow>
              <div style={{ marginTop: 8 }}>
                {teaching.exitTicket.map((t) => (
                  <div key={t} style={{ fontSize: 'var(--fs-body)', marginBottom: 4 }}>· {t}</div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* 시간 배분 — 학생 상태에 맞춰 조정된다 */}
      <Panel style={{ marginTop: 14 }}>
        <Eyebrow>오늘 50분</Eyebrow>
        <div style={{ marginTop: 12 }}>
          {teaching.allocation.map((a) => (
            <div key={a.phase} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="mono" style={{ fontSize: 'var(--fs-body-sm)', width: 34, color: 'var(--ink-3)' }}>
                  {a.minutes}분
                </span>
                <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600, flex: 1 }}>{a.label}</span>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: 'var(--rule)', marginTop: 5, marginLeft: 42 }}>
                <div
                  style={{
                    width: `${(a.minutes / 50) * 100}%`,
                    height: '100%',
                    borderRadius: 99,
                    background: a.adjustedBecause ? 'var(--chija)' : 'var(--indigo)',
                  }}
                />
              </div>
              {a.adjustedBecause && (
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--chija)', marginTop: 4, marginLeft: 42 }}>
                  {a.adjustedBecause}
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {teaching.reviewItems.length > 0 && (
        <Panel style={{ marginTop: 14 }}>
          <Eyebrow>복습 항목 — 지난 리포트에서 자동</Eyebrow>
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-4)', marginTop: 6 }}>
            강사가 만들지 않습니다. 지난주에 3분 적은 것이 오늘 돌아온 것입니다.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {teaching.reviewItems.map((e) => (
              <Tag key={e} tone="i">{e}</Tag>
            ))}
          </div>
        </Panel>
      )}

      {teaching.focus.length > 0 && (
        <Panel style={{ marginTop: 14 }}>
          <Eyebrow>중점 교정 — 반복되는 오류</Eyebrow>
          <div style={{ marginTop: 10 }}>
            {teaching.focus.map((f) => (
              <div key={f.item} style={{ padding: '10px 0', borderTop: '1px solid var(--rule-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600, flex: 1 }}>{f.item}</span>
                  <Tag tone="c">{f.occurrences}회</Tag>
                </div>
                <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-2)', marginTop: 5, lineHeight: 1.7 }}>
                  {f.howToFix}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* 지도안 — 그대로 읽으면 되는 대본 */}
      {teaching.plan ? (
        <Panel style={{ marginTop: 14 }}>
          <Eyebrow>지도안 — 그대로 읽으세요</Eyebrow>
          <div style={{ marginTop: 12 }}>
            {teaching.plan.blocks.map((block, i) => (
              <div key={i} style={{ padding: '14px 0', borderTop: '1px solid var(--rule-soft)' }}>
                <Tag tone={PHASE_TONE[block.phase] ?? 'n'}>{block.phase}</Tag>

                <div style={{ marginTop: 10 }}>
                  {block.say.map((line, j) => (
                    <div
                      key={j}
                      style={{
                        fontSize: 'var(--fs-body-lg)',
                        lineHeight: 1.75,
                        paddingLeft: 10,
                        borderLeft: '2px solid var(--indigo-w)',
                        marginBottom: 3,
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>

                {block.do && (
                  <div style={{ marginTop: 10 }}>
                    {block.do.map((d, j) => (
                      <div key={j} style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', marginBottom: 3 }}>
                        · {d}
                      </div>
                    ))}
                  </div>
                )}

                {block.studentOutput && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '8px 10px',
                      background: 'var(--jade-w)',
                      color: 'var(--jade)',
                      borderRadius: 6,
                      fontSize: 'var(--fs-body-sm)',
                    }}
                  >
                    학생이 말할 것 · {block.studentOutput}
                  </div>
                )}

                {block.ifStuck && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: '8px 10px',
                      background: 'var(--chija-w)',
                      color: 'var(--chija)',
                      borderRadius: 6,
                      fontSize: 'var(--fs-body-sm)',
                    }}
                  >
                    막히면 · {block.ifStuck}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel style={{ marginTop: 14, background: 'var(--chija-w)', border: '1px solid transparent' }}>
          <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)', color: 'var(--chija)', lineHeight: 1.7 }}>
            이 차시의 지도안이 아직 작성되지 않았습니다.
            차시 목표와 시간 배분만 참고하세요.
          </p>
        </Panel>
      )}

      {teaching.l1Note && (
        <Panel style={{ marginTop: 14 }}>
          <Eyebrow>이 학생의 모국어에서</Eyebrow>
          <p style={{ fontSize: 'var(--fs-body)', margin: '8px 0 0', lineHeight: 1.7 }}>{teaching.l1Note}</p>
        </Panel>
      )}

      {teaching.pitfalls.length > 0 && (
        <Panel style={{ marginTop: 14 }}>
          <Eyebrow>이 차시에서 강사가 흔히 하는 실수</Eyebrow>
          <div style={{ marginTop: 8 }}>
            {teaching.pitfalls.map((p) => (
              <div key={p} style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-2)', marginBottom: 5, lineHeight: 1.7 }}>
                · {p}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* 궤적 — 차시 하나가 아니라 이 학생이 어디로 가는가 */}
      <Panel style={{ marginTop: 14 }}>
        <Eyebrow>학습 계획</Eyebrow>
        <div className="mono" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', marginTop: 8 }}>
          {mastery.currentLessonNo}차시 · 주 {mastery.lessonsPerWeek}회 · 누적 어휘 {mastery.vocabTotal}
          {mastery.weeksToNextLevel !== null && ` · 다음 급까지 약 ${mastery.weeksToNextLevel}주`}
        </div>

        <div style={{ marginTop: 12 }}>
          {mastery.priorities.map((p) => (
            <div key={p.title} style={{ padding: '10px 0', borderTop: '1px solid var(--rule-soft)' }}>
              <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>{p.title}</div>
              <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.7 }}>{p.why}</div>
              <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--indigo)', marginTop: 6, lineHeight: 1.7 }}>
                → {p.action}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ marginTop: 22, display: 'flex', gap: 8 }}>
        <Link href={`/lesson/${teaching.studentId}`} style={{ textDecoration: 'none', flex: 1 }}>
          <Button kind="primary" size="lg" full>
            수업 시작 — 복습부터
          </Button>
        </Link>
        <Link href={`/students/${teaching.studentId}`} style={{ textDecoration: 'none' }}>
          <Button size="lg">학생 상세</Button>
        </Link>
      </div>
    </Shell>
  );
}
