#!/usr/bin/env node
/*
 * 디자인 게이트 — 06번 문서의 절대 규칙과 §7 접근성 게이트.
 *
 * 이 검사가 생긴 이유: 화면을 20개 만드는 동안 폰트 크기가 20가지로 늘어났다.
 * 명세는 9개 역할만 정했는데 13, 12, 14, 16, 20, 22, 44 가 섞여 있었다.
 * 한두 픽셀은 눈에 안 띄지만 쌓이면 제품이 짜깁기처럼 읽힌다.
 *
 * 사람이 매번 스케일 표를 확인하지 않는다. 기계가 막는다.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const SCAN = ['apps', 'packages/ui/src'];

/** 06번 §2 가 정한 역할. 이 밖의 크기는 쓰지 않는다. */
const ALLOWED_FS = new Set([
  'var(--fs-display)',
  'var(--fs-h1)',
  'var(--fs-h2)',
  'var(--fs-body-lg)',
  'var(--fs-body)',
  'var(--fs-body-sm)',
  'var(--fs-caption)',
  'var(--fs-eyebrow)',
  'inherit',
]);

const CHECKS = [
  {
    id: 'fs-scale',
    // fontSize: 13  ← 숫자로 박은 크기
    pattern: /fontSize:\s*(\d)/g,
    why: '폰트 크기를 숫자로 박았습니다. 06번 §2 의 역할 토큰(var(--fs-*))을 쓰세요',
  },
  {
    id: 'font-size-css',
    pattern: /font-size:\s*\d+(\.\d+)?px/g,
    why: 'CSS 에 폰트 크기를 숫자로 박았습니다. --fs-* 토큰을 쓰세요',
    files: /\.css$/,
  },
  {
    id: 'letter-spacing-positive',
    // 06번 §2: 한국어 본문에 letter-spacing 양수 금지
    pattern: /letterSpacing:\s*'0?\.\d+em'/g,
    why: '한국어 본문에 양수 letter-spacing 을 쓰지 않습니다 (06번 §2). eyebrow 는 클래스로 처리합니다',
  },
  {
    id: 'box-shadow',
    // 06번 §3: 그림자는 한 종류만. 카드에 넣지 않는다
    pattern: /boxShadow:\s*'(?!var\(--shadow-toggle\))/g,
    why: '그림자는 --shadow-toggle 하나만 씁니다 (06번 §3). 구분은 1px 선으로 합니다',
  },
  {
    id: 'raw-hex',
    // 팔레트는 CSS 변수로만. 06번 §1
    pattern: /(?:color|background|borderColor):\s*'#(?!fff\b|ffffff\b)[0-9a-fA-F]{3,8}'/g,
    why: '색을 직접 박았습니다. 06번 §1 의 CSS 변수를 쓰세요',
  },
];

/**
 * 06번 §7 접근성 릴리즈 게이트 중 정적으로 검사 가능한 항목.
 *
 * 대비비와 320px 렌더는 실제 브라우저가 있어야 재므로 e2e 로 미룬다.
 * 여기서는 코드만 보고 알 수 있는 것을 막는다.
 */
const A11Y_CHECKS = [
  {
    id: 'disabled-cursor',
    pattern: /cursor:\s*'not-allowed'/g,
    why: 'disabled 커서를 쓰지 않습니다 (06번 §4.2). 왜 못 누르는지는 라벨이 말해야 합니다',
  },
  {
    id: 'outline-none',
    pattern: /outline:\s*'?none/g,
    why: ':focus-visible 아웃라인을 지우지 않습니다 (06번 §7). 키보드 사용자가 위치를 잃습니다',
  },
  {
    id: 'img-no-alt',
    pattern: /<img(?![^>]*\balt=)/g,
    why: '이미지에 alt 가 없습니다 (06번 §7)',
  },
];

/** 06번 §8 보이스 규칙 — 카피 검사. */
const COPY_CHECKS = [
  {
    id: 'unit-space',
    // 숫자와 단위 사이 공백 없음 (14,900원 / 28일 / 47%)
    pattern: /\d\s+(원|일|명|개|회|분|초|주|월|년|%)/g,
    why: '숫자와 단위 사이에 공백을 넣지 않습니다 (06번 §8)',
  },
  {
    id: 'system-term',
    // 시스템 용어 금지. 사용자가 아는 말로
    pattern: /(사이클|배치 실행|인보이스|페이로드|파라미터|엔드포인트)(?![a-zA-Z])/g,
    why: '시스템 용어를 화면에 쓰지 않습니다 (06번 §8). 사용자가 아는 말로 바꾸세요',
  },
  {
    id: 'apology',
    // 오류는 사과하지 않고 다음 행동을 말한다
    pattern: /(죄송합니다|오류가 발생했습니다)/g,
    why: '오류는 사과하지 않고 다음 행동을 말합니다 (06번 §8)',
  },
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.next', 'dist'].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (['.tsx', '.ts', '.css'].includes(extname(name))) out.push(full);
  }
  return out;
}

/** JSX 안의 한국어 문자열만 뽑는다. 주석과 코드는 검사 대상이 아니다. */
function koreanStrings(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return [];
  return line.match(/'[^']*[가-힣][^']*'|>[^<>{}]*[가-힣][^<>{}]*</g) ?? [];
}

const violations = [];

for (const root of SCAN) {
  for (const file of walk(root)) {
    const normalized = file.replace(/\\/g, '/');
    if (normalized.endsWith('tokens.css')) continue;

    const lines = readFileSync(file, 'utf8').split('\n');
    let inBlockComment = false;

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (inBlockComment) {
        if (trimmed.includes('*/')) inBlockComment = false;
        return;
      }
      if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
        inBlockComment = true;
        return;
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;

      for (const check of [...CHECKS, ...A11Y_CHECKS]) {
        if (check.files && !check.files.test(normalized)) continue;
        check.pattern.lastIndex = 0;
        if (check.pattern.test(line)) {
          violations.push(`${normalized}:${i + 1}  [${check.id}] ${check.why}\n    ${trimmed.slice(0, 90)}`);
        }
      }

      for (const str of koreanStrings(line)) {
        for (const check of COPY_CHECKS) {
          check.pattern.lastIndex = 0;
          if (check.pattern.test(str)) {
            violations.push(`${normalized}:${i + 1}  [${check.id}] ${check.why}\n    ${str.slice(0, 90)}`);
          }
        }
      }
    });
  }
}

/*
 * svg 는 여는 태그가 여러 줄에 걸친다. 줄 단위로 보면 오탐이 난다.
 * 여는 태그 전체를 떠서 확인한다.
 *
 * 장식이면 aria-hidden, 의미가 있으면 aria-label 이어야 한다.
 * 둘 다 없으면 스크린리더가 빈 그래픽을 읽는다.
 */
for (const root of SCAN) {
  for (const file of walk(root)) {
    const normalized = file.replace(/\\/g, '/');
    const text = readFileSync(file, 'utf8');

    for (const m of text.matchAll(/<svg\b[\s\S]*?>/g)) {
      if (/aria-hidden|aria-label/.test(m[0])) continue;
      const lineNo = text.slice(0, m.index).split('\n').length;
      violations.push(
        `${normalized}:${lineNo}  [svg-no-label] 장식이면 aria-hidden, 의미가 있으면 aria-label 을 붙이세요 (06번 §7)`,
      );
    }
  }
}

/*
 * 정의되지 않은 CSS 변수를 쓰고 있지 않은지 확인.
 *
 * 이 검사가 생긴 이유: 랜딩에서 var(--bg) 를 썼는데 그런 토큰이 없었다.
 * 정의 안 된 변수는 오류를 내지 않고 조용히 무시된다 — 마침 body 배경이
 * 같은 색이라 화면상으로도 멀쩡해 보였다. 이런 건 사람이 못 찾는다.
 */
{
  const defined = new Set();
  for (const file of [
    'packages/ui/src/tokens.css',
    'apps/teacher/app/globals.css',
    'apps/note/app/globals.css',
  ]) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue; // 없는 앱은 건너뛴다
    }
    for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:/g)) defined.add(m[1]);
  }

  /*
   * next/font 가 layout.tsx 에서 variable: '--font-sans' 로 주입하는 것들.
   * CSS 파일에는 없지만 실제로 정의된다. 하드코딩하지 않고 layout 에서 읽는다 —
   * 폰트를 바꾸면 검사도 따라와야 한다.
   */
  for (const file of ['apps/teacher/app/layout.tsx', 'apps/note/app/layout.tsx']) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const m of text.matchAll(/variable:\s*'(--[a-z0-9-]+)'/g)) defined.add(m[1]);
  }

  for (const root of SCAN) {
    for (const file of walk(root)) {
      const normalized = file.replace(/\\/g, '/');
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
        if (defined.has(m[1])) continue;
        const lineNo = text.slice(0, m.index).split('\n').length;
        violations.push(
          `${normalized}:${lineNo}  [undefined-token] 정의되지 않은 토큰입니다: var(${m[1]})`,
        );
      }
    }
  }
}

// 허용 목록 밖의 fs 토큰이 없는지 확인.
for (const root of SCAN) {
  for (const file of walk(root)) {
    const normalized = file.replace(/\\/g, '/');
    if (normalized.endsWith('tokens.css')) continue;
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/fontSize:\s*('var\(--fs-[a-z-]+\)')/g)) {
      const value = m[1].slice(1, -1);
      if (!ALLOWED_FS.has(value)) {
        violations.push(`${normalized}  [fs-scale] 스케일에 없는 토큰: ${value}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('디자인 게이트 실패\n');
  for (const v of violations) console.error(`  ${v}\n`);
  console.error('06번 문서의 규칙입니다. 값을 바꾸려면 문서를 먼저 고치세요.');
  process.exit(1);
}

console.log('디자인 게이트 통과 — 타입 스케일 · 팔레트 · 그림자 · 접근성 · 카피 규칙 준수');
