import { unitByNo } from './curriculum-all.js';
import { planFor } from './lesson-plan.js';
import { FIRST_STEPS, LEARNING_SCENES } from './first-steps.js';

import type { LearningSkill } from './learning-skills.js';
export { SKILLS, SKILL_LABELS, type LearningSkill } from './learning-skills.js';
export const BOOK_STAGES = ['그림으로 시작', '대화와 표현', '함께 연습', '혼자 해 보기'] as const;
export interface BookArtwork { src: string; alt: string }
const art = (name: string, alt: string): BookArtwork => ({ src: `/photos/learning/${name}-v1.webp`, alt });
export const COURSE_ARTWORK = {
  classroom: art('classroom', '책과 글자 카드를 함께 살펴보는 성인 학습자와 선생님'),
  workplace: art('workplace', '일정과 자료를 펼쳐 놓고 회의하는 동료들'),
  health: art('health', '팔의 불편한 곳을 설명하는 환자와 이야기를 듣는 의사'),
  home: art('home', '물이 새는 주방 수도를 가리키며 수리를 상의하는 사람들'),
  culture: art('culture', '도자기 만드는 방법을 배우고 서로의 작품을 살펴보는 사람들'),
  research: art('research', '도서관에서 책과 보고서의 그래프를 비교하는 사람들'),
  environment: art('environment', '공원 지도와 재활용 봉투를 보며 동네 개선을 의논하는 주민들'),
};
export function artworkForUnit(unitNo: number): BookArtwork {
  const u = unitByNo(unitNo);
  if (!u) return COURSE_ARTWORK.classroom;
  const text = `${u.title} ${u.targetVocab.join(' ')}`;
  if (/병원|건강|몸|증상|진료|아프|약국|운동 습관/.test(text)) return COURSE_ARTWORK.health;
  if (/집수리|수도|고장|주거|이사|집안/.test(text)) return COURSE_ARTWORK.home;
  if (/환경|재활용|기후|공원|에너지|지역 사회/.test(text)) return COURSE_ARTWORK.environment;
  if (/문화|예술|취미|작품|관습/.test(text)) return COURSE_ARTWORK.culture;
  if (/자료|통계|근거|논문|기사|연구|출처|그래프|논증|비판|보고서/.test(text)) return COURSE_ARTWORK.research;
  if (/회의|업무|직장|협업|면접|발표|프로젝트|일정|협상/.test(text)) return COURSE_ARTWORK.workplace;
  const key = /교통|지하철|버스|길|역|이동|목적지/.test(text) ? 'transit'
    : /카페|커피|아메리카노/.test(text) ? 'cafe'
    : /식당|음식|먹|요리|밥|맛/.test(text) ? 'restaurant'
    : /시장|가게|가격|쇼핑|돈|구매|제품/.test(text) ? 'market'
    : /하루|일과|어제|시간|주말/.test(text) ? 'routine'
    : /질문|확인|요청|대화/.test(text) ? 'clarification' : null;
  if (key) return { src: LEARNING_SCENES[key].src, alt: LEARNING_SCENES[key].alt.ko };
  return Number(u.levelCode.slice(-1)) >= 4 ? COURSE_ARTWORK.research : COURSE_ARTWORK.classroom;
}
const LEVEL_SUPPORT = [
  { level: 1, label: '짧은 말부터', load: '그림 → 낱말 → 짧은 문장', scaffold: '그림을 가리키고 한 낱말을 들려준 뒤 짧은 문장으로 늘립니다.', extend: '그림 속 사람이나 물건을 바꾸어 한 문장을 더 말해요.', criterion: '익숙한 낱말로 뜻이 통하는 짧은 말을 혼자 합니다.' },
  { level: 2, label: '생활 속 대화', load: '두세 문장과 질문·대답', scaffold: '누가·어디서·무엇을 하는지 먼저 고르고 문장 두 개를 연결합니다.', extend: '시간이나 장소를 바꾸고 상대에게 질문 하나를 해요.', criterion: '생활 상황에 맞게 요청하거나 설명하고 질문에 답합니다.' },
  { level: 3, label: '이유와 경험', load: '상황 → 이유 → 결과', scaffold: '핵심 사건과 이유를 각각 메모한 뒤 목표 표현으로 연결합니다.', extend: '같은 상황에서 다른 선택을 하고 그 이유를 말해요.', criterion: '사건의 순서와 이유를 연결하고 확인 질문에 답합니다.' },
  { level: 4, label: '비교와 설명', load: '요점 → 비교 근거 → 정리', scaffold: '공통점과 차이점을 나누고 청자에게 필요한 요점부터 설명합니다.', extend: '상대의 다른 의견을 듣고 조건이나 대안을 제시해요.', criterion: '비교 기준을 유지하며 설명하고 상대의 의견에 반응합니다.' },
  { level: 5, label: '주장과 근거', load: '주장 → 근거 → 한계', scaffold: '관찰한 사실과 해석을 구별하고 근거가 지지하는 범위만 말합니다.', extend: '반대 사례를 하나 생각하고 주장의 범위를 조정해요.', criterion: '근거와 주장을 연결하고 반론에 맞게 설명을 보완합니다.' },
  { level: 6, label: '논증과 조정', load: '쟁점 → 관점 비교 → 대안·한계', scaffold: '각 입장의 전제를 확인하고 청중에 맞게 표현과 논증 구조를 조정합니다.', extend: '청중이나 조건을 바꾸어 다시 설명하고 남은 불확실성을 말해요.', criterion: '복잡한 내용을 구조화하고 질문·반론을 반영해 발화를 수정합니다.' },
] as const;
export interface StudentBook {
  unitNo: number; title: string; goal: string; level: number; levelLabel: string; load: string;
  words: string[]; forms: string[]; model: string[]; tasks: string[];
  images: { artwork: BookArtwork; title: string; prompt: string }[];
  practice: { title: string; prompt: string; hint: string }[];
  extension: string; canDo: string; review: { unitNo: number; title: string }[];
  example: string;
}
function studentModel(unitNo: number): string[] {
  if (unitNo === 70) return ['한국어를 배우면서 기억에 남는 일이 있어요?', '처음에는 주문하기가 어려웠어요. 친구와 연습한 후에 혼자 카페에 가 봤어요. 아직 모르는 말이 있지만, 다시 말해 달라고 부탁할 수 있어요.'];
  const plan = planFor(unitNo);
  const dialogue = plan?.modelDialogue?.filter(line => !/^\s*\(/.test(line));
  if (dialogue?.length) return dialogue;
  const quoted = plan?.blocks.find(b => b.phase === 'model')?.say
    .filter(line => /^\s*—/.test(line)).map(line => line.replace(/^\s*—\s*/, ''));
  if (quoted?.length) return quoted;
  const first = FIRST_STEPS.find(step => step.teacherUnit === unitNo);
  if (first) return first.dialogue.map(line => line.ko);
  if (plan?.modelExample) return [plan.modelExample];
  // Goals and teacher instructions must never become a student's model dialogue.
  return [];
}
export function buildStudentBook(unitNo: number): StudentBook | null {
  const unit = unitByNo(unitNo), plan = planFor(unitNo);
  if (!unit || !plan) return null;
  const level = Number(unit.levelCode.slice(-1));
  const support = LEVEL_SUPPORT[level - 1]!;
  const model = studentModel(unitNo);
  const example = plan.modelExample ?? model.at(-1) ?? unit.targetVocab.join(' · ');
  const artwork = artworkForUnit(unitNo);
  const transferArt = level >= 4 ? COURSE_ARTWORK.workplace : { src: LEARNING_SCENES.friends.src, alt: LEARNING_SCENES.friends.alt.ko };
  return {
    unitNo, title: unit.title, goal: unit.goalStatement, level, levelLabel: support.label, load: support.load,
    words: unit.targetVocab, forms: unit.targetForms, model, example,
    tasks: plan.exitTicket.map(task => task.replace(/^\((.*)\)$/, '$1')),
    images: [
      { artwork, title: '관찰해요', prompt: level <= 2 ? '누가 보여요? 아는 말을 찾아요.' : '보이는 사실과 짐작한 내용을 나누어 말해요.' },
      { artwork: { src: LEARNING_SCENES.clarification.src, alt: LEARNING_SCENES.clarification.alt.ko }, title: '서로 확인해요', prompt: `“${unit.title}”에 대해 모르는 것을 질문해요.` },
      { artwork: transferArt, title: '새 상황으로', prompt: support.extend },
    ],
    practice: [
      { title: '뜻을 연결해요', prompt: `“${unit.targetVocab[0] ?? unit.title}”의 뜻을 그림, 동작 또는 쉬운 말로 나타내요.`, hint: '그림에 없는 낱말은 다른 예를 들어도 좋아요.' },
      { title: '바꾸어 말해요', prompt: `“${example}”에서 내용 하나를 바꾸어 말해요.`, hint: unitNo === 1 ? 'ㅁ + ㅏ = 마. 자음이나 모음을 하나 바꿔요.' : `쓸 수 있는 말: ${unit.targetVocab.join(' · ')}. 뜻이 맞는지 다시 확인해요.` },
      { title: '대화를 이어요', prompt: model[0] ?? '오늘 배운 말로 선생님에게 질문해요.', hint: level <= 2 ? '한 단어나 짧은 문장부터 대답해도 좋아요.' : '핵심 내용을 먼저 말하고 이유나 예를 덧붙여요.' },
    ],
    extension: support.extend, canDo: support.criterion,
    review: unit.recycleFrom.map(n => unitByNo(n)).filter(u => !!u).map(u => ({ unitNo: u.unitNo, title: u.title })),
  };
}
export interface TeachingProbe {
  skill: LearningSkill; title: string; stage: number; ask: string; expected: string;
  signal: string; distinguish: string; reinforce: string[]; retest: string;
}
export interface TeacherGuide { unitNo: number; scaffold: string; probes: TeachingProbe[]; stages: { title: string; say: string; do: string; success: string }[]; pitfalls: string[] }
export function buildTeacherGuide(unitNo: number): TeacherGuide | null {
  const book = buildStudentBook(unitNo), plan = planFor(unitNo);
  if (!book || !plan) return null;
  const support = LEVEL_SUPPORT[book.level - 1]!;
  const word = book.words[0] ?? book.title, form = book.forms[0] ?? (unitNo === 1 ? '자음과 모음 조합' : '이미 배운 표현');
  const probes: TeachingProbe[] = [
    { skill: 'reading', title: '글자를 못 읽는지, 뜻이 어려운지', stage: 1,
      ask: `“${book.level === 1 ? word : book.example}”을 소리 내어 읽어 주세요.`, expected: '글자와 소리를 연결해 읽습니다. 억양 차이만으로 오답 처리하지 않습니다.',
      signal: '글자마다 오래 멈추거나 다른 음절로 읽는다.', distinguish: '교사가 읽어 주면 뜻을 아는지 따로 확인합니다. 읽기와 이해를 분리해 기록합니다.',
      reinforce: ['멈춘 음절 하나만 표시하고 교사가 소리를 한 번 들려줍니다.', '학생이 짧은 덩어리로 읽은 뒤 문장 전체를 다시 읽습니다.'], retest: `같은 글자가 들어간 다른 낱말을 제시하고 도움 없이 읽는지 확인합니다. “${word}” 암기 여부만 보지 않습니다.` },
    { skill: 'meaning', title: '어휘 뜻을 알고 쓰는지', stage: 0,
      ask: `“${word}”을 그림이나 동작, 쉬운 말로 설명해 주세요.`, expected: '뜻에 맞는 대상이나 상황을 선택하고 예를 듭니다.',
      signal: '따라 읽지만 뜻을 묻거나 예를 바꾸면 멈춘다.', distinguish: '말로 설명하기 어려우면 가리키기나 모국어 확인도 허용해 표현력과 어휘 이해를 구별합니다.',
      reinforce: [`“${word}”에 해당하는 예와 해당하지 않는 예를 하나씩 대비합니다.`, '교사가 설명을 마친 뒤 학생이 자기 예를 하나 고르게 합니다.'], retest: `새 상황에서도 “${word}”을 쓸 수 있는지 고르고 이유를 확인합니다.` },
    { skill: 'listening', title: '소리로 들었을 때 이해하는지', stage: 1,
      ask: `학생 화면의 대화를 가린 뒤 “${book.model[0] ?? word}”를 읽고 핵심 뜻이나 알맞은 반응을 요청하세요.`, expected: '문장을 보지 않고 질문의 의도에 맞게 반응합니다.',
      signal: '글을 보면 대답하지만 소리로만 들으면 다른 답을 한다.', distinguish: '단어 뜻 확인 → 짧게 끊어 듣기 → 자연스러운 속도로 듣기를 비교합니다.',
      reinforce: ['핵심어를 먼저 한 번 들려주고 짧은 문장으로 돌아옵니다.', '같은 말을 한 번 더 들려준 뒤 학생이 이해한 뜻을 확인합니다.'], retest: '핵심어는 같고 내용 하나가 다른 질문을 글 없이 들려주어 반응을 확인합니다.' },
    { skill: 'form', title: '뜻과 문장 형태를 연결하는지', stage: 2,
      ask: `“${book.example}”을 보고 내용 하나를 바꾸되 “${form}”의 뜻을 유지해 주세요.`, expected: `“${form}”을 새 내용에 맞게 사용합니다.`,
      signal: '예문은 따라 하지만 낱말을 바꾸면 형태나 의미 관계가 무너진다.', distinguish: '뜻을 먼저 확인하고 낱말만 바꾸게 하여 어휘 부족과 형태 선택의 어려움을 나눕니다.',
      reinforce: [`예문에서 “${form}”과 바꿀 부분을 따로 표시합니다.`, '선택지 두 개 → 문장 빈칸 → 도움 없는 문장 순서로 지원을 줄입니다.'], retest: `새 낱말로 “${form}”을 쓴 문장을 만들고 무슨 뜻인지 확인합니다.` },
    { skill: 'speaking', title: '예문 없이 꺼내 말할 수 있는지', stage: 3,
      ask: `예문을 가리고 다음 활동을 요청하세요: ${book.tasks[0] ?? book.goal}`, expected: support.criterion,
      signal: '읽거나 따라 할 때는 가능하지만 혼자 시작하지 못한다.', distinguish: '준비 시간을 준 뒤 핵심어만 제시해 재확인합니다. 침묵만으로 모른다고 단정하지 않습니다.',
      reinforce: [support.scaffold, '같은 상황을 한 번 더 연습한 뒤 핵심어 도움을 없앱니다.'], retest: book.extension },
    { skill: 'interaction', title: book.level <= 2 ? '상대 질문을 듣고 이어가는지' : '이유·근거와 상대 반응을 연결하는지', stage: 3,
      ask: book.level <= 2 ? '답한 뒤 “다시 말해 주세요” 또는 질문 하나로 대화를 이어 주세요.' : `“${book.title}”에 대한 답을 듣고 이유·예외·다른 입장 중 하나를 질문하세요.`, expected: book.level <= 2 ? '관련 있는 답변이나 확인 요청으로 한 차례 더 대화합니다.' : '질문에 맞는 근거를 보태거나 설명을 수정합니다.',
      signal: '준비한 말은 하지만 되묻거나 조건을 바꾸면 같은 답만 반복한다.', distinguish: '질문의 뜻을 먼저 확인합니다. 내용 지식 부족이면 가상 상황을 제공한 뒤 언어 수행을 봅니다.',
      reinforce: [book.level <= 2 ? '교사가 짧게 묻고 학생이 답한 뒤 역할을 바꿉니다.' : '주장·이유·예를 각각 한 줄로 놓고 연결이 맞는지 살펴봅니다.', '학생의 답을 요약해서 확인하고 학생이 질문 하나를 만들게 합니다.'], retest: book.level <= 2 ? '다른 질문으로 대화를 한 번 더 이어 갑니다.' : '반대 의견이나 새로운 조건 하나를 주고 답을 수정하도록 요청합니다.' },
  ];
  return { unitNo, scaffold: support.scaffold, probes, pitfalls: plan.teacherPitfalls,
    stages: [
      { title: BOOK_STAGES[0], say: `그림을 보세요. 오늘은 “${book.title}”를 연습해요. 아는 말부터 말해 볼까요?`, do: '그림에서 직접 보이는 것과 짐작을 구별합니다. 그림에 없는 목표 어휘는 동작이나 다른 예로 확인합니다.', success: '아는 낱말과 새로 확인할 낱말을 구분합니다.' },
      { title: BOOK_STAGES[1], say: book.model[0] ?? `“${word}”을 함께 읽어 볼까요?`, do: '듣기 확인 때는 학생 화면의 대화를 가립니다. 읽기·어휘·듣기를 별개로 확인합니다.', success: '교사가 한 말의 뜻에 맞게 반응합니다.' },
      { title: BOOK_STAGES[2], say: `“${book.example}”에서 내용 하나만 바꿔 볼까요?`, do: support.scaffold, success: `새 내용으로 “${form}”을 사용합니다.` },
      { title: BOOK_STAGES[3], say: book.tasks[0] ?? book.goal, do: '예문과 힌트를 가리고 준비 시간을 줍니다. 한 번의 성공과 다른 상황으로의 전이를 구별해 기록합니다.', success: support.criterion },
    ],
  };
}
