#!/usr/bin/env node
/*
 * 라이선스 게이트 — 08번 문서 §6, 09번 문서 L5.
 *
 * "외부 콘텐츠를 복제하지 않는다. 자체 제작 또는 라이선스 확보분만 사용."
 *
 * 이 검사가 존재하는 이유는 조사 과정에서 실제로 함정을 밟을 뻔했기 때문이다.
 * Piper 저장소 헤더는 MIT 인데 한국어 음성은 KSS(CC BY-NC-SA) 로 학습됐다.
 * 코드 라이선스만 보고 "무료"라고 판단하면 상업 제품에서 위반이 된다.
 *
 * 검사 내용
 *   1. 비상업 자산의 audioKey · storageKey 가 코드에 등장하지 않는가
 *   2. usable 자산의 출처 표시 문구가 비어 있지 않은가
 *   3. 라이선스 재확인 기한이 지나지 않았는가
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const REGISTRY = 'packages/content/src/licenses.ts';
const SCAN_DIRS = ['packages', 'apps', 'tools'];

const registry = readFileSync(REGISTRY, 'utf8');

/** 레지스트리에서 차단 자산의 식별자를 뽑는다. 파서를 만들지 않고 최소한만 읽는다. */
function blockedIds() {
  const ids = [];
  const blocks = registry.split(/\n  \{\n/).slice(1);
  for (const block of blocks) {
    if (!/usage:\s*\n?\s*'blocked/.test(block)) continue;
    const m = block.match(/id:\s*'([^']+)'/);
    if (m) ids.push(m[1]);
  }
  return ids;
}

/** 차단 자산을 실수로 끌어다 쓰면 잡히는 문자열들. */
const FORBIDDEN_MARKERS = [
  { pattern: /piper-voices\/[^'"\s]*\/ko/i, why: 'Piper 한국어 음성은 KSS 기반 CC BY-NC-SA 다' },
  { pattern: /mms-tts-kor/i, why: 'Meta MMS 는 CC-BY-NC-4.0 이다' },
  { pattern: /Kyubyong\/kss/i, why: 'KSS 는 CC BY-NC-SA 4.0 이다' },
  { pattern: /kss[._-]?dataset/i, why: 'KSS 는 비상업 라이선스다' },
];

/** 레지스트리 자신은 이 문자열들을 기록 목적으로 갖고 있어야 한다. */
const EXEMPT_FILES = new Set([REGISTRY.replace(/\//g, '\\'), REGISTRY, 'tools/license-check.mjs', 'tools\\license-check.mjs']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === 'dist') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (['.ts', '.tsx', '.mjs', '.json'].includes(extname(name))) out.push(full);
  }
  return out;
}

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const normalized = file.replace(/\\/g, '/');
    if (EXEMPT_FILES.has(file) || EXEMPT_FILES.has(normalized)) continue;

    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;

      for (const { pattern, why } of FORBIDDEN_MARKERS) {
        if (pattern.test(line)) {
          violations.push(`${normalized}:${i + 1}  ${why}\n    ${trimmed.slice(0, 100)}`);
        }
      }
    });
  }
}

// 출처 표시가 비어 있는 usable 자산이 없는지 본다.
const emptyAttribution = /license:\s*'(CC-BY-4\.0|CC-BY-2\.0-FR|CC-BY-SA-4\.0|MIT|OFL-1\.1|KOGL-1)'[\s\S]{0,400}?attribution:\s*'—'/g;
if (emptyAttribution.test(registry)) {
  violations.push(`${REGISTRY}  출처 표시가 필요한 자산의 attribution 이 비어 있습니다`);
}

// 재확인 기한.
const verified = registry.match(/lastVerified:\s*'(\d{4}-\d{2}-\d{2})'/);
const everyDays = registry.match(/reviewEveryDays:\s*(\d+)/);
if (verified && everyDays) {
  const days = (Date.now() - Date.parse(verified[1])) / 86_400_000;
  if (days > Number(everyDays[1])) {
    violations.push(
      `${REGISTRY}  라이선스 재확인 기한이 ${Math.floor(days - Number(everyDays[1]))}일 지났습니다 ` +
        `(마지막 확인 ${verified[1]}). 원본 페이지를 다시 확인하고 lastVerified 를 갱신하세요.`,
    );
  }
}

if (violations.length > 0) {
  console.error('라이선스 게이트 실패\n');
  for (const v of violations) console.error(`  ${v}\n`);
  console.error('08번 문서 §6: 자체 제작 또는 라이선스 확보분만 사용한다.');
  process.exit(1);
}

console.log(`라이선스 게이트 통과 — 차단 자산 ${blockedIds().length}건이 코드에 없음`);
