import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LICENSES, PHOTO_LIST, PHOTOS, photo } from '@hangyeol/content';

/*
 * 사진은 코드가 아니라 파일이다. 그래서 조용히 깨진다.
 *
 * 경로를 오타 내도 타입 검사는 통과하고, 파일을 지워도 빌드는 성공한다.
 * 랜딩에 구멍이 뚫린 것은 배포 후에나 안다. 여기서 막는다.
 */

const PUBLIC_ROOT = join(process.cwd(), 'apps', 'teacher', 'public');

describe('사진 레지스트리', () => {
  it('등록된 파일이 실제로 저장소에 있다', () => {
    for (const p of PHOTO_LIST) {
      const abs = join(PUBLIC_ROOT, p.src);
      expect(existsSync(abs), `${p.id} — ${p.src} 가 없다`).toBe(true);
    }
  });

  it('파일이 비어 있지 않다', () => {
    for (const p of PHOTO_LIST) {
      expect(statSync(join(PUBLIC_ROOT, p.src)).size, p.id).toBeGreaterThan(1024);
    }
  });

  it('전부 상업 이용이 가능한 라이선스다', () => {
    for (const p of PHOTO_LIST) {
      expect(LICENSES[p.license].commercialUse, p.id).toBe(true);
    }
  });

  it('촬영자와 원본 페이지가 비어 있지 않다', () => {
    for (const p of PHOTO_LIST) {
      expect(p.photographer.trim().length, p.id).toBeGreaterThan(1);
      expect(p.sourceUrl, p.id).toMatch(/^https:\/\//);
    }
  });

  /*
   * alt 는 접근성 항목이면서 동시에 검수 항목이다.
   * 사진을 고른 사람이 무엇을 보여주려 했는지 여기 적히지 않으면
   * 다음 사람이 사진을 바꿀 때 기준이 없다.
   */
  it('alt 와 쓰임새가 문장으로 적혀 있다', () => {
    for (const p of PHOTO_LIST) {
      expect(p.alt.trim().length, `${p.id} alt`).toBeGreaterThan(8);
      expect(p.usedAt.trim().length, `${p.id} usedAt`).toBeGreaterThan(4);
    }
  });

  it('자리를 미리 잡을 수 있게 화소가 적혀 있다', () => {
    for (const p of PHOTO_LIST) {
      expect(p.width, p.id).toBeGreaterThan(0);
      expect(p.height, p.id).toBeGreaterThan(0);
    }
  });

  it('키와 id 가 어긋나지 않는다', () => {
    for (const [key, p] of Object.entries(PHOTOS)) {
      expect(p.id, key).toBe(key);
      expect(photo(p.id)).toBe(p);
    }
  });
});
