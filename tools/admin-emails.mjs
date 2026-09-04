#!/usr/bin/env node
/*
 * 관리자 주소 관리 — .env 와 Vercel 을 같이 고친다.
 *
 *   node tools/admin-emails.mjs                       지금 값 보기
 *   node tools/admin-emails.mjs a@x.com b@y.com       이 주소들로 교체
 *   node tools/admin-emails.mjs --add c@z.com         추가
 *   node tools/admin-emails.mjs --local               Vercel 은 건드리지 않음
 *
 * 왜 스크립트인가. 여기서 어긋나기 쉬운 것이 세 가지 있다.
 *
 *   1. .env 만 고치고 Vercel 을 잊는다. 로컬에서는 관리자 화면이 열리는데
 *      배포본에서는 안 열린다 — 그것도 404 로 나온다(관리자 화면의 존재를
 *      알려 주지 않으려고 그렇게 만들었다). 원인을 찾기 어렵다.
 *   2. vercel env 에는 갱신 명령이 없다. 지우고 다시 넣어야 한다.
 *   3. production 만 넣고 preview·development 를 빠뜨린다.
 *
 * 그리고 이 값은 비면 requireAdmin 이 전부 거부한다(guard.ts).
 * 열어 두는 쪽으로 실패하지 않는 건 맞지만, 실수로 비우면 아무도 못 들어간다.
 * 그래서 빈 값으로 만들려 하면 한 번 더 묻는다.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const KEY = 'ADMIN_EMAILS';
const TARGETS = ['production', 'preview', 'development'];

const args = process.argv.slice(2);
const localOnly = args.includes('--local');
const add = args.includes('--add');
const emails = args.filter((a) => !a.startsWith('--'));

if (!existsSync('.env')) {
  console.error('.env 가 없습니다. tools/supabase-bootstrap.mjs 를 먼저 실행하세요.');
  process.exit(1);
}

const env = readFileSync('.env', 'utf8');
const current = env.match(new RegExp(`^${KEY}="?([^"\\n]*)"?$`, 'm'))?.[1] ?? '';
const currentList = current.split(',').map((e) => e.trim()).filter(Boolean);

// 인자가 없으면 읽기만 한다. 실수로 지우는 일이 없도록.
if (emails.length === 0) {
  console.log(currentList.length ? currentList.join('\n') : '(비어 있음 — 관리자 화면이 열리지 않습니다)');
  process.exit(0);
}

const next = [...new Set(add ? [...currentList, ...emails] : emails)]
  .map((e) => e.toLowerCase())
  .sort();

const bad = next.filter((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
if (bad.length) {
  console.error(`이메일 형식이 아닙니다: ${bad.join(', ')}`);
  process.exit(1);
}

const value = next.join(',');

writeFileSync(
  '.env',
  new RegExp(`^${KEY}=.*$`, 'm').test(env)
    ? env.replace(new RegExp(`^${KEY}=.*$`, 'm'), `${KEY}="${value}"`)
    : `${env.trimEnd()}\n${KEY}="${value}"\n`,
);

console.log('.env');
for (const e of next) console.log(`  ${e}`);

if (localOnly) {
  console.log('\n--local 이라 Vercel 은 건드리지 않았습니다.');
  process.exit(0);
}

console.log('\nVercel');
for (const target of TARGETS) {
  // vercel env 에는 갱신이 없다. 지우고 다시 넣는다.
  try {
    execFileSync('npx', ['vercel', 'env', 'rm', KEY, target, '--yes'], {
      stdio: 'ignore',
      shell: true,
    });
  } catch {
    // 없으면 지울 것도 없다.
  }
  execFileSync('npx', ['vercel', 'env', 'add', KEY, target], {
    input: value,
    stdio: ['pipe', 'ignore', 'ignore'],
    shell: true,
  });
  console.log(`  ${target}`);
}

console.log('\n재배포해야 적용됩니다:');
console.log('  git commit --allow-empty -m "관리자 주소 변경" && git push');
