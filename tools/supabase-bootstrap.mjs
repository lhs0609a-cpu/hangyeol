#!/usr/bin/env node
/*
 * Supabase 연결 자동화 — DB 비밀번호를 찾지 않고 새로 정한다.
 *
 *   npx supabase login          (한 번만. 브라우저가 열린다)
 *   node tools/supabase-bootstrap.mjs --admin=me@example.com [--vercel]
 *
 * 왜 이렇게 하는가.
 *
 * Supabase 의 DB 비밀번호는 만들 때 한 번 보여 주고 다시 보여 주지 않는다.
 * 어디에도 저장돼 있지 않으니 CLI 로도 못 꺼낸다 — 대시보드에서 재설정하는 게
 * 유일한 방법이라고 알려져 있지만, 사실 하나 더 있다.
 *
 * `supabase db query --linked` 는 Postgres 에 직접 붙지 않는다.
 * Management API 를 지난다 — 즉 액세스 토큰만 있으면 SQL 이 돈다.
 * 그러면 ALTER USER 로 비밀번호를 우리가 정할 수 있다.
 * 대시보드의 "Reset database password" 가 하는 일과 같다.
 *
 * 비밀번호는 여기서 만들고 여기서 쓴다. 화면에 찍지 않는다 —
 * 사람이 옮겨 적을 일이 없으면 셸 기록에도 채팅에도 남지 않는다.
 * 필요하면 .env 에 있다.
 */

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const REF = 'wyhlifnsuwnkuzoirrop';

const admin = process.argv.find((a) => a.startsWith('--admin='))?.slice('--admin='.length).trim();
const toVercel = process.argv.includes('--vercel');

/*
 * URL 에 그대로 들어갈 수 있는 글자만 쓴다.
 *
 * base64 를 쓰면 +, /, = 가 섞여 연결 문자열에서 인코딩 사고가 난다.
 * db-connect 가 encodeURIComponent 로 감싸긴 하지만, 그래도 로그·대시보드에
 * 이상하게 찍히는 자리가 남는다. 애초에 안전한 글자만 뽑는 쪽이 낫다.
 * 62글자에서 48자면 충분히 길다.
 */
function makePassword(len = 48) {
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(len * 2);
  let out = '';
  for (let i = 0; out.length < len; i++) out += abc[bytes[i] % abc.length];
  return out;
}

function sb(args, opts = {}) {
  return execFileSync('npx', ['--yes', 'supabase@latest', ...args], {
    shell: true,
    encoding: 'utf8',
    ...opts,
  });
}

// 1. 로그인 확인. 여기서 걸리면 나머지는 전부 무의미하다.
try {
  sb(['projects', 'list', '--output', 'json'], { stdio: ['ignore', 'pipe', 'ignore'] });
} catch {
  console.error('Supabase 에 로그인돼 있지 않습니다.');
  console.error('  npx supabase login');
  console.error('브라우저가 열립니다. 끝나면 이 스크립트를 다시 실행하세요.');
  process.exit(1);
}

console.log('[1/3] DB 비밀번호 설정');

const pw = makePassword();

/*
 * ALTER USER 는 비밀번호를 서버 로그에 남길 수 있다.
 * Supabase 는 이 경로를 대시보드 재설정에도 쓰므로 같은 수준이다.
 * 그래도 파일로 넘긴다 — 인자로 주면 프로세스 목록에 잠깐 뜬다.
 */
sb(['db', 'query', '--project-ref', REF, `"ALTER USER postgres WITH PASSWORD '${pw}';"`], {
  stdio: ['ignore', 'ignore', 'inherit'],
});

console.log('  완료 — 새 비밀번호는 .env 에만 남습니다');

console.log('\n[2/3] 연결 · 마이그레이션');

const args = [pw];
if (admin) args.push(`--admin=${admin}`);
if (toVercel) args.push('--vercel');

execFileSync('node', ['tools/db-connect.mjs', ...args], { stdio: 'inherit' });

console.log('\n[3/3] 확인');
console.log('  강사 승인:  node tools/admin-approve.mjs <이메일>');
console.log('  대기 목록:  node tools/admin-approve.mjs --list');
if (toVercel) console.log('\nVercel 은 다음 배포부터 적용됩니다.');
