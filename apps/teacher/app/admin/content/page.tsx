'use client';

import Link from 'next/link';
import { Eyebrow, Panel, Tag } from '@hangyeol/ui';
import {
  CLASSROOM_ENGLISH,
  IMAGE_ASSET_STATUS,
  LESSON_PLANS,
  LESSON_PLAN_STATUS,
  LEVEL1_UNITS,
  PRONUNCIATION_ITEMS,
  TRIAL_PACKS,
} from '@hangyeol/content';
import { Shell } from '../../Shell';

/*
 * 콘텐츠 현황 — 관리자 전용.
 *
 * 무엇이 있고 무엇이 없는지를 한 화면에서 본다.
 * "다 만들었다"고 착각하지 않으려면 목표 대비 실제를 항상 눈에 두어야 한다.
 */

export default function ContentPage() {
  const blocks = LESSON_PLANS.flatMap((p) => p.blocks);

  return (
    <Shell>
      <Eyebrow>관리자 · 콘텐츠</Eyebrow>
      <h1 style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em', margin: '8px 0 6px' }}>
        교재 현황
      </h1>
      <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: 0, lineHeight: 1.7 }}>
        전부 AI 초안입니다. 08번 문서 §9 대로 한국어교원 자격 2급 검수를 거쳐야 하고,
        검수 전에는 실제 수업에 쓰지 않습니다.
      </p>

      <Panel style={{ marginTop: 18 }}>
        <Eyebrow>차시 지도안</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginTop: 12 }}>
          <Stat label="작성 차시" value={`${LESSON_PLANS.length} / ${LESSON_PLAN_STATUS.target}`} />
          <Stat label="강사 대사" value={`${blocks.flatMap((b) => b.say).length}줄`} />
          <Stat label="막힘 대응" value={`${blocks.filter((b) => b.ifStuck).length}개`} />
          <Stat label="강사 실수" value={`${LESSON_PLANS.flatMap((p) => p.teacherPitfalls).length}개`} />
          <Stat label="모국어 노트" value={`${LESSON_PLANS.flatMap((p) => Object.keys(p.l1Notes)).length}개`} />
        </div>
      </Panel>

      <Panel style={{ marginTop: 14 }}>
        <Eyebrow>차시별</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
          {LEVEL1_UNITS.map((u) => {
            const has = LESSON_PLANS.some((p) => p.unitNo === u.unitNo);
            return (
              <Link
                key={u.unitNo}
                href={`/admin/images?unit=${u.unitNo}`}
                title={u.title}
                className="mono"
                style={{
                  width: 34,
                  padding: '6px 0',
                  textAlign: 'center',
                  fontSize: 11,
                  borderRadius: 5,
                  textDecoration: 'none',
                  background: has ? 'var(--jade-w)' : 'var(--honghwa-w)',
                  color: has ? 'var(--jade)' : 'var(--honghwa)',
                }}
              >
                {u.unitNo}
              </Link>
            );
          })}
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 10 }}>
          초록은 지도안이 있는 차시입니다. 눌러서 그 차시의 이미지 자산으로 갑니다.
        </p>
      </Panel>

      <Panel style={{ marginTop: 14 }}>
        <Eyebrow>그 밖의 교재</Eyebrow>
        <div style={{ marginTop: 12 }}>
          <Row label="교실영어" value={`${CLASSROOM_ENGLISH.length} / 250`} done={CLASSROOM_ENGLISH.length >= 250} />
          <Row label="커리큘럼 1급" value={`${LEVEL1_UNITS.length} / 30`} done={LEVEL1_UNITS.length >= 30} />
          <Row label="발음 시트" value={`${PRONUNCIATION_ITEMS.length}항목`} done />
          <Row label="체험수업 팩" value={`${TRIAL_PACKS.length} / 4`} done={TRIAL_PACKS.length >= 4} />
          <Row
            label="이미지 자산"
            value={`0 / ${IMAGE_ASSET_STATUS.total}`}
            done={false}
            note="프롬프트는 준비됨 — 관리자가 생성해 올린다"
          />
        </div>
      </Panel>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 500, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, done, note }: { label: string; value: string; done: boolean; note?: string }) {
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--rule-soft)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{value}</span>
          {done && <Tag tone="j">완료</Tag>}
        </span>
      </div>
      {note && <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 3 }}>{note}</div>}
    </div>
  );
}
