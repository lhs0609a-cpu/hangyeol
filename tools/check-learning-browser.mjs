import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from './browser-runtime.mjs';
import { FIRST_STEPS } from '../packages/content/dist/first-steps.js';

// Optional isolated browser tooling: npm install --prefix output/browser-check --ignore-scripts playwright
const origin = process.env.LEARNING_BASE_URL ?? 'http://127.0.0.1:3217';
const output = 'output/design-review';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(30000);
page.setDefaultNavigationTimeout(120000);
const errors = [];
const results = [];
page.on('pageerror', (error) => errors.push(error.message));
function assert(condition, message) { if (!condition) throw new Error(message); }
async function visit(path) {
  const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
  assert(response?.ok(), `${path} returned ${response?.status()}`);
  await page.evaluate(() => document.fonts.ready);
}
async function imagesReady() {
  await page.evaluate(async () => {
    for (const img of document.images) img.loading = 'eager';
    await Promise.all([...document.images].map((img) => img.decode()));
  });
}
try {
  await visit('/');
  await imagesReady();
  assert((await page.locator('h1').innerText()).includes('A little Korean.'), 'English home headline');
  await page.screenshot({ path: `${output}/homepage-desktop.png`, fullPage: true });
  await page.screenshot({ path: `${output}/homepage-viewport.png` });
  await page.getByRole('button', { name: 'Reveal the meaning' }).click();
  assert(await page.getByRole('status').isVisible(), 'Interactive workbook preview');
  await page.getByRole('button', { name: '한국어', exact: true }).click();
  await page.getByRole('link', { name: '첫 미션 시작하기' }).click();
  await page.getByRole('heading', { name: '매일, 한국어 한 걸음.' }).waitFor();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.locator('input[value="travel"]').check();
  await page.getByLabel('15 minutes', { exact: true }).check();
  await page.getByRole('button', { name: 'Let’s begin', exact: false }).click();
  await page.locator('#lesson-heading').filter({ hasText: 'Your first coffee' }).waitFor();
  const coffee = FIRST_STEPS.find((lesson) => lesson.id === 'cafe-order');
  for (let i = 0; i < coffee.questions.length; i++) await page.locator(`input[name="question-cafe-order-${i}"]`).nth((coffee.questions[i].answer + 1) % 3).check();
  await page.getByRole('button', { name: 'Check my answers', exact: true }).click();
  assert(await page.getByRole('button', { name: 'Check answers and try speaking to finish' }).isDisabled(), 'Incorrect answers cannot complete mission');
  for (let i = 0; i < coffee.questions.length; i++) await page.locator(`input[name="question-cafe-order-${i}"]`).nth(coffee.questions[i].answer).check();
  await page.getByRole('button', { name: 'Check my answers', exact: true }).click();
  await page.locator('#note-cafe-order').fill('물 한 잔 주세요.');
  await page.getByLabel('I tried the speaking mission aloud. (Self-check)', { exact: true }).check();
  await page.getByRole('button', { name: 'Complete this mission', exact: true }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Mission completed ✓', exact: true }).waitFor();
  assert(await page.locator('#note-cafe-order').inputValue() === '물 한 잔 주세요.', 'Notes persist after reload');
  results.push('Home preview, cross-page language, onboarding, wrong-answer gate, completion, and note persistence passed.');
  console.log(results.at(-1));

  for (const lesson of FIRST_STEPS) {
    await visit(`/learn?lesson=${lesson.id}`);
    await page.locator('#lesson-heading').filter({ hasText: lesson.title.en }).waitFor();
    if (lesson.id === 'cafe-order') continue;
    for (let i = 0; i < lesson.questions.length; i++) await page.locator(`input[name="question-${lesson.id}-${i}"]`).nth(lesson.questions[i].answer).check();
    await page.getByRole('button', { name: 'Check my answers', exact: true }).click();
    await page.getByLabel('I tried the speaking mission aloud. (Self-check)', { exact: true }).check();
    await page.getByRole('button', { name: 'Complete this mission', exact: true }).click();
  }
  await page.reload({ waitUntil: 'networkidle' });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('samat-first-steps-v1')));
  assert(stored.completed.length === FIRST_STEPS.length, 'All missions complete and persist');
  results.push('All 14 missions completed successfully with persistent progress.');
  console.log(results.at(-1));
  await visit('/learn?lesson=first-hangeul');
  await page.getByRole('button', { name: 'ㄴ', exact: true }).click();
  assert(await page.locator('.syllable-result output').innerText() === '나', 'Interactive syllable combination');
  await visit('/learn?lesson=read-a-menu');
  assert(await page.locator('.syllable-result output').innerText() === '물', 'Batchim syllable combination');
  await visit('/learn?lesson=cafe-order');
  await imagesReady();
  await page.screenshot({ path: `${output}/workbook-desktop.png`, fullPage: true });
  await page.screenshot({ path: `${output}/workbook-viewport.png` });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    for (const path of ['/', '/learn?lesson=cafe-order', '/signup', '/login', '/learn/print']) {
      await visit(path);
      await imagesReady();
      const dimensions = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert(dimensions.page <= dimensions.viewport + 1, `Horizontal overflow ${path} at ${width}: ${JSON.stringify(dimensions)}`);
      if (width === 390 && path === '/') await page.screenshot({ path: `${output}/homepage-mobile.png`, fullPage: true });
      if (width === 390 && path.includes('cafe-order')) await page.screenshot({ path: `${output}/workbook-mobile.png`, fullPage: true });
    }
  }
  results.push('No horizontal overflow at 320, 390, 768, and 1440 pixels on home, workbook, signup, login, and print. All images decoded.');
  console.log(results.at(-1));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit('/learn/print');
  await imagesReady();
  await page.pdf({ path: `${output}/samat-first-steps-workbook.pdf`, printBackground: true, preferCSSPageSize: true });
  assert(await page.locator('.print-lesson').count() === 14, 'Complete printable workbook');
  results.push('Complete workbook PDF generated with 14 lessons and answer key.');
  await visit('/today');
  assert(new URL(page.url()).pathname === '/login', 'Teacher pages still require login');
  await visit('/signup');
  await page.route('**/api/auth/signup', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { id: 'browser-review-only' } }) }));
  await page.getByLabel(/이름 \/ Name/).fill('Review Teacher');
  await page.getByLabel(/이메일 \/ Email/).fill('review@example.com');
  await page.getByLabel(/비밀번호 \/ Password/).fill('review-only-password');
  await page.getByRole('button', { name: '신청하기', exact: true }).click();
  await page.getByRole('heading', { name: '신청을 받았어요' }).waitFor();
  results.push('Teacher authorization redirect and signup UI passed with a mocked API; no account created.');

  // An invalid local-only cookie exercises the documented demo fallback; it cannot authenticate API requests.
  await context.addCookies([{ name: 'hg_access', value: 'invalid-browser-review-cookie', url: origin }]);
  await page.setViewportSize({ width: 320, height: 900 });
  await visit('/today');
  await page.getByText('체험용 예시 데이터입니다.', { exact: false }).waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Teacher dashboard fits 320px');
  assert(await page.locator('.teacher-student-row').count() > 0, 'Demo students visible');
  await page.screenshot({ path: `${output}/teacher-dashboard-mobile.png`, fullPage: true });
  await page.evaluate(() => localStorage.setItem('hg_view_mode', 'admin'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#admin-page-select').waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Admin navigation fits mobile');
  await context.clearCookies();
  results.push('Teacher demo dashboard and compact admin navigation fit 320px; no real student data accessed.');

  const blocked = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await blocked.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage disabled', 'QuotaExceededError'); }; });
  const blockedPage = await blocked.newPage();
  await blockedPage.goto(`${origin}/learn?lesson=cafe-order`, { waitUntil: 'networkidle' });
  await blockedPage.getByText('This browser cannot save your progress right now.', { exact: false }).waitFor();
  await blocked.close();
  results.push('Storage-disabled browsers retain usable lessons and receive an explicit save warning.');
  assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ checkedAt: new Date().toISOString(), origin, results, pageErrors: errors }, null, 2));
  console.log('PASS: browser review complete.');
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {});
  await writeFile(`${output}/browser-failure.json`, JSON.stringify({ message: String(error), url: page.url(), results, pageErrors: errors }, null, 2));
  throw error;
} finally { await browser.close(); }
