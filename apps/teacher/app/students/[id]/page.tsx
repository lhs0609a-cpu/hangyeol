'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Eyebrow, Panel, StrandBars, Tag, type Strands } from '@hangyeol/ui';
import { get, post } from '../../api-client';
import { Shell } from '../../Shell';

/*
 * T-04 · 학생 상세 — 07번 문서.
 *
 * 하단 캡션은 고정이다: "음성 인식 없이 마이크 볼륨만으로 측정 · 추가 비용 0원"
 * 이 문장이 제품이 무엇을 하지 않는지를 강사에게 계속 알려 준다.
 */

interface StudentDetail {
  id: string;
  name: string;
  nameKo: string | null;
  flag: string | null;
  status: string;
  verifiedAt: string | null;
  levelCode: string;
  currentLessonNo: number;
  vocabCount: number;
  lastReport: { date: string; expressions: string[]; errors: string[] } | null;
  billing: { cycleNo: number; periodEnd: string; amount: number } | null;
  strands?: Strands;
  speakRatio?: number;
}

const STATUS_TONE: Record<string, 'j' | 'c' | 'h' | 'n'> = {
  active: 'j',
  dormant: 'c',
  pending: 'h',
  locked: 'h',
  completed: 'n',
};

const STATUS_LABEL: Record<string, string> = {
  active: '활성',
  dormant: '휴면 · 청구 없음',
  pending: '인증 대기',
  locked: '잠금',
  completed: '종료',
};

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<StudentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get<StudentDetail>(`/api/students/${params.id}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [params.id]);

  if (error) {
    return (
      <Shell>
        <Panel>
          <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
        </Panel>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>불러오는 중</p>
      </Shell>
    );
  }

  // Four Strands 는 strand_weekly 집계가 붙기 전까지 비어 있다.
  // 임의의 숫자를 채워 넣지 않는다 — 없는 데이터를 그럴듯하게 만들면 판단이 왜곡된다.
  const strands = data.strands ?? null;

  async function complete() {
    setBusy(true);
    try {
      await post(`/api/students/${params.id}`);
      const next = await get<StudentDetail>(`/api/students/${params.id}`);
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리하지 못했습니다');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            {data.nameKo ?? data.name}
          </h1>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 3 }}>
            {data.name} · {data.levelCode.replace('topik', 'TOPIK ')}급 · {data.currentLessonNo}차시
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Tag tone={STATUS_TONE[data.status] ?? 'n'}>{STATUS_LABEL[data.status] ?? data.status}</Tag>
            {!data.verifiedAt && <Tag tone="h">이메일 미인증</Tag>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <Stat label="누적 어휘" value={String(data.vocabCount)} />
          <Stat label="차시" value={String(data.currentLessonNo)} />
          {data.billing && <Stat label="이번 주기" value={`${data.billing.amount.toLocaleString('ko-KR')}원`} />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginTop: 24 }}>
        <Panel>
          <Eyebrow>Four Strands</Eyebrow>
          <div style={{ marginTop: 14 }}>
            {strands ? (
              <StrandBars strands={strands} />
            ) : (
              <p style={{ fontSize: 12.5, color: 'var(--ink-4)', margin: 0, lineHeight: 1.7 }}>
                아직 집계된 주간 기록이 없습니다.
                학생이 학습 도구를 쓰기 시작하면 여기에 시간 배분이 나타납니다.
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          <Eyebrow>학생 발화 비율</Eyebrow>
          {data.speakRatio === undefined ? (
            <p style={{ fontSize: 12.5, color: 'var(--ink-4)', marginTop: 14, lineHeight: 1.7 }}>
              아직 측정된 수업이 없습니다.
            </p>
          ) : (
            <>
              <div className="mono" style={{ fontSize: 34, fontWeight: 500, marginTop: 10 }}>
                {data.speakRatio}%
              </div>
              <div style={{ height: 26, background: 'var(--rule-soft)', borderRadius: 6, marginTop: 10, overflow: 'hidden' }}>
                <div style={{ width: `${data.speakRatio}%`, height: '100%', background: 'var(--indigo)' }} />
              </div>
            </>
          )}
          {/* 07번 문서에서 고정 캡션으로 지정된 문구 */}
          <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 12 }}>
            음성 인식 없이 마이크 볼륨만으로 측정 · 추가 비용 0원
          </p>
        </Panel>
      </div>

      {data.lastReport && (
        <Panel style={{ marginTop: 14 }}>
          <Eyebrow>지난 수업 · {data.lastReport.date}</Eyebrow>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
            {data.lastReport.expressions.map((e) => (
              <Tag key={e} tone="i">{e}</Tag>
            ))}
          </div>
          {data.lastReport.errors.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 13 }}>
              고칠 것 · {data.lastReport.errors.join(' / ')}
            </div>
          )}
        </Panel>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href={`/plan/${data.id}`} style={{ textDecoration: 'none' }}>
          <Button kind="primary">오늘 뭘 할지 보기</Button>
        </Link>
        <Link href={`/lesson/${data.id}`} style={{ textDecoration: 'none' }}>
          <Button>수업 시작</Button>
        </Link>
        {data.status !== 'completed' && (
          <Button disabled={busy} onClick={complete}>
            {busy ? '처리하는 중' : '과정 종료 처리'}
          </Button>
        )}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Button kind="quiet">목록으로</Button>
        </Link>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
