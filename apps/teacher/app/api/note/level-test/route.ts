import type { TestState } from '@hangyeol/content';
import {
  answerQuestion,
  handle,
  readJson,
  requireStudentSession,
  saveLevelResult,
  startTest,
} from '@hangyeol/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/note/level-test — 첫 문항. */
export function GET(req: Request) {
  return handle(async () => {
    await requireStudentSession(req);
    return startTest();
  });
}

interface Body {
  state: TestState;
  questionId?: string;
  choiceIndex?: number;
  finish?: boolean;
}

/**
 * POST /api/note/level-test
 *
 * 상태를 매 요청에 실어 보낸다. 학생이 창을 닫아도 세션이 새지 않는다.
 * 대신 채점은 서버가 한다 — 클라이언트는 어느 선택지를 골랐는지만 보낸다.
 */
export function POST(req: Request) {
  return handle(async () => {
    const claims = await requireStudentSession(req);
    const body = await readJson<Body>(req);

    if (body.finish) {
      return saveLevelResult(BigInt(claims.studentId), body.state);
    }

    if (!body.questionId || body.choiceIndex === undefined) {
      throw new Error('questionId 와 choiceIndex 가 필요합니다');
    }

    return answerQuestion(body.state, body.questionId, body.choiceIndex);
  });
}
