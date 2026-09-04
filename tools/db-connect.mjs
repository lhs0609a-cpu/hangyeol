#!/usr/bin/env node
/*
 * Supabase 연결 — 비밀번호 하나만 받아 나머지를 전부 세운다.
 *
 *   node tools/db-connect.mjs '<DB 비밀번호>'          로컬만
 *   node tools/db-connect.mjs '<DB 비밀번호>' --vercel  Vercel 까지
 *   ... --admin=me@example.com                        관리자 주소까지 함께
 *
 * 왜 스크립트인가: 여기서 틀리기 쉬운 것이 네 가지 있고, 전부 조용히 실패한다.
 *
 *   1. db.<ref>.supabase.co 직결 주소는 IPv6 전용이다.
 *      로컬에서도 Vercel 에서도 닿지 않는다. 반드시 풀러를 쓴다.
 *   2. 사용자명이 postgres 가 아니라 postgres.<ref> 다.
 *   3. 앱은 transaction 모드(6543), 마이그레이션은 session 모드(5432)다.
 *      6543 으로 마이그레이션하면 prepared statement 때문에 깨진다.
 *   4. 비밀번호의 특수문자는 URL 인코딩해야 한다. @ 나 : 가 섞이면
 *      호스트를 잘못 읽는데, 그때 나오는 오류가 원인을 가리키지 않는다.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const REF = 'wyhlifnsuwnkuzoirrop';
const HOST = 'aws-1-ap-northeast-2.pooler.supabase.com';

const pw = process.argv[2];
const toVercel = process.argv.includes('--vercel');
const arg = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3).trim();
const adminArg = arg('admin');

/*
 * 이 Supabase 프로젝트는 우리 것만이 아니다.
 *
 * 같은 인스턴스에 다른 제품 둘이 살아 있다 — public 에 블로그 앱,
 * sisibibi 스키마에 또 하나. 그래서 두 가지를 기본으로 두지 않는다.
 *
 *   역할   postgres 를 쓰면 비밀번호를 바꾸는 순간 남의 앱이 죽는다
 *   스키마 public 에 26개를 부으면 남의 테이블과 섞인다
 *
 * 전용 역할과 전용 스키마를 만들어 두고 여기로 붙는다.
 * 만드는 쪽은 tools/supabase-bootstrap.mjs 다.
 */
const user = arg('user') ?? 'postgres';
const schema = arg('schema');

if (!pw || pw.startsWith('--')) {
  console.error("사용법: node tools/db-connect.mjs '<DB 비밀번호>' [--vercel] [--admin=주소]");
  console.error('              [--user=역할] [--schema=스키마]');
  console.error('비밀번호는 Supabase 대시보드 → Settings → Database 에서 확인하거나 재설정합니다.');
  console.error('전용 역할로 붙으려면 tools/supabase-bootstrap.mjs 를 대신 쓰세요.');
  process.exit(1);
}

const enc = encodeURIComponent(pw);
const login = `${user}.${REF}`;

/*
 * Prisma 는 연결 문자열의 schema 파라미터로 search_path 를 정한다.
 * 이게 없으면 마이그레이션이 public 으로 간다 — 남의 자리다.
 */
const qs = schema ? `&schema=${schema}` : '';
const APP = `postgresql://${login}:${enc}@${HOST}:6543/postgres?pgbouncer=true&connection_limit=1${qs}`;
const DIRECT = `postgresql://${login}:${enc}@${HOST}:5432/postgres${schema ? `?schema=${schema}` : ''}`;

/** 기존 값을 덮지 않는다. 시크릿을 다시 만들면 이미 발급된 토큰이 전부 죽는다. */
function keepOrMake(existing, key, make) {
  const m = existing.match(new RegExp('^' + key + '="?([^"\\n]*)"?$', 'm'));
  const v = m?.[1];
  return v && !v.includes('change-me') ? v : make();
}

const prev = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const b64 = (n) => randomBytes(n).toString('base64');

const lines = [
  '# 자동 생성 — tools/db-connect.mjs',
  '# 이 파일은 커밋되지 않는다(.gitignore). 비밀번호가 들어 있다.',
  '',
  'NODE_ENV=development',
  // 관리자 이메일은 사람이 직접 넣는다. 자동 생성할 수 없고,
  // 비어 있으면 관리자 화면 전체가 닫힌다 — 열어 두는 쪽으로 실패하지 않는다.
  `ADMIN_EMAILS="${adminArg || keepOrMake(prev, 'ADMIN_EMAILS', () => '')}"`,
  `DATABASE_URL="${APP}"`,
  `DIRECT_URL="${DIRECT}"`,
  '',
  `JWT_ACCESS_SECRET="${keepOrMake(prev, 'JWT_ACCESS_SECRET', () => b64(48))}"`,
  `JWT_REFRESH_SECRET="${keepOrMake(prev, 'JWT_REFRESH_SECRET', () => b64(48))}"`,
  `MAGIC_LINK_SECRET="${keepOrMake(prev, 'MAGIC_LINK_SECRET', () => b64(48))}"`,
  '',
  '# 학생 이메일은 평문으로 저장하지 않는다 (09번 문서)',
  `EMAIL_HASH_PEPPER="${keepOrMake(prev, 'EMAIL_HASH_PEPPER', () => b64(32))}"`,
  `EMAIL_ENC_KEY="base64:${keepOrMake(prev, 'EMAIL_ENC_KEY', () => b64(32)).replace(/^base64:/, '')}"`,
  '',
];

writeFileSync('.env', lines.join('\n'));
console.log('.env 작성 — 기존 시크릿은 그대로 두었습니다');

const env = { ...process.env, DATABASE_URL: APP, DIRECT_URL: DIRECT };
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', shell: true, env });

// citext 확장은 마이그레이션 SQL 첫 줄에 들어 있다. 따로 실행하지 않는다.
console.log('\n[1/2] 마이그레이션');
run('npx', ['prisma', 'migrate', 'deploy', '--schema', 'packages/db/prisma/schema.prisma']);

console.log('\n[2/2] 클라이언트 생성');
run('npx', ['prisma', 'generate', '--schema', 'packages/db/prisma/schema.prisma']);

if (toVercel) {
  console.log('\nVercel 환경변수 등록');

  const vars = readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')];
    });

  for (const [k, v] of vars) {
    // NODE_ENV 는 Vercel 이 직접 정한다. 덮으면 빌드가 깨진다.
    if (k === 'NODE_ENV') continue;

    for (const target of ['production', 'preview', 'development']) {
      // vercel env 에는 갱신 명령이 없다. 지우고 다시 넣는다.
      try {
        execFileSync('npx', ['vercel', 'env', 'rm', k, target, '--yes'], {
          stdio: 'ignore',
          shell: true,
        });
      } catch {
        // 없으면 지울 것도 없다.
      }
      execFileSync('npx', ['vercel', 'env', 'add', k, target], {
        input: v,
        stdio: ['pipe', 'ignore', 'ignore'],
        shell: true,
      });
    }
    console.log(`  ${k}`);
  }

  console.log('\n등록 완료. 다음 배포부터 적용됩니다.');
}

console.log('\n연결 완료.');
if (!toVercel) console.log('Vercel 에도 넣으려면 뒤에 --vercel 을 붙여 다시 실행하세요.');

/*
 * 빈 ADMIN_EMAILS 를 조용히 넘기지 않는다.
 *
 * 비어 있으면 requireAdmin 이 전부 거부한다(guard.ts). 열어 두는 쪽으로
 * 실패하지 않는 건 맞지만, 그러면 강사 승인 화면에 아무도 못 들어간다.
 * 여기서 말해 주지 않으면 나중에 "관리자 화면이 열리지 않는다" 로만 나타난다.
 */
if (!/^ADMIN_EMAILS="[^"]+"$/m.test(readFileSync('.env', 'utf8'))) {
  console.log('\n[주의] ADMIN_EMAILS 가 비어 있습니다. 강사 승인 화면이 열리지 않습니다.');
  console.log('  --admin=주소 를 붙여 다시 실행하거나 .env 에 직접 적으세요.');
}
