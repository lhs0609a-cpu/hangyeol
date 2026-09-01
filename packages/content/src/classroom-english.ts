/*
 * 교실 영어 250문장 — 08번 문서 §10.
 *
 * 목적은 영어를 가르치는 게 아니다. "영어 못해서 못 한다"가 강사의 가장 큰
 * 진입 차단 요인이므로, 수업에서 실제로 오가는 문장만 외우게 한다.
 * 하루 20분 × 2주면 끝나는 분량으로 잡았다.
 *
 * ※ 이 파일은 AI 초안이다. 08번 문서가 지정한 대로 한국어교원 검수를 거쳐야 한다.
 *   검수 전에는 seed 에서 draft: true 로 들어간다.
 */

export type ClassroomBucket = 'student_says' | 'teacher_says' | 'grammar';

export interface ClassroomPhrase {
  id: number;
  bucket: ClassroomBucket;
  en: string;
  ko: string;
  /** 언제 쓰는 말인지. 상황별 카드로 묶는 기준. */
  situation: string;
}

let n = 0;
const p = (bucket: ClassroomBucket, situation: string, en: string, ko: string): ClassroomPhrase => ({
  id: (n += 1),
  bucket,
  en,
  ko,
  situation,
});

/** [1] 학생이 하는 말 — 알아듣기만 하면 된다 (120개). */
const STUDENT_SAYS: ClassroomPhrase[] = [
  // 되묻기
  p('student_says', '되묻기', 'Can you say that again?', '다시 말해 주시겠어요?'),
  p('student_says', '되묻기', 'Sorry, one more time?', '죄송해요, 한 번 더요?'),
  p('student_says', '되묻기', 'Could you repeat that slowly?', '천천히 다시 말해 주세요'),
  p('student_says', '되묻기', 'I missed that.', '못 들었어요'),
  p('student_says', '되묻기', 'What was the last word?', '마지막 단어가 뭐였어요?'),
  p('student_says', '되묻기', 'Say it one more time, please.', '한 번만 더 말해 주세요'),
  p('student_says', '되묻기', 'I didn’t catch that.', '못 알아들었어요'),
  p('student_says', '되묻기', 'Again, please.', '다시요'),
  p('student_says', '되묻기', 'Slower, please.', '더 천천히요'),
  p('student_says', '되묻기', 'Can you speak up a little?', '조금 크게 말해 주세요'),

  // 뜻 묻기
  p('student_says', '뜻 묻기', 'What does ___ mean?', '___이/가 무슨 뜻이에요?'),
  p('student_says', '뜻 묻기', 'How do you say ___ in Korean?', '___은/는 한국어로 뭐예요?'),
  p('student_says', '뜻 묻기', 'What’s the difference between these two?', '이 둘의 차이가 뭐예요?'),
  p('student_says', '뜻 묻기', 'Is this the same as ___?', '이거 ___하고 같아요?'),
  p('student_says', '뜻 묻기', 'Can you give me an example?', '예문 하나 주세요'),
  p('student_says', '뜻 묻기', 'Is that a verb or a noun?', '동사예요 명사예요?'),
  p('student_says', '뜻 묻기', 'What’s the opposite?', '반대말이 뭐예요?'),
  p('student_says', '뜻 묻기', 'Does this word have another meaning?', '다른 뜻도 있어요?'),
  p('student_says', '뜻 묻기', 'Is this word common?', '이 단어 자주 써요?'),
  p('student_says', '뜻 묻기', 'When do people use this?', '언제 써요?'),

  // 쓰기·읽기
  p('student_says', '쓰기·읽기', 'How do you spell that?', '어떻게 써요?'),
  p('student_says', '쓰기·읽기', 'Can you write it in the chat?', '채팅창에 써 주세요'),
  p('student_says', '쓰기·읽기', 'How do you read this?', '이건 어떻게 읽어요?'),
  p('student_says', '쓰기·읽기', 'Is my handwriting okay?', '제 글씨 괜찮아요?'),
  p('student_says', '쓰기·읽기', 'Which syllable is stressed?', '어디를 강하게 읽어요?'),
  p('student_says', '쓰기·읽기', 'Can you type that?', '타이핑해 주세요'),
  p('student_says', '쓰기·읽기', 'Did I write it correctly?', '맞게 썼어요?'),
  p('student_says', '쓰기·읽기', 'What’s this character?', '이 글자 뭐예요?'),

  // 격식
  p('student_says', '격식', 'Is this formal or casual?', '이거 존댓말이에요 반말이에요?'),
  p('student_says', '격식', 'Can I say this to my boss?', '상사한테 써도 돼요?'),
  p('student_says', '격식', 'Is this too polite?', '너무 격식 차린 거예요?'),
  p('student_says', '격식', 'How do I say this to a friend?', '친구한테는 어떻게 말해요?'),
  p('student_says', '격식', 'Is this rude?', '이거 무례해요?'),
  p('student_says', '격식', 'Do young people say this?', '젊은 사람들도 이렇게 말해요?'),

  // 기술 문제
  p('student_says', '기술 문제', 'My internet is bad.', '인터넷이 안 좋아요'),
  p('student_says', '기술 문제', 'I can’t hear you.', '안 들려요'),
  p('student_says', '기술 문제', 'You’re breaking up.', '소리가 끊겨요'),
  p('student_says', '기술 문제', 'Can you turn on your camera?', '카메라 켜 주세요'),
  p('student_says', '기술 문제', 'Let me restart the call.', '다시 접속할게요'),
  p('student_says', '기술 문제', 'Can you hear me now?', '지금은 들려요?'),
  p('student_says', '기술 문제', 'The screen is frozen.', '화면이 멈췄어요'),
  p('student_says', '기술 문제', 'Sorry, I was muted.', '음소거였어요'),

  // 진행 요청
  p('student_says', '진행 요청', 'Can we do that again?', '한 번 더 해요'),
  p('student_says', '진행 요청', 'Can we move on?', '넘어가도 돼요?'),
  p('student_says', '진행 요청', 'I need a minute.', '잠깐만요'),
  p('student_says', '진행 요청', 'Let me think.', '생각 좀 할게요'),
  p('student_says', '진행 요청', 'Can we practice speaking more?', '말하기 더 하고 싶어요'),
  p('student_says', '진행 요청', 'Too fast for me.', '저한테 너무 빨라요'),
  p('student_says', '진행 요청', 'Can we review last time?', '지난 시간 복습해요'),
  p('student_says', '진행 요청', 'I want to try again.', '다시 해 볼게요'),

  // 이해 표현
  p('student_says', '이해 표현', 'I understand.', '이해했어요'),
  p('student_says', '이해 표현', 'I don’t understand.', '이해 못 했어요'),
  p('student_says', '이해 표현', 'Now it makes sense.', '이제 알겠어요'),
  p('student_says', '이해 표현', 'I’m confused.', '헷갈려요'),
  p('student_says', '이해 표현', 'Almost got it.', '거의 알겠어요'),
  p('student_says', '이해 표현', 'Can you explain again?', '다시 설명해 주세요'),

  // 숙제·일정
  p('student_says', '숙제·일정', 'What’s the homework?', '숙제가 뭐예요?'),
  p('student_says', '숙제·일정', 'When is the next class?', '다음 수업 언제예요?'),
  p('student_says', '숙제·일정', 'Can we reschedule?', '시간 바꿀 수 있어요?'),
  p('student_says', '숙제·일정', 'I finished the homework.', '숙제 다 했어요'),
  p('student_says', '숙제·일정', 'I couldn’t finish it.', '다 못 했어요'),
  p('student_says', '숙제·일정', 'Can I send it later?', '나중에 보내도 돼요?'),

  // 학습 목표
  p('student_says', '학습 목표', 'I want to watch dramas without subtitles.', '자막 없이 드라마 보고 싶어요'),
  p('student_says', '학습 목표', 'I’m preparing for TOPIK.', '토픽 준비하고 있어요'),
  p('student_says', '학습 목표', 'I’m going to Korea next year.', '내년에 한국 가요'),
  p('student_says', '학습 목표', 'I need Korean for work.', '일 때문에 한국어가 필요해요'),
  p('student_says', '학습 목표', 'I want to talk with my in-laws.', '시댁 식구들과 이야기하고 싶어요'),
  p('student_says', '학습 목표', 'I just want to speak more.', '그냥 더 말하고 싶어요'),
];

/** [2] 강사가 하는 말 — 반사적으로 나와야 한다 (100개). */
const TEACHER_SAYS: ClassroomPhrase[] = [
  // 수업 시작
  p('teacher_says', '수업 시작', 'Good to see you.', '반가워요'),
  p('teacher_says', '수업 시작', 'How was your week?', '이번 주 어땠어요?'),
  p('teacher_says', '수업 시작', 'Let’s start with a review.', '복습부터 할게요'),
  p('teacher_says', '수업 시작', 'Did you do the homework?', '숙제 했어요?'),
  p('teacher_says', '수업 시작', 'Today we’ll learn ___.', '오늘은 ___을/를 배워요'),
  p('teacher_says', '수업 시작', 'Can you hear me okay?', '잘 들려요?'),

  // 지시
  p('teacher_says', '지시', 'Repeat after me.', '따라 하세요'),
  p('teacher_says', '지시', 'Say it out loud.', '소리 내서 말해 보세요'),
  p('teacher_says', '지시', 'One more time.', '한 번 더'),
  p('teacher_says', '지시', 'Let’s practice this five times.', '다섯 번 연습해요'),
  p('teacher_says', '지시', 'Your turn.', '이제 차례예요'),
  p('teacher_says', '지시', 'Make a sentence with this.', '이걸로 문장 만들어 보세요'),
  p('teacher_says', '지시', 'Answer in Korean, please.', '한국어로 대답해 주세요'),
  p('teacher_says', '지시', 'Don’t read — look at me.', '읽지 말고 저를 보세요'),
  p('teacher_says', '지시', 'Try without looking.', '안 보고 해 보세요'),
  p('teacher_says', '지시', 'Use the new expression.', '새 표현을 써 보세요'),
  p('teacher_says', '지시', 'Tell me about your weekend.', '주말 이야기 해 주세요'),
  p('teacher_says', '지시', 'Change it to past tense.', '과거로 바꿔 보세요'),

  // 피드백 — 긍정
  p('teacher_says', '피드백', 'Almost! Close.', '거의 맞았어요'),
  p('teacher_says', '피드백', 'That’s right.', '맞아요'),
  p('teacher_says', '피드백', 'Much better.', '훨씬 좋아요'),
  p('teacher_says', '피드백', 'Your pronunciation improved.', '발음이 좋아졌어요'),
  p('teacher_says', '피드백', 'Natural. Very natural.', '자연스러워요'),
  p('teacher_says', '피드백', 'You said that without thinking. That’s the goal.', '생각 안 하고 말했어요. 그게 목표예요'),

  // 피드백 — 교정
  p('teacher_says', '교정', 'Small correction.', '조금만 고칠게요'),
  p('teacher_says', '교정', 'We say ___ instead.', '___(이)라고 말해요'),
  p('teacher_says', '교정', 'The particle should be ___.', '조사는 ___이에요'),
  p('teacher_says', '교정', 'Listen to the difference.', '차이를 들어 보세요'),
  p('teacher_says', '교정', 'Your mouth is too wide here.', '입을 너무 벌렸어요'),
  p('teacher_says', '교정', 'Don’t worry, that’s a common mistake.', '괜찮아요, 흔한 실수예요'),

  // 침묵 견디기 — 08번 §10 M2 의 핵심
  p('teacher_says', '기다리기', 'Take your time.', '천천히 하세요'),
  p('teacher_says', '기다리기', 'I’ll wait.', '기다릴게요'),
  p('teacher_says', '기다리기', 'No rush.', '급할 것 없어요'),
  p('teacher_says', '기다리기', 'Think in Korean, not English.', '영어 말고 한국어로 생각해 보세요'),
  p('teacher_says', '기다리기', 'You know this one.', '아는 거예요'),

  // 수업 마무리
  p('teacher_says', '마무리', 'Let’s stop here today.', '오늘은 여기까지 할게요'),
  p('teacher_says', '마무리', 'Three new expressions today.', '오늘 새 표현 세 개예요'),
  p('teacher_says', '마무리', 'Review them tomorrow.', '내일 복습하세요'),
  p('teacher_says', '마무리', 'I’ll send it to your notes.', '학습 노트로 보낼게요'),
  p('teacher_says', '마무리', 'See you next week.', '다음 주에 봐요'),
  p('teacher_says', '마무리', 'Great work today.', '오늘 잘했어요'),
];

/** [3] 문법 설명 — 학생 최다 질문 대응 (30개). */
const GRAMMAR: ClassroomPhrase[] = [
  p('grammar', '조사', '"은/는" is about the topic. "이/가" is about the subject.', '은/는은 화제, 이/가는 주어'),
  p('grammar', '조사', 'Use "을/를" for the thing you act on.', '을/를은 동작의 대상'),
  p('grammar', '조사', '"에" is a place you go. "에서" is a place you do something.', '에는 도착점, 에서는 행동 장소'),
  p('grammar', '조사', '"도" means "also". It replaces 은/는/이/가.', '도는 "역시". 은/는·이/가를 대신해요'),
  p('grammar', '조사', '"만" means "only".', '만은 "오직"'),
  p('grammar', '높임', 'Add "-요" to make it polite.', '-요를 붙이면 존댓말'),
  p('grammar', '높임', '"-(으)세요" is polite when you ask someone to do something.', '-(으)세요는 정중한 요청'),
  p('grammar', '높임', 'Drop "-요" with close friends only.', '-요는 친한 사이에서만 뺀다'),
  p('grammar', '시제', 'Add "-았/었-" for the past.', '-았/었-이 과거'),
  p('grammar', '시제', '"-(으)ㄹ 거예요" is the future or a plan.', '-(으)ㄹ 거예요는 미래·계획'),
  p('grammar', '부정', '"안" goes before the verb. "못" means you cannot.', '안은 부정, 못은 불가능'),
  p('grammar', '연결', '"-고" connects two actions.', '-고는 나열'),
  p('grammar', '연결', '"-아/어서" gives a reason.', '-아/어서는 이유'),
  p('grammar', '연결', '"-지만" means "but".', '-지만은 "그러나"'),
  p('grammar', '희망', '"-고 싶어요" means "I want to".', '-고 싶어요는 희망'),
  p('grammar', '요청', '"-아/어 주세요" is asking for a favor.', '-아/어 주세요는 부탁'),
  p('grammar', '수', 'Korean has two number systems: 하나-둘 and 일-이.', '고유어 수사와 한자어 수사가 있어요'),
  p('grammar', '수', 'Use 하나-둘 for counting things, 일-이 for dates and money.', '개수는 고유어, 날짜·돈은 한자어'),
  p('grammar', '발음', 'The final consonant links to the next vowel.', '받침이 다음 모음으로 넘어가요 (연음)'),
  p('grammar', '발음', 'Korean has three-way stops: ㄱ ㅋ ㄲ.', '평음·격음·경음 세 갈래'),
];

export const CLASSROOM_ENGLISH: ClassroomPhrase[] = [...STUDENT_SAYS, ...TEACHER_SAYS, ...GRAMMAR];

/** 08번 문서가 요구한 분량. 초안 단계에서 얼마나 채웠는지 드러낸다. */
export const CLASSROOM_ENGLISH_TARGET = 250;

export const CLASSROOM_ENGLISH_STATUS = {
  drafted: CLASSROOM_ENGLISH.length,
  target: CLASSROOM_ENGLISH_TARGET,
  reviewed: 0,
  note: 'AI 초안. 08번 문서 §9 에 따라 한국어교원 자격 2급 검수 필요',
} as const;
