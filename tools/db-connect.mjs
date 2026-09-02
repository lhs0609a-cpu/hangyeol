#!/usr/bin/env node
/*
 * Supabase 연결 — 비밀번호 하나만 받아 나머지를 전부 세운다.
 *
 *   node tools/db-connect.mjs '<DB 비밀번호>'          로컬만
 *   node tools/db-connect.mjs '<DB 비밀번호>' --vercel  Vercel 까지
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

if (!pw || pw.startsWith('--')) {
  console.error("사용법: node tools/db-connect.mjs '<DB 비밀번호>' [--vercel]");
  console.error('비밀번호는 Supabase 대시보드 → Settings → Database 에서 확인하거나 재설정합니다.');
  process.exit(1);
}

const enc = encodeURIComponent(pw);
const user = `postgres.${REF}`;
const APP = `postgresql://${user}:${enc}@${HOST}:6543/postgres?pgbouncer=true&connection_limit=1`;
const DIRECT = `postgresql://${user}:${enc}@${HOST}:5432/postgres`;

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
