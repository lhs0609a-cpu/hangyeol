import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * 09번 문서 §4 — 개인정보 동의와 보관기간.
 *
 * DB 는 tuition-state.spec 과 같은 방식으로 흉내 낸다. 여기서 확인하려는 것은
 * 쿼리가 도는지가 아니라 **규칙이 지켜지는지** 다 —
 * 동의 없이 열리지 않는가, 기한 전에 지우지 않는가, 두 번 눌러도 같은가.
 */

const fixture = vi.hoisted(() => ({ db: {} as any }));
vi.mock('../src/guard.js', () => ({ db: () => fixture.db }));

import { CONSENT_VERSION } from '@hangyeol/content';
import { assertConsented, consentState, recordConsent, requestWithdrawal } from '../src/consent.js';
import { runRetentionPurge, withdrawTeacher, WITHDRAW_PURGE_DAYS } from '../src/retention.js';

const NOW = new Date('2026-09-17T00:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

beforeEach(() => {
  fixture.db = {
    student: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), update: vi.fn() },
    teacher: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(fixture.db)),
  };
});

describe('학생 동의 (09번 §4)', () => {
  it('동의 기록이 없으면 학습노트가 열리지 않는다', async () => {
    fixture.db.student.findUnique.mockResolvedValue({ l1Code: 'en', consentAt: null, consentVersion: null, withdrawRequestedAt: null });
    await expect(assertConsented(1n)).rejects.toThrow();
  });

  it('고지가 바뀌면 예전 동의로는 열리지 않는다', async () => {
    fixture.db.student.findUnique.mockResolvedValue({
      l1Code: 'en',
      consentAt: daysAgo(10),
      consentVersion: '2000-01-01',
      withdrawRequestedAt: null,
    });
    await expect(assertConsented(1n)).rejects.toThrow();
  });

  it('현재 판에 동의했으면 통과한다', async () => {
    fixture.db.student.findUnique.mockResolvedValue({
      l1Code: 'en',
      consentAt: daysAgo(1),
      consentVersion: CONSENT_VERSION,
      withdrawRequestedAt: null,
    });
    await expect(assertConsented(1n)).resolves.toBeUndefined();
  });

  it('고지는 학생의 모국어로 나온다. 모르는 언어면 영어다', async () => {
    fixture.db.student.findUnique.mockResolvedValue({ l1Code: 'vi', consentAt: null, consentVersion: null, withdrawRequestedAt: null });
    expect((await consentState(1n)).notice.locale).toBe('vi');

    fixture.db.student.findUnique.mockResolvedValue({ l1Code: 'xx', consentAt: null, consentVersion: null, withdrawRequestedAt: null });
    expect((await consentState(1n)).notice.locale).toBe('en');
  });

  it('동의하면 어느 판에 동의했는지가 함께 남는다', async () => {
    fixture.db.student.findUnique
      .mockResolvedValueOnce({ l1Code: 'ja' })
      .mockResolvedValue({ l1Code: 'ja', consentAt: NOW, consentVersion: CONSENT_VERSION, withdrawRequestedAt: null });

    await recordConsent(1n, NOW);

    expect(fixture.db.student.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          consentAt: NOW,
          consentVersion: CONSENT_VERSION,
          consentLocale: 'ja',
          // 다시 동의했다면 이전 철회 요청은 철회된 것이다.
          withdrawRequestedAt: null,
        }),
      }),
    );
  });
});

describe('철회 요청', () => {
  it('요청을 남기고 강사에게 알린다. 그 자리에서 지우지 않는다', async () => {
    fixture.db.student.findUnique.mockResolvedValue({ id: 1n, teacherId: 7n, name: 'Maria', withdrawRequestedAt: null });

    const result = await requestWithdrawal(1n, NOW);

    expect(result.duplicate).toBe(false);
    expect(fixture.db.student.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: { withdrawRequestedAt: NOW },
    });
    expect(fixture.db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ targetType: 'teacher', targetId: 7n, kind: 'consent_withdrawn' }),
      }),
    );
  });

  it('두 번 눌러도 기한이 미뤄지지 않는다', async () => {
    const first = daysAgo(5);
    fixture.db.student.findUnique.mockResolvedValue({ id: 1n, teacherId: 7n, name: 'Maria', withdrawRequestedAt: first });

    const result = await requestWithdrawal(1n, NOW);

    expect(result).toEqual({ requestedAt: first.toISOString(), duplicate: true });
    expect(fixture.db.student.update).not.toHaveBeenCalled();
  });
});

describe('파기 배치 (보관기간)', () => {
  it('기한이 지난 건만 찾는다 — 30일과 90일', async () => {
    await runRetentionPurge(NOW);

    const [withdrawQuery, departedQuery] = fixture.db.student.findMany.mock.calls.map((c: unknown[]) => c[0]);

    expect(withdrawQuery.where.withdrawRequestedAt.lte).toEqual(daysAgo(WITHDRAW_PURGE_DAYS));
    expect(departedQuery.where.teacher.withdrawnAt.lte).toEqual(daysAgo(90));
  });

  it('학습 이력은 지우고 수업·청구 행은 남긴다', async () => {
    fixture.db.student.findMany.mockResolvedValueOnce([{ id: 42n }]).mockResolvedValue([]);
    const deleted: string[] = [];
    const deleteMany = (name: string) => ({ deleteMany: vi.fn(async () => deleted.push(name)) });

    Object.assign(fixture.db, {
      lessonReportItem: deleteMany('lessonReportItem'),
      vocabCard: deleteMany('vocabCard'),
      studentActivity: deleteMany('studentActivity'),
      levelTest: deleteMany('levelTest'),
      hvptSession: deleteMany('hvptSession'),
      fluencySession: deleteMany('fluencySession'),
      listeningLog: deleteMany('listeningLog'),
      strandWeekly: deleteMany('strandWeekly'),
      learningProgress: deleteMany('learningProgress'),
      assetView: deleteMany('assetView'),
      notification: { ...deleteMany('notification'), create: vi.fn() },
      lessonSchedule: deleteMany('lessonSchedule'),
    });

    const result = await runRetentionPurge(NOW);

    expect(result.withdrawn).toBe(1);
    expect(deleted).toContain('vocabCard');
    expect(deleted).toContain('levelTest');
    // 수업(lessons)과 청구(invoices)는 손대지 않는다 — 05번의 계산 근거이고
    // 09번 §5 L2·L4 가 보관을 요구한다.
    expect(fixture.db.lesson).toBeUndefined();

    const update = fixture.db.student.update.mock.calls[0][0];
    expect(update.data.name).not.toBe('Maria');
    expect(update.data.emailHash.startsWith('purged:')).toBe(true);
    expect(update.data.emailEnc.length).toBe(0);
    // 같은 학생을 다시 찾아 지우지 않도록 요청 표시를 비운다.
    expect(update.data.withdrawRequestedAt).toBeNull();
  });
});

describe('강사 탈퇴', () => {
  it('표시만 하고 즉시 지우지 않는다', async () => {
    fixture.db.teacher.findUnique.mockResolvedValue({ withdrawnAt: null });

    const result = await withdrawTeacher(7n, NOW);

    expect(result.duplicate).toBe(false);
    expect(fixture.db.teacher.update).toHaveBeenCalledWith({
      where: { id: 7n },
      data: { withdrawnAt: NOW },
    });
    expect(fixture.db.student.update).not.toHaveBeenCalled();
  });

  it('두 번 눌러도 기한이 미뤄지지 않는다', async () => {
    const first = daysAgo(40);
    fixture.db.teacher.findUnique.mockResolvedValue({ withdrawnAt: first });

    expect(await withdrawTeacher(7n, NOW)).toEqual({ withdrawnAt: first.toISOString(), duplicate: true });
    expect(fixture.db.teacher.update).not.toHaveBeenCalled();
  });
});
