import Link from 'next/link';

/*
 * 학생 화면 공통 조각.
 *
 * page.tsx 는 default 와 지정된 설정값만 export 할 수 있다.
 * 공용 컴포넌트를 페이지에 두면 빌드가 깨지므로 여기로 뺀다.
 */

export function TopBar({ right }: { right?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-3)', textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
        ← 오늘 / My learning
      </Link>
      {right && (
        <span className="mono" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-4)' }}>
          {right}
        </span>
      )}
    </div>
  );
}

export function Loading() {
  return (
    <p style={{ color: 'var(--ink-3)', fontSize: 'var(--fs-body)', textAlign: 'center', paddingTop: 40 }}>
      불러오는 중 / Loading your practice…
    </p>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return <div><TopBar /><p role="alert" className="t-body" style={{ marginTop: 30 }}>불러오지 못했어요. 다시 시도해 주세요.<br /><span lang="en">We could not load this page. Please try again.</span></p><button onClick={onRetry} style={{ marginTop: 18, padding: '12px 20px', background: 'var(--indigo)', color: 'var(--surface)', border: '1px solid var(--indigo)', borderRadius: 8 }}>다시 시도 / Retry</button></div>;
}

export function Done({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 50 }}>
      <p style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--ink-2)' }}>{message}</p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          marginTop: 18,
          padding: '12px 20px',
          borderRadius: 8,
          background: 'var(--indigo)',
          color: '#fff',
          fontSize: 'var(--fs-body)',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        오늘의 학습으로 / Back to learning
      </Link>
    </div>
  );
}
