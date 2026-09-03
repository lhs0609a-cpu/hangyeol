import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PHOTO_LIST } from '@hangyeol/content';

/*
 * 랜딩 사진이 로그인 게이트에 걸리지 않는지 확인한다.
 *
 * 실제로 한 번 깨뜨렸다. 사진을 붙이고 개발 화면에서는 멀쩡히 보였는데,
 * 로그인하지 않은 방문자에게만 전부 안 떴다 — /photos/*.jpg 가
 * middleware 의 matcher 에 걸려 /login 으로 리다이렉트되고 있었다.
 * 개발 중에는 쿠키가 있어서 보인다. 사람 눈으로는 못 잡는 종류다.
 *
 * middleware 를 불러오지 않고 소스에서 matcher 를 떠서 검사한다.
 * Edge 런타임 모듈을 테스트 환경에 끌고 오는 것보다 이쪽이 얇다.
 */

const SRC = readFileSync('apps/teacher/middleware.ts', 'utf8');

/** config.matcher 에 적힌 패턴을 그대로 꺼낸다. */
function matcher(): RegExp {
  const m = SRC.match(/matcher:\s*\['([^']+)'\]/);
  if (!m) throw new Error('middleware 의 config.matcher 를 찾지 못했다');
  return new RegExp(`^${m[1]}$`);
}

describe('로그인 게이트와 랜딩 사진', () => {
  it('등록된 사진 경로가 게이트에 걸리지 않는다', () => {
    const gate = matcher();
    for (const p of PHOTO_LIST) {
      expect(gate.test(p.src), `${p.src} 가 로그인 게이트에 걸린다`).toBe(false);
    }
  });

  it('보호해야 할 화면은 여전히 게이트에 걸린다', () => {
    const gate = matcher();
    for (const path of ['/today', '/students', '/billing', '/admin/teachers']) {
      expect(gate.test(path), path).toBe(true);
    }
  });

  it('랜딩과 출처 화면은 로그인 없이 열린다', () => {
    // 사진은 랜딩에 뜨고, 촬영자는 출처 화면에 적힌다. 둘 다 공개여야 짝이 맞는다.
    const publicList = SRC.match(/const PUBLIC = \[([^\]]+)\]/);
    expect(publicList).not.toBeNull();
    expect(publicList![1]).toContain("'/'");
    expect(publicList![1]).toContain("'/licenses'");
  });
});
