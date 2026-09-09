import { chromium } from './browser-runtime.mjs';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.NOTE_BASE_URL ?? 'http://127.0.0.1:3218';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const output = 'output/design-review';
await mkdir(output, { recursive: true });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
function assert(value, message) { if (!value) throw new Error(message); }
const json = (route, status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
try {
  await page.route('**/api/note/srs/due', (route) => json(route, 200, { items: [{ id: 'review-only-1', term: '커피', glossL1: 'coffee', example: '커피 한 잔 주세요.', audioKey: null }, { id: 'review-only-2', term: '물', glossL1: 'water', example: '물 한 잔 주세요.', audioKey: null }] }));
  let failGrade = true;
  await page.route('**/api/note/srs/*/grade', (route) => json(route, failGrade ? 503 : 200, failGrade ? { error: 'temporary' } : { ok: true }));
  await page.goto(`${origin}/srs`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '뜻 보기 / Reveal meaning' }).click();
  await page.getByRole('button', { name: '보통 / Good', exact: false }).click();
  await page.locator('p[role="alert"]').waitFor();
  assert(await page.getByText('커피', { exact: true }).isVisible(), 'Failed grade must retain the current card');
  failGrade = false;
  await page.getByRole('button', { name: '보통 / Good', exact: false }).click();
  await page.getByText('물', { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/student-review-mobile.png`, fullPage: true });

  for (const routeName of ['vocab', 'progress']) {
    let failLoad = true;
    await page.route(`**/api/note/${routeName}`, (route) => json(route, failLoad ? 503 : 200, routeName === 'vocab' ? { items: [], total: 0 } : { levelCode: 'topik1', currentLessonNo: 1, lessons: 0, weeks: 0, vocab: { total: 0, graduated: 0 }, levelAssignedAt: null }));
    await page.goto(`${origin}/${routeName}`, { waitUntil: 'networkidle' });
    await page.locator('p[role="alert"]').waitFor();
    failLoad = false;
    await page.getByRole('button', { name: '다시 시도 / Retry', exact: true }).click();
    await page.getByRole('heading', { name: routeName === 'vocab' ? '내 단어장 / My words' : '나의 진도 / My progress' }).waitFor();
  }
  for (const path of ['/', '/srs', '/vocab', '/progress']) {
    await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
    assert(!(await page.locator('body').innerText()).match(/samat|사맛|hangyeol|한결/i), 'Private notebook must remain unbranded');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Mobile overflow at ${path}`);
  }
  assert(errors.length === 0, errors.join('; '));
  await writeFile(`${output}/note-browser-results.json`, JSON.stringify({ checkedAt: new Date().toISOString(), tests: ['Failed grade retains current card; retry advances after success', 'Vocabulary and progress load failures show retry and recover', 'Private notebook pages remain unbranded and fit mobile'], pageErrors: errors }, null, 2));
  console.log('PASS: student notebook retry, progress, white-label, and mobile checks. All API responses mocked; no student data accessed.');
} finally { await browser.close(); }
