'use client';

import { useEffect, useState } from 'react';
import { Eyebrow, Panel, Tag } from '@hangyeol/ui';
import { get } from '../../api-client';
import { Shell } from '../../Shell';

/*
 * A-01 · 우회 의심 플래그 — 02번 G-03 · 07번 A-01 · 09번 §3 U6.
 *
 * 지표 화면은 "우회 의심 3건" 이라는 숫자만 준다. 숫자로는 누구를 봐야
 * 하는지 알 수 없고, 알 수 없으면 아무도 확인하지 않는다.
 *
 * 화면에 제재 버튼을 두지 않았다. 문서가 두 곳에서 같은 문장을 적어 뒀다 —
 * "플래그만. 자동 제재 금지. 사람이 확인한다."
 * 버튼이 있으면 언젠가 눌린다. 그래서 만들지 않는다.
 */

type FlagRule = 'views_without_activity' | 'device_churn' | 'recycled_slots' | 'shared_ip';

interface Flag {
  rule: FlagRule;
  label: string;
  subject: { kind: 'student' | 'teacher' | 'network'; id: string };
  evidence: string;
  weight: number;
}

interface Report {
  generatedAt: string;
  windowDays: number;
  flags: Flag[];
  rules: { rule: FlagRule; label: string; source: string; meaning: string }[];
}

const SUBJECT_LABEL: Record<Flag['subject']['kind'], string> = {
  student: '학생',
  teacher: '강사',
  network: '접속 지점',
};

export default function AdminFlagsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void get<Report>('/api/admin/flags')
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : '목록을 불러오지 못했어요'));
  }, []);

  return (
    <Shell>
      <Eyebrow>우회 의심</Eyebrow>
      <h1 className="t-h1" style={{ margin: '6px 0 0' }}>
        확인이 필요한 신호
      </h1>
      <p className="t-body-sm tone-muted" style={{ margin: '8px 0 0', maxWidth: 620 }}>
        최근 {report?.windowDays ?? 30}일의 기록에서 규칙에 걸린 것만 모았습니다. 전부 정황이지
        증거가 아닙니다. 사람이 확인하고, 이 화면은 아무것도 제재하지 않습니다.
      </p>

      {error && (
        <Panel variant="warm" style={{ marginTop: 16 }}>
          <p className="t-body-sm" style={{ margin: 0 }}>
            {error}
          </p>
        </Panel>
      )}

      {report && report.flags.length === 0 && (
        <Panel style={{ marginTop: 18 }}>
          <p className="t-body-sm" style={{ margin: 0 }}>
            걸린 신호가 없습니다.
          </p>
        </Panel>
      )}

      {report && report.flags.length > 0 && (
        <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
          {report.flags.map((f, i) => (
            <Panel key={`${f.rule}-${f.subject.id}-${i}`}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Tag tone={f.weight >= 3 ? 'h' : f.weight === 2 ? 'c' : 'n'}>
                  {SUBJECT_LABEL[f.subject.kind]} {f.subject.id}
                </Tag>
                <span className="t-body">{f.label}</span>
              </div>
              <p className="t-body-sm tone-muted" style={{ margin: '8px 0 0' }}>
                {f.evidence}
              </p>
            </Panel>
          ))}
        </div>
      )}

      {report && (
        <Panel variant="warm" style={{ marginTop: 18 }}>
          <h2 className="t-h2" style={{ margin: 0 }}>
            규칙
          </h2>
          <ul className="t-body-sm" style={{ margin: '10px 0 0', paddingLeft: 18 }}>
            {report.rules.map((r) => (
              <li key={r.rule} style={{ marginTop: 6 }}>
                <strong>{r.label}</strong> — {r.meaning}{' '}
                <span className="tone-muted">({r.source})</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </Shell>
  );
}
