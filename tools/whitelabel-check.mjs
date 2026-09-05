#!/usr/bin/env node
/*
 * 화이트라벨 릴리즈 게이트 — 09번 문서 §2.
 *
 * "학생 화면 배포 전 자동 테스트로 검사한다. 하나라도 실패하면 배포 중단."
 *
 * 소스에 브랜드 문자열이 있는지를 본다. 렌더된 HTML 검사는 DB 가 붙은 뒤
 * 실제 서버를 띄워야 하므로 그때 e2e 로 추가한다. 지금은 정적 검사가 방벽이다.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = 'apps/note';

/** 06번 문서 §8 "학생 화면 금지어" + 서비스명. */
const FORBIDDEN = [
  { pattern: /사맛/g, why: '서비스명' },
  { pattern: /samat/gi, why: '서비스명(로마자)' },
  /*
   * 옛 이름도 계속 막는다. 이름이 바뀌었다고 지우면, 낡은 화면을 복사해 온
   * 다음 사람의 붙여넣기가 그대로 통과한다. 막는 데 드는 비용이 0 이다.
   */
  { pattern: /한결/g, why: '옛 서비스명' },
  { pattern: /hangyeol/gi, why: '옛 서비스명(로마자)' },
  { pattern: /\b예약\b/g, why: '예약 기능은 학생 화면에 없다' },
  { pattern: /\b결제\b/g, why: '결제 UI 는 학생 화면에 없다' },
  { pattern: /\b충전\b/g, why: '크레딧 충전은 학생 화면에 없다' },
  { pattern: /\b구독\b/g, why: '구독이라는 말을 학생에게 쓰지 않는다' },
  { pattern: /\b요금\b/g, why: '요금은 강사와의 관계다' },
  { pattern: /강사\s*검색/g, why: '다른 강사 목록·검색은 없다' },
];

/**
 * 모듈 지정자는 검사 대상이 아니다.
 * '@hangyeol/core' 는 번들러가 쓰는 이름일 뿐 학생 화면에 렌더되지 않는다.
 * 여러 줄 import 도 있으므로 라인 단위로 지정자만 지우고 나머지를 검사한다.
 */
const MODULE_SPECIFIER = /(['"])@hangyeol\/[^'"]*\1/g;

/** 빌드 메타데이터. 렌더되지 않으므로 검사하지 않는다. */
const SKIP_FILES = ['package.json', 'tsconfig.json', 'next.config.mjs'];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (SKIP_FILES.includes(name)) continue;
    else if (['.ts', '.tsx', '.css', '.json', '.html'].includes(extname(name))) out.push(full);
  }
  return out;
}

const violations = [];

for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let inBlockComment = false;

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // 코드 주석은 학생에게 렌더되지 않는다. 설명에 금지어를 쓸 수 있어야 한다.
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      return;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      return;
    }
    if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('{/*')) return;

    const scanned = line.replace(MODULE_SPECIFIER, '');

    for (const { pattern, why } of FORBIDDEN) {
      pattern.lastIndex = 0;
      if (pattern.test(scanned)) {
        violations.push(`${file}:${i + 1}  "${pattern.source}" — ${why}\n    ${trimmed.slice(0, 100)}`);
      }
    }
  });
}

if (violations.length > 0) {
  console.error('화이트라벨 게이트 실패 — 학생 화면에 브랜드·금지 요소가 있습니다\n');
  for (const v of violations) console.error(`  ${v}\n`);
  console.error('09번 문서 §2: 하나라도 실패하면 배포하지 않는다.');
  process.exit(1);
}

console.log('화이트라벨 게이트 통과 — 학생 화면에 브랜드 문자열 없음');
