import type { ClassroomPhrase, ClassroomBucket } from './classroom-english.js';

/*
 * 교실 영어 — 2차 분량. 08번 문서 §10 의 250문장을 채우기 위한 나머지다.
 *
 * 1차(classroom-english.ts)와 합쳐 250문장이 된다.
 * 파일을 나눈 이유는 검수 단위를 나누기 위해서다 —
 * 한국어교원이 한 번에 250개를 보는 것보다 묶음으로 보는 편이 낫다.
 *
 * ※ AI 초안. 검수 전에는 실제 트레이닝에 쓰지 않는다.
 */

let n = 200;
const p = (bucket: ClassroomBucket, situation: string, en: string, ko: string): ClassroomPhrase => ({
  id: (n += 1),
  bucket,
  en,
  ko,
  situation,
});

/** [1] 학생이 하는 말 — 나머지. */
const STUDENT_SAYS_2: ClassroomPhrase[] = [
  p('student_says', '발음 질문', 'Am I pronouncing this right?', '발음 맞아요?'),
  p('student_says', '발음 질문', 'Where does my tongue go?', '혀를 어디에 둬요?'),
  p('student_says', '발음 질문', 'These two sound the same to me.', '두 개가 똑같이 들려요'),
  p('student_says', '발음 질문', 'Can you say it slowly, syllable by syllable?', '한 글자씩 천천히요'),
  p('student_says', '발음 질문', 'Is my accent bad?', '제 억양 이상해요?'),
  p('student_says', '발음 질문', 'Why does it sound different here?', '여기서는 왜 다르게 들려요?'),

  p('student_says', '어려움 호소', 'This is too hard.', '너무 어려워요'),
  p('student_says', '어려움 호소', 'I forgot everything from last week.', '지난주 거 다 잊었어요'),
  p('student_says', '어려움 호소', 'I keep making the same mistake.', '계속 같은 실수를 해요'),
  p('student_says', '어려움 호소', 'I understand but I cannot speak.', '이해는 되는데 말이 안 나와요'),
  p('student_says', '어려움 호소', 'I need more practice.', '연습이 더 필요해요'),
  p('student_says', '어려움 호소', 'Particles are confusing.', '조사가 헷갈려요'),

  p('student_says', '문화 질문', 'Is this rude in Korea?', '한국에서 무례해요?'),
  p('student_says', '문화 질문', 'What do people usually say here?', '보통 뭐라고 해요?'),
  p('student_says', '문화 질문', 'How old do I have to be to use this?', '몇 살부터 이렇게 말해요?'),
  p('student_says', '문화 질문', 'Do Koreans really say this?', '한국 사람들 진짜 이렇게 말해요?'),
  p('student_says', '문화 질문', 'Is this from a drama?', '드라마에 나온 말이에요?'),

  p('student_says', '확인', 'So it means ___, right?', '그럼 ___이라는 뜻이죠?'),
  p('student_says', '확인', 'Like this?', '이렇게요?'),
  p('student_says', '확인', 'Did I say it correctly?', '맞게 말했어요?'),
  p('student_says', '확인', 'Same as before?', '아까랑 같아요?'),
  p('student_says', '확인', 'Let me try one more time.', '한 번 더 해 볼게요'),

  p('student_says', '수업 요청', 'Can we talk more and study less?', '공부보다 대화를 더 하고 싶어요'),
  p('student_says', '수업 요청', 'I want to focus on speaking.', '말하기에 집중하고 싶어요'),
  p('student_says', '수업 요청', 'Can you correct me every time?', '매번 고쳐 주세요'),
  p('student_says', '수업 요청', 'Please do not correct me too much.', '너무 많이 고치지 말아 주세요'),
  p('student_says', '수업 요청', 'Can we use only Korean today?', '오늘은 한국어만 써요'),
  p('student_says', '수업 요청', 'Can you write the notes for me?', '정리해 주세요'),

  p('student_says', '개인 사정', 'I have to leave five minutes early.', '5분 일찍 나가야 해요'),
  p('student_says', '개인 사정', 'I was sick last week.', '지난주에 아팠어요'),
  p('student_says', '개인 사정', 'I was busy with work.', '일이 바빴어요'),
  p('student_says', '개인 사정', 'I am tired today.', '오늘 피곤해요'),
  p('student_says', '개인 사정', 'Sorry I am late.', '늦어서 죄송해요'),

  p('student_says', '칭찬·감사', 'Thank you, that helped a lot.', '많이 도움이 됐어요'),
  p('student_says', '칭찬·감사', 'You explain very clearly.', '설명을 잘해 주세요'),
  p('student_says', '칭찬·감사', 'I enjoy your classes.', '수업이 재미있어요'),
  p('student_says', '칭찬·감사', 'See you next time.', '다음에 봐요'),

  p('student_says', '어휘 확장', 'What is another way to say this?', '다르게 말하면요?'),
  p('student_says', '어휘 확장', 'Is there a shorter way?', '더 짧게 말할 수 있어요?'),
  p('student_says', '어휘 확장', 'What do young people say?', '젊은 사람들은 뭐라고 해요?'),
  p('student_says', '어휘 확장', 'Is this written or spoken Korean?', '문어예요 구어예요?'),
  p('student_says', '어휘 확장', 'Can I use this in a text message?', '문자에 써도 돼요?'),

  p('student_says', '숫자·시간', 'How do I say this number?', '이 숫자 어떻게 읽어요?'),
  p('student_says', '숫자·시간', 'What time is the class?', '수업 몇 시예요?'),
  p('student_says', '숫자·시간', 'How long will this take?', '얼마나 걸려요?'),
  p('student_says', '숫자·시간', 'What is today’s date?', '오늘 며칠이에요?'),
];

/** [2] 강사가 하는 말 — 나머지. */
const TEACHER_SAYS_2: ClassroomPhrase[] = [
  p('teacher_says', '설명 전환', 'Let me explain in English just this once.', '이번만 영어로 설명할게요'),
  p('teacher_says', '설명 전환', 'Back to Korean now.', '이제 다시 한국어로'),
  p('teacher_says', '설명 전환', 'Do you want the short or long explanation?', '짧게 설명할까요 길게 할까요?'),
  p('teacher_says', '설명 전환', 'Do not worry about the grammar name.', '문법 이름은 신경 쓰지 마세요'),
  p('teacher_says', '설명 전환', 'Just remember the pattern.', '패턴만 기억하세요'),

  p('teacher_says', '드릴', 'Ten times, fast.', '열 번, 빠르게'),
  p('teacher_says', '드릴', 'Now change the ending.', '이제 어미를 바꿔 보세요'),
  p('teacher_says', '드릴', 'Same sentence, past tense.', '같은 문장, 과거로'),
  p('teacher_says', '드릴', 'Now make it a question.', '이제 질문으로'),
  p('teacher_says', '드릴', 'Add one more word.', '한 단어만 더'),
  p('teacher_says', '드릴', 'Say it about yourself.', '본인 이야기로 바꿔 보세요'),

  p('teacher_says', '롤플레이', 'I am the customer, you are the staff.', '제가 손님, 학생이 직원이에요'),
  p('teacher_says', '롤플레이', 'Let us switch roles.', '역할을 바꿔요'),
  p('teacher_says', '롤플레이', 'Start when you are ready.', '준비되면 시작하세요'),
  p('teacher_says', '롤플레이', 'Do not stop if you make a mistake.', '틀려도 멈추지 마세요'),
  p('teacher_says', '롤플레이', 'One more round, faster.', '한 번 더, 더 빠르게'),

  p('teacher_says', '발음 지도', 'Watch my mouth.', '제 입을 보세요'),
  p('teacher_says', '발음 지도', 'Hold the paper in front of your mouth.', '입 앞에 종이를 대세요'),
  p('teacher_says', '발음 지도', 'Feel the air.', '바람을 느껴 보세요'),
  p('teacher_says', '발음 지도', 'No air for this one.', '이건 바람이 안 나와요'),
  p('teacher_says', '발음 지도', 'Round your lips.', '입술을 둥글게'),
  p('teacher_says', '발음 지도', 'Stop the sound with your tongue.', '혀로 소리를 멈추세요'),
  p('teacher_says', '발음 지도', 'The batchim connects to the next vowel.', '받침이 다음 모음으로 넘어가요'),

  p('teacher_says', '동기부여', 'You could not say this last month.', '지난달에는 못 하던 말이에요'),
  p('teacher_says', '동기부여', 'Your speaking time went up.', '말하는 시간이 늘었어요'),
  p('teacher_says', '동기부여', 'Mistakes mean you are trying harder sentences.', '실수는 더 어려운 문장을 시도한다는 뜻이에요'),
  p('teacher_says', '동기부여', 'Particles come last. Everyone struggles.', '조사는 마지막에 잡혀요. 다들 그래요'),
  p('teacher_says', '동기부여', 'Fifteen minutes a day beats three hours on Sunday.', '하루 15분이 일요일 3시간보다 낫습니다'),

  p('teacher_says', '숙제', 'Review the cards tomorrow.', '내일 카드를 복습하세요'),
  p('teacher_says', '숙제', 'Listen once, do not study.', '한 번 들으세요. 공부하지 말고요'),
  p('teacher_says', '숙제', 'Record yourself and listen back.', '녹음해서 들어 보세요'),
  p('teacher_says', '숙제', 'Do the 4-3-2 twice this week.', '이번 주에 4·3·2 두 번 하세요'),
  p('teacher_says', '숙제', 'Only the sound training today.', '오늘은 소리 구분만 하세요'),

  p('teacher_says', '진행 관리', 'We have ten minutes left.', '10분 남았어요'),
  p('teacher_says', '진행 관리', 'Let us come back to that next time.', '그건 다음 시간에 해요'),
  p('teacher_says', '진행 관리', 'This is enough for today.', '오늘은 여기까지가 좋겠어요'),
  p('teacher_says', '진행 관리', 'Can you hear me now?', '지금은 들려요?'),
  p('teacher_says', '진행 관리', 'Let us restart the connection.', '다시 접속할게요'),

  p('teacher_says', '체험수업', 'Today we will write your name in Hangul.', '오늘 이름을 한글로 써 볼 거예요'),
  p('teacher_says', '체험수업', 'Hangul is not pictures. It is sound.', '한글은 그림이 아니라 소리예요'),
  p('teacher_says', '체험수업', 'You just wrote your name in Korean.', '방금 한국어로 이름을 썼어요'),
  p('teacher_says', '체험수업', 'What do you want to do in Korean?', '한국어로 뭘 하고 싶어요?'),
];

/** [3] 문법 설명 — 나머지. */
const GRAMMAR_2: ClassroomPhrase[] = [
  p('grammar', '조사', '"에게/한테" is for people. "에" is for places and things.', '에게/한테는 사람, 에는 장소·사물'),
  p('grammar', '조사', '"으로/로" shows means or direction.', '으로/로는 수단·방향'),
  p('grammar', '조사', '"과/와" and "하고" both mean "and" for nouns.', '과/와, 하고 둘 다 "그리고"'),
  p('grammar', '조사', '"부터 ~ 까지" is "from ~ to".', '부터~까지는 "에서 ~ 까지"'),
  p('grammar', '조사', 'Particles get dropped in casual speech.', '편한 말에서는 조사를 생략해요'),

  p('grammar', '어미', '"-네요" shows you just noticed something.', '-네요는 방금 알아챈 느낌'),
  p('grammar', '어미', '"-거든요" gives background the listener does not know.', '-거든요는 상대가 모르는 배경'),
  p('grammar', '어미', '"-잖아요" means "you know this already".', '-잖아요는 "알잖아요"'),
  p('grammar', '어미', '"-(으)ㄴ데/는데" sets up the next sentence.', '-(으)ㄴ데는 뒷말을 위한 배경'),

  p('grammar', '시제', 'Korean present tense also covers habits.', '현재형이 습관도 나타내요'),
  p('grammar', '시제', '"-고 있다" is the ongoing action.', '-고 있다는 진행'),
  p('grammar', '시제', '"-았/었다" can mean a state, not just the past.', '-았/었다가 상태를 뜻하기도 해요'),

  p('grammar', '높임', 'Verb "-시-" raises the person you talk about.', '-시-는 주체를 높여요'),
  p('grammar', '높임', '"습니다" is formal. "-요" is polite but softer.', '습니다는 격식, -요는 부드러운 존대'),
  p('grammar', '높임', 'Age and role decide the level, not closeness alone.', '나이와 관계가 말투를 정해요'),

  p('grammar', '발음', 'ㄱ becomes ㅇ before ㄴ or ㅁ.', 'ㄱ이 ㄴ·ㅁ 앞에서 ㅇ으로 (비음화)'),
  p('grammar', '발음', 'ㄴ becomes ㄹ next to ㄹ.', 'ㄴ이 ㄹ 옆에서 ㄹ로 (유음화)'),
  p('grammar', '발음', 'Only seven consonants can end a syllable.', '받침 소리는 일곱 개뿐'),

  p('grammar', '어순', 'The verb always comes last.', '동사는 항상 마지막'),
  p('grammar', '어순', 'Word order is flexible except the verb.', '동사만 빼면 어순이 자유로워요'),
  p('grammar', '어순', 'Subjects are dropped when obvious.', '뻔한 주어는 생략해요'),
];

/** 250 문장을 채우는 마지막 묶음. */
const CLOSING: ClassroomPhrase[] = [
  p('teacher_says', '수업 마감', 'Let us check the notes together.', '학습 노트 같이 볼게요'),
  p('teacher_says', '수업 마감', 'I put three expressions in your notes.', '표현 세 개를 노트에 넣었어요'),
  p('teacher_says', '수업 마감', 'The review comes tomorrow.', '복습은 내일이에요'),
  p('teacher_says', '수업 마감', 'Same time next week?', '다음 주 같은 시간에요?'),
  p('student_says', '수업 마감', 'Can you send the notes?', '노트 보내 주세요'),
  p('student_says', '수업 마감', 'I will review tonight.', '오늘 밤에 복습할게요'),
  p('student_says', '첫 수업', 'This is my first Korean class.', '한국어 수업 처음이에요'),
  p('student_says', '첫 수업', 'I only know a few words.', '단어 몇 개만 알아요'),
  p('student_says', '첫 수업', 'I learned from dramas.', '드라마로 배웠어요'),
  p('teacher_says', '첫 수업', 'We start from zero. That is fine.', '처음부터 시작해요. 괜찮아요'),
  p('grammar', '기타', 'Counters change with the noun.', '조수사는 명사마다 달라요'),
  p('grammar', '기타', '"있다" covers both existence and possession.', '있다는 존재와 소유를 모두 나타내요'),
];

export const CLASSROOM_ENGLISH_2: ClassroomPhrase[] = [
  ...CLOSING,
  ...STUDENT_SAYS_2,
  ...TEACHER_SAYS_2,
  ...GRAMMAR_2,
];
