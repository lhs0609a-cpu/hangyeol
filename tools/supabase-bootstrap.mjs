#!/usr/bin/env node
/*
 * Supabase 연결 자동화 — 남의 앱을 건드리지 않고 우리 자리만 만든다.
 *
 *   npx supabase login          (한 번만. 브라우저가 열린다)
 *   node tools/supabase-bootstrap.mjs --admin=me@example.com [--vercel]
 *
 * ── 왜 이렇게 하는가 ────────────────────────────────────
 *
 * 이 Supabase 프로젝트는 우리 것만이 아니다. 열어 보면 이미 둘이 살고 있다.
 *
 *   public    19개  블로그/SEO 제품 (blogs, posts, payments, subscriptions …)
 *   sisibibi  45개  또 다른 제품    (cases, verdicts, appeals, settlements …)
 *
 * 그래서 처음에 세웠던 계획 두 개가 전부 사고였다.
 *
 *   ALTER USER postgres WITH PASSWORD
 *     → 저 두 앱의 연결 문자열이 그 자리에서 무효가 된다.
 *       대시보드의 "Reset database password" 도 같은 일을 한다.
 *       비밀번호를 못 찾겠다고 재설정하면 남의 서비스가 멈춘다.
 *
 *   public 에 마이그레이션
 *     → 한결 테이블 26개가 블로그 앱 테이블 19개와 같은 자리에 섞인다.
 *       이름이 안 겹치는 건 지금 우연이고, 다음 마이그레이션에서는 모른다.
 *
 * 그래서 전용 역할과 전용 스키마를 만든다. postgres 는 손대지 않는다.
 *
 * ── DB 비밀번호를 찾지 않는 방법 ────────────────────────
 *
 * Supabase 의 DB 비밀번호는 만들 때 한 번 보여 주고 저장하지 않는다.
 * 그런데 `supabase db query --linked` 는 Postgres 에 직접 붙지 않는다 —
 * Management API 를 지난다. 액세스 토큰만 있으면 SQL 이 돈다.
 * 그 권한으로 새 역할을 만들고, 그 역할의 비밀번호는 우리가 정한다.
 * postgres 의 비밀번호는 여전히 아무도 모르는 채로 둔다. 그래도 된다.
 */

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REF = 'wyhlifnsuwnkuzoirrop';
const ROLE = 'hangyeol';
const SCHEMA = 'hangyeol';

const admin = process.argv.find((a) => a.startsWith('--admin='))?.slice('--admin='.length).trim();
const toVercel = process.argv.includes('--vercel');

/*
 * URL 에 그대로 들어갈 수 있는 글자만 쓴다.
 *
 * base64 를 쓰면 +, /, = 가 섞여 연결 문자열에서 사고가 난다.
 * db-connect 가 encodeURIComponent 로 감싸긴 하지만 로그·대시보드에
 * 이상하게 찍히는 자리가 남는다. 애초에 안전한 글자만 뽑는 쪽이 낫다.
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

/** SQL 은 파일로 넘긴다. 인자로 주면 비밀번호가 프로세스 목록에 잠깐 뜬다. */
function runSql(sql) {
  const dir = mkdtempSync(join(tmpdir(), 'hg-'));
  const file = join(dir, 'q.sql');
  try {
    writeFileSync(file, sql, { mode: 0o600 });
    return sb(['db', 'query', '--linked', '--project-ref', REF, '-f', file], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// 1. 로그인 확인. 여기서 걸리면 나머지는 전부 무의미하다.
try {
  sb(['projects', 'list', '--output', 'json'], { stdio: ['ignore', 'pipe', 'ignore'] });
} catch {
  console.error('Supabase 에 로그인돼 있지 않습니다.');
  console.error('  일반 터미널에서: npx.cmd supabase login');
  console.error('Claude Code 안에서는 브라우저가 안 열립니다.');
  process.exit(1);
}

console.log(`[1/3] ${SCHEMA} 스키마 · ${ROLE} 역할`);

const pw = makePassword();

/*
 * citext 를 hangyeol 스키마 안에 만든다.
 *
 * Prisma 가 붙을 때 search_path 는 hangyeol 하나뿐이다(연결 문자열의 schema).
 * citext 가 extensions 스키마에 있으면 타입 이름이 안 풀린다.
 * 마이그레이션 첫 줄의 CREATE EXTENSION IF NOT EXISTS 는 그때 no-op 이 된다.
 *
 * 스키마 소유권은 넘기지 않는다. Management API 가 쓰는 역할이 hangyeol 의
 * 멤버가 아니라서 owner 를 못 준다(42501 must be able to SET ROLE).
 * 어차피 필요도 없다 — CREATE 권한만 있으면 테이블을 만들 수 있고,
 * 만든 테이블의 주인은 만든 역할이 된다. 나중에 고치고 지우는 데 문제없다.
 *
 * 이 역할은 public 에도 sisibibi 에도 아무 권한이 없다. 그게 요점이다.
 */
runSql(`
create schema if not exists ${SCHEMA};
create extension if not exists citext schema ${SCHEMA};

do $$
begin
  if not exists (select 1 from pg_roles where rolname = '${ROLE}') then
    execute format('create role ${ROLE} login password %L', '${pw}');
  else
    execute format('alter role ${ROLE} login password %L', '${pw}');
  end if;
end
$$;

grant usage, create on schema ${SCHEMA} to ${ROLE};
alter role ${ROLE} set search_path = ${SCHEMA};

-- 풀러(Supavisor)를 지나려면 이 역할도 붙을 수 있어야 한다
grant connect on database postgres to ${ROLE};
`);

console.log(`  완료 — postgres 비밀번호는 그대로입니다`);

console.log('\n[2/3] 연결 · 마이그레이션');

const args = [pw, `--user=${ROLE}`, `--schema=${SCHEMA}`];
if (admin) args.push(`--admin=${admin}`);
if (toVercel) args.push('--vercel');

execFileSync('node', ['tools/db-connect.mjs', ...args], { stdio: 'inherit' });

console.log('\n[3/3] 다음');
console.log('  강사 승인:  node tools/admin-approve.mjs <이메일>');
console.log('  대기 목록:  node tools/admin-approve.mjs --list');
if (toVercel) console.log('\nVercel 은 다음 배포부터 적용됩니다.');
