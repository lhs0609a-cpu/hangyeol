'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Eyebrow, Panel, Tag } from '@hangyeol/ui';
import { get, post } from '../../api-client';
import { Shell } from '../../Shell';

/*
 * 관리자 보안 — 09번 문서 §6 "관리자 계정 2FA 필수".
 *
 * 관리자 화면은 여기를 지나야 열린다. 순서는 하나뿐이다.
 *
 *   인증 앱 등록 → 코드 확인 → 승급 세션 2시간
 *
 * 시크릿은 등록할 때 한 번만 보여 준다. 다시 보는 경로를 만들지 않았다 —
 * 그 경로가 있으면 관리자 세션을 훔친 사람이 2FA 를 그대로 복제한다.
 * 기기를 잃어버렸으면 지금 쓰는 코드로 재등록하거나, DB 접속 권한을 가진
 * 사람이 admin_totp_* 컬럼을 비운다. 화면에 복구 버튼을 두지 않는 이유가 그것이다.
 */

interface Status {
  email: string;
  enrolled: boolean;
  pending: boolean;
  stepUp: boolean;
  ipAllowlist: number;
}

interface Enrollment {
  secret: string;
  otpauth: string;
}

/** 손으로 옮겨 적는 값이다. 네 글자씩 끊으면 눈이 자리를 잃지 않는다. */
function grouped(secret: string): string {
  return (secret.match(/.{1,4}/g) ?? []).join(' ');
}

export default function AdminSecurityPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [currentCode, setCurrentCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await get<Status>('/api/admin/2fa'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '상태를 불러오지 못했어요');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function startEnroll() {
    setBusy(true);
    setError(null);
    try {
      // 재등록일 때만 현재 코드를 함께 보낸다. 서버가 필요 여부를 판단한다.
      const body = status?.enrolled ? { code: currentCode } : {};
      setEnrollment(await post<Enrollment>('/api/admin/2fa/enroll', body));
      setCurrentCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록을 시작하지 못했어요');
    } finally {
      setBusy(false);
    }
  }

  async function submitCode() {
    setBusy(true);
    setError(null);
    try {
      await post('/api/admin/2fa/verify', { code });
      setCode('');
      setEnrollment(null);
      setDone(true);
      await load();

      // 원래 가려던 관리자 화면으로 돌려보낸다.
      const next = new URLSearchParams(window.location.search).get('next');
      if (next?.startsWith('/admin')) window.location.href = next;
    } catch (e) {
      setError(e instanceof Error ? e.message : '코드를 확인하지 못했어요');
    } finally {
      setBusy(false);
    }
  }

  const needsCode = Boolean(enrollment) || (status?.enrolled ?? false) || (status?.pending ?? false);

  return (
    <Shell>
      <Eyebrow>관리자 보안</Eyebrow>
      <h1 className="t-h1" style={{ margin: '6px 0 0' }}>
        2단계 인증
      </h1>
      <p className="t-body-sm tone-muted" style={{ margin: '8px 0 0', maxWidth: 560 }}>
        관리자 화면에는 다른 강사의 가입 신청서와 승인 버튼, 정산 송금 기록이 있습니다. 로그인과
        별개로 인증 앱의 코드를 한 번 더 확인합니다. 확인하면 2시간 동안 열립니다.
      </p>

      {status && (
        <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
          <Tag tone={status.enrolled ? 'j' : 'h'}>
            {status.enrolled ? '인증 앱 등록됨' : '인증 앱 미등록'}
          </Tag>
          <Tag tone={status.stepUp ? 'j' : 'n'}>
            {status.stepUp ? '지금 열려 있음' : '코드 확인 필요'}
          </Tag>
          <Tag tone={status.ipAllowlist > 0 ? 'j' : 'n'}>
            {status.ipAllowlist > 0
              ? `접속 주소 제한 ${status.ipAllowlist}건`
              : '접속 주소 제한 없음'}
          </Tag>
        </div>
      )}

      {status && status.ipAllowlist === 0 && (
        <Panel variant="warm" style={{ marginTop: 16, maxWidth: 560 }}>
          <p className="t-body-sm" style={{ margin: 0 }}>
            접속 주소 제한이 설정되어 있지 않습니다. 고정 주소에서만 관리자 화면을 열 계획이라면
            서버 환경에 <code>ADMIN_IP_ALLOWLIST</code> 를 넣으세요. 목록 밖에서 온 요청은 관리자
            화면을 없는 주소로 취급합니다.
          </p>
        </Panel>
      )}

      {error && (
        <Panel variant="warm" style={{ marginTop: 16, maxWidth: 560 }}>
          <p className="t-body-sm" style={{ margin: 0 }}>
            {error}
          </p>
        </Panel>
      )}

      {done && !enrollment && (
        <Panel style={{ marginTop: 16, maxWidth: 560 }}>
          <p className="t-body-sm" style={{ margin: 0 }}>
            확인했습니다. 관리자 화면이 2시간 동안 열립니다.
          </p>
        </Panel>
      )}

      {/* 1단계 — 인증 앱 등록 */}
      <Panel style={{ marginTop: 18, maxWidth: 560 }}>
        <h2 className="t-h2" style={{ margin: 0 }}>
          {status?.enrolled ? '인증 앱 다시 등록' : '인증 앱 등록'}
        </h2>
        <p className="t-body-sm tone-muted" style={{ margin: '8px 0 0' }}>
          {status?.enrolled
            ? '기기를 바꿀 때만 씁니다. 지금 쓰는 앱의 코드를 먼저 넣어야 새 시크릿이 나옵니다.'
            : '휴대폰의 인증 앱에 아래 키를 등록하면 30초마다 여섯 자리 코드가 나옵니다.'}
        </p>

        {status?.enrolled && !enrollment && (
          <input
            className="t-body"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="지금 쓰는 인증 앱의 코드"
            placeholder="지금 쓰는 코드"
            value={currentCode}
            onChange={(e) => setCurrentCode(e.target.value)}
            style={{
              marginTop: 12,
              padding: '10px 12px',
              width: 180,
              border: '1px solid var(--rule)',
              borderRadius: 8,
              fontFamily: 'inherit',
            }}
          />
        )}

        {enrollment ? (
          <div style={{ marginTop: 14 }}>
            <p className="t-caption tone-muted" style={{ margin: 0 }}>
              이 키는 지금 한 번만 보입니다. 다시 볼 수 없습니다.
            </p>
            <p
              className="t-body-lg"
              style={{ margin: '6px 0 0', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}
            >
              {grouped(enrollment.secret)}
            </p>
            <p className="t-caption tone-muted" style={{ margin: '10px 0 0', wordBreak: 'break-all' }}>
              휴대폰에서 이 화면을 보고 있다면 다음 링크로 바로 등록됩니다 —{' '}
              <a href={enrollment.otpauth}>인증 앱에 추가</a>
            </p>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <Button
              kind="ghost"
              onClick={() => void startEnroll()}
              disabled={busy || (status?.enrolled === true && currentCode.length < 6)}
            >
              {status?.enrolled ? '새 키 받기' : '등록 시작'}
            </Button>
          </div>
        )}
      </Panel>

      {/* 2단계 — 코드 확인 */}
      {needsCode && (
        <Panel style={{ marginTop: 14, maxWidth: 560 }}>
          <h2 className="t-h2" style={{ margin: 0 }}>
            코드 확인
          </h2>
          <p className="t-body-sm tone-muted" style={{ margin: '8px 0 0' }}>
            인증 앱에 보이는 여섯 자리를 넣으세요. 한 번 쓴 코드는 다시 쓰이지 않습니다.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <input
              className="t-body"
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="인증 앱 코드"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code.length >= 6 && !busy) void submitCode();
              }}
              style={{
                padding: '10px 12px',
                width: 140,
                border: '1px solid var(--rule)',
                borderRadius: 8,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 'normal',
              }}
            />
            <Button
              kind="primary"
              onClick={() => void submitCode()}
              disabled={busy || code.length < 6}
            >
              확인
            </Button>
          </div>
        </Panel>
      )}
    </Shell>
  );
}
