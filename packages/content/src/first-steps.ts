/** Public, independently usable beginner workbook. Times are suggested practice lengths, not proficiency promises. */
export type LearningScene = 'hero' | 'cafe' | 'restaurant' | 'transit' | 'market' | 'friends' | 'clarification' | 'routine';
export interface Bilingual { en: string; ko: string }
export interface KoreanPhrase { ko: string; en: string; roman: string }
export interface PracticeQuestion { prompt: Bilingual; options: string[]; answer: number; explanation: Bilingual }
export interface FirstStep {
  id: string;
  title: Bilingual;
  goal: Bilingual;
  scene: LearningScene;
  minutes: number;
  words: KoreanPhrase[];
  phrases: KoreanPhrase[];
  dialogue: (KoreanPhrase & { speaker: string })[];
  pattern: { form: string; explanation: Bilingual; example: string };
  culture: Bilingual;
  mission: Bilingual;
  sample: string;
  questions: PracticeQuestion[];
  review: string[];
  teacherUnit: number;
}

const bi = (en: string, ko: string): Bilingual => ({ en, ko });
const p = (ko: string, en: string, roman: string): KoreanPhrase => ({ ko, en, roman });
const q = (en: string, ko: string, options: string[], answer: number, explanationEn: string, explanationKo: string): PracticeQuestion => ({ prompt: bi(en, ko), options, answer, explanation: bi(explanationEn, explanationKo) });
const d = (speaker: string, ko: string, en: string, roman: string) => ({ speaker, ...p(ko, en, roman) });

export const LEARNING_SCENES: Record<LearningScene, { src: string; alt: Bilingual }> = {
  clarification: { src: '/photos/learning/clarification-v1.webp', alt: bi('A learner cups an ear and asks a conversation partner to repeat slowly.', '귀에 손을 대고 대화 상대에게 천천히 다시 말해 달라고 부탁하는 학습자') },
  routine: { src: '/photos/learning/routine-v1.webp', alt: bi('The same person enjoys breakfast, reads in the afternoon, and walks in the evening.', '아침을 먹고 오후에 책을 읽고 저녁에 산책하는 한 사람의 일과') },
  hero: { src: '/photos/learning/seoul-v1.webp', alt: bi('Three friends exploring a leafy Seoul neighborhood.', '초록빛 서울 골목을 함께 걷는 세 친구') },
  cafe: { src: '/photos/learning/cafe-v1.webp', alt: bi('A visitor orders an iced coffee from a barista.', '바리스타에게 아이스커피를 주문하는 손님') },
  restaurant: { src: '/photos/learning/restaurant-v1.webp', alt: bi('Friends order a meal with bibimbap and gimbap at a Korean restaurant.', '비빔밥과 김밥이 놓인 식당에서 주문하는 친구들') },
  transit: { src: '/photos/learning/transit-v1.webp', alt: bi('A traveler asks an attendant for directions at a subway station.', '지하철역 직원에게 길을 묻는 여행자') },
  market: { src: '/photos/learning/market-v1.webp', alt: bi('A shopper buys tangerines at a neighborhood shop.', '동네 가게에서 귤을 사는 손님') },
  friends: { src: '/photos/learning/friends-v1.webp', alt: bi('Friends and a tutor talk together over tea and a notebook.', '차와 노트를 앞에 두고 대화하는 친구들과 선생님') },
};

export const FIRST_STEPS: readonly FirstStep[] = [
  {
    id: 'first-hangeul', title: bi('Meet your first Korean letters', '첫 한글 읽기'),
    goal: bi('Build and read 가, 나, 마 and 아.', '가·나·마·아를 조합하고 읽어요.'), scene: 'friends', minutes: 10, teacherUnit: 1,
    words: [p('ㄱ', 'g/k sound', 'g/k'), p('ㄴ', 'n sound', 'n'), p('ㅁ', 'm sound', 'm'), p('ㅏ', 'a vowel', 'a')],
    phrases: [p('가', 'ㄱ + ㅏ', 'ga'), p('나', 'ㄴ + ㅏ', 'na'), p('마', 'ㅁ + ㅏ', 'ma'), p('아', 'ㅇ + ㅏ', 'a')],
    dialogue: [d('Tutor', '가, 나, 마.', 'Read one block at a time: ga, na, ma.', 'ga, na, ma'), d('You', '가, 나, 마.', 'Repeat the three syllables.', 'ga, na, ma')],
    pattern: { form: 'ㄱ + ㅏ → 가', explanation: bi('Korean letters form syllable blocks. With the vertical vowel ㅏ, put the consonant on the left. At the start of a syllable, ㅇ is silent: 아 = a.', '한글은 자음과 모음을 음절 단위로 모아요. 세로 모음 ㅏ의 왼쪽에 자음을 놓아요. 첫소리의 ㅇ은 소리가 나지 않아요.'), example: 'ㄴ + ㅏ → 나 · ㅁ + ㅏ → 마' },
    culture: bi('Romanization is a temporary reading aid. It cannot represent Korean pronunciation exactly. Read the blocks and ask your tutor to model the sounds.', '로마자는 임시 읽기 도움말이에요. 정확한 발음은 한글을 보며 선생님의 소리를 듣고 연습해요.'),
    mission: bi('Cover the reading hints. Read 가, 나, 마, 아 in a different order, then write each once.', '읽기 도움말을 가리고 가·나·마·아를 순서를 바꿔 읽은 뒤 한 번씩 써 보세요.'), sample: '마 → 가 → 아 → 나',
    questions: [q('Which block is ㄴ + ㅏ?', 'ㄴ과 ㅏ를 합치면?', ['가', '나', '마'], 1, 'ㄴ gives the n sound and ㅏ gives a: 나.', 'ㄴ과 ㅏ가 만나 나가 돼요.'), q('Which syllable starts with a silent ㅇ?', '첫소리 ㅇ이 소리 나지 않는 글자는?', ['마', '가', '아'], 2, 'Initial ㅇ holds the consonant position without adding a sound.', '아의 ㅇ은 자음 자리를 채우고 소리는 나지 않아요.')], review: [],
  },
  {
    id: 'read-a-menu', title: bi('Read a little menu', '메뉴 속 한글'),
    goal: bi('Recognize 우유, 오이 and 물, and notice a final consonant.', '우유·오이·물을 읽고 받침을 알아봐요.'), scene: 'cafe', minutes: 10, teacherUnit: 1,
    words: [p('ㅗ', 'o vowel', 'o'), p('ㅜ', 'u vowel', 'u'), p('ㅣ', 'i vowel', 'i'), p('ㄹ', 'r/l sound', 'r/l')],
    phrases: [p('우유', 'milk', 'uyu'), p('오이', 'cucumber', 'oi'), p('물', 'water', 'mul')],
    dialogue: [d('Tutor', '우유.', 'Milk.', 'uyu'), d('You', '우유.', 'Milk.', 'uyu'), d('Tutor', '물.', 'Water.', 'mul'), d('You', '물.', 'Water.', 'mul')],
    pattern: { form: 'ㅁ + ㅜ + ㄹ → 물', explanation: bi('A horizontal vowel sits below the first consonant. A final consonant, called batchim, sits at the bottom. Learn ㅠ as yu in 우유.', '가로 모음은 첫 자음 아래에 놓아요. 마지막 자음인 받침은 맨 아래에 와요. 우유의 ㅠ도 함께 읽어요.'), example: 'ㅇ + ㅗ → 오 · ㅇ + ㅜ → 우 · ㅇ + ㅣ → 이' },
    culture: bi('A word can contain several syllable blocks. 우유 has two blocks, while 물 has one. You do not need to learn every letter today.', '우유는 두 음절, 물은 한 음절이에요. 오늘 모든 글자를 외우지 않아도 괜찮아요.'),
    mission: bi('Write 우유 and 물 on paper. Point to the drink you would like and read its name.', '종이에 우유와 물을 쓰고 원하는 음료를 가리키며 읽어 보세요.'), sample: '우유 · 물',
    questions: [q('Which word means water?', '물을 뜻하는 단어는?', ['우유', '오이', '물'], 2, '물 means water. Its final ㄹ is at the bottom.', '물은 water예요. 받침 ㄹ은 아래에 있어요.'), q('How many syllable blocks are in 우유?', '우유는 몇 음절인가요?', ['1', '2', '3'], 1, '우 + 유: two blocks.', '우와 유, 두 음절이에요.')], review: ['first-hangeul'],
  },
  {
    id: 'say-hello', title: bi('Turn a hello into a conversation', '인사하고 이름 말하기'),
    goal: bi('Greet someone and introduce yourself politely.', '공손하게 인사하고 내 이름을 말해요.'), scene: 'friends', minutes: 10, teacherUnit: 2,
    words: [p('이름', 'name', 'ireum'), p('사람', 'person', 'saram'), p('학생', 'student', 'haksaeng'), p('친구', 'friend', 'chingu')],
    phrases: [p('안녕하세요.', 'Hello.', 'annyeonghaseyo'), p('저는 미나예요.', 'I am Mina.', 'jeoneun minayeyo'), p('반가워요.', 'Nice to meet you.', 'bangawoyo')],
    dialogue: [d('Mina', '안녕하세요. 저는 미나예요.', 'Hello. I am Mina.', 'annyeonghaseyo. jeoneun minayeyo'), d('Jun', '안녕하세요. 저는 준이에요.', 'Hello. I am Jun.', 'annyeonghaseyo. jeoneun junieyo'), d('Mina', '반가워요.', 'Nice to meet you.', 'bangawoyo'), d('Jun', '저도 반가워요.', 'Nice to meet you, too.', 'jeodo bangawoyo')],
    pattern: { form: '이름 + 이에요 / 예요', explanation: bi('After a final consonant, use 이에요: 준이에요. After a vowel, use 예요: 미나예요. Learn 저는 as a ready-to-use way to begin your introduction.', '받침이 있으면 이에요, 없으면 예요를 붙여요. 저는은 자기소개를 시작하는 표현으로 익혀요.'), example: '학생이에요. · 미나예요.' },
    culture: bi('안녕하세요 is a useful polite greeting for adults you have just met. A small nod is enough; you do not need an elaborate bow.', '처음 만나는 어른에게 안녕하세요라고 인사해요. 가볍게 고개를 숙여도 좋아요.'),
    mission: bi('Say hello, introduce yourself with your own name, and say nice to meet you without reading.', '보지 않고 인사, 내 이름, 반가워요까지 이어 말해 보세요.'), sample: '안녕하세요. 저는 미나예요. 반가워요.',
    questions: [q('Complete: 저는 준___.', '저는 준___를 완성하세요.', ['예요', '이에요', '주세요'], 1, '준 ends in the consonant ㄴ, so use 이에요.', '준에는 받침 ㄴ이 있으므로 이에요를 붙여요.'), q('Choose a polite first greeting.', '처음 만날 때 공손한 인사는?', ['물', '안녕하세요.', '얼마예요?'], 1, '안녕하세요 means hello in polite everyday speech.', '안녕하세요는 일상에서 쓰는 공손한 인사예요.')], review: ['first-hangeul'],
  },
  {
    id: 'cafe-order', title: bi('Your first coffee, in Korean', '한국어로 첫 커피 주문'),
    goal: bi('Order one drink and say thank you.', '음료 한 잔을 주문하고 감사 인사를 해요.'), scene: 'cafe', minutes: 10, teacherUnit: 15,
    words: [p('커피', 'coffee', 'keopi'), p('물', 'water', 'mul'), p('한 잔', 'one cup / glass', 'han jan'), p('아이스', 'iced', 'aiseu')],
    phrases: [p('커피 한 잔 주세요.', 'One coffee, please.', 'keopi han jan juseyo'), p('아이스로 주세요.', 'Iced, please.', 'aiseuro juseyo'), p('감사합니다.', 'Thank you.', 'gamsahamnida')],
    dialogue: [d('Barista', '뭐 드릴까요?', 'What can I get you?', 'mwo deurilkkayo'), d('You', '커피 한 잔 주세요.', 'One coffee, please.', 'keopi han jan juseyo'), d('Barista', '따뜻한 걸로 드릴까요?', 'Would you like it hot?', 'ttatteuthan geollo deurilkkayo'), d('You', '아이스로 주세요. 감사합니다.', 'Iced, please. Thank you.', 'aiseuro juseyo. gamsahamnida')],
    pattern: { form: '음료 + 한 잔 + 주세요', explanation: bi('주세요 makes a polite request. 잔 counts cups and glasses. 하나 becomes 한 before a counter: 한 잔. Recognize the barista’s longer lines; you only need to produce your short replies.', '주세요로 공손하게 요청해요. 잔은 컵에 담긴 음료를 세는 말이에요. 하나는 단위 앞에서 한으로 바뀌어요. 직원의 긴 질문은 뜻을 알아듣는 연습만 해도 돼요.'), example: '물 한 잔 주세요. · 커피 두 잔 주세요.' },
    culture: bi('Practice prices and orders here are examples. In a real cafe, check the menu and use pointing together with your words.', '교재의 주문과 가격은 연습용이에요. 실제 카페에서는 메뉴를 확인하고 가리키며 말해도 좋아요.'),
    mission: bi('Look at the illustration. Order one iced coffee, then change the order to one glass of water.', '그림을 보고 아이스커피 한 잔을 주문한 뒤 물 한 잔으로 바꿔 말해 보세요.'), sample: '커피 한 잔 주세요. 아이스로 주세요. / 물 한 잔 주세요.',
    questions: [q('Ask for one glass of water.', '물 한 잔을 부탁하세요.', ['물 한 잔 주세요.', '저는 물이에요.', '물에 가요.'], 0, 'Name the drink, add 한 잔, then 주세요.', '음료 이름 뒤에 한 잔 주세요를 붙여요.'), q('Which reply means iced, please?', '아이스 음료를 요청하는 표현은?', ['반가워요.', '아이스로 주세요.', '없어요.'], 1, '아이스로 주세요 specifies an iced drink.', '아이스로 주세요는 차가운 음료를 요청하는 표현이에요.')], review: ['read-a-menu', 'say-hello'],
  },
  {
    id: 'restaurant-order', title: bi('Find your favorite Korean meal', '좋아하는 한 끼 주문'),
    goal: bi('Order food and ask whether it is spicy.', '음식을 주문하고 매운지 물어봐요.'), scene: 'restaurant', minutes: 10, teacherUnit: 11,
    words: [p('비빔밥', 'bibimbap', 'bibimbap'), p('김밥', 'gimbap', 'gimbap'), p('메뉴', 'menu', 'menyu'), p('맵다', 'to be spicy', 'maepda')],
    phrases: [p('메뉴 주세요.', 'The menu, please.', 'menyu juseyo'), p('이거 매워요?', 'Is this spicy?', 'igeo maewoyo'), p('비빔밥 하나 주세요.', 'One bibimbap, please.', 'bibimbap hana juseyo')],
    dialogue: [d('You', '이거 매워요?', 'Is this spicy?', 'igeo maewoyo'), d('Server', '네, 조금 매워요.', 'Yes, a little spicy.', 'ne, jogeum maewoyo'), d('You', '김밥 하나 주세요.', 'One gimbap, please.', 'gimbap hana juseyo'), d('Server', '네, 알겠습니다.', 'Certainly.', 'ne, algetseumnida')],
    pattern: { form: '이거 + 매워요?', explanation: bi('이거 means this thing. You can point to a menu item and ask 이거 매워요? Learn 매워요 as the spoken form of 맵다.', '이거는 가까운 것을 가리켜요. 메뉴를 가리키며 이거 매워요?라고 물어요. 맵다의 말하기 형태 매워요를 함께 익혀요.'), example: '이거 주세요. · 이거 맛있어요?' },
    culture: bi('Less spicy does not mean allergen-free. If you have an allergy, show a clear written description and confirm ingredients with staff.', '덜 맵다고 알레르기 성분이 없는 것은 아니에요. 알레르기가 있다면 적어 둔 내용을 보여 주고 재료를 확인해요.'),
    mission: bi('Ask about a dish, order it, and request water. Swap customer and server roles with a partner.', '음식에 대해 묻고 주문한 뒤 물도 요청해요. 친구와 손님·직원 역할을 바꿔 보세요.'), sample: '이거 매워요? 김밥 하나 주세요. 물 한 잔 주세요.',
    questions: [q('Ask whether a dish is spicy.', '음식이 매운지 물어보세요.', ['이거 매워요?', '어디예요?', '저는 학생이에요.'], 0, '매워요? asks whether something is spicy.', '매워요?는 매운지 묻는 표현이에요.'), q('Which expression politely requests a menu?', '메뉴를 공손하게 요청하는 표현은?', ['메뉴 없어요.', '메뉴 주세요.', '메뉴예요.'], 1, 'Add 주세요 after the thing you want.', '원하는 것 뒤에 주세요를 붙여요.')], review: ['cafe-order'],
  },
  {
    id: 'shopping', title: bi('Ask the price. Make it two.', '가격 묻고 두 개 사기'),
    goal: bi('Ask a price and request two items.', '가격을 묻고 물건 두 개를 요청해요.'), scene: 'market', minutes: 12, teacherUnit: 24,
    words: [p('얼마', 'how much', 'eolma'), p('원', 'won', 'won'), p('한 개', 'one item', 'han gae'), p('두 개', 'two items', 'du gae')],
    phrases: [p('이거 얼마예요?', 'How much is this?', 'igeo eolmayeyo'), p('두 개 주세요.', 'Two, please.', 'du gae juseyo'), p('카드 돼요?', 'Can I pay by card?', 'kadeu dwaeyo')],
    dialogue: [d('You', '이거 얼마예요?', 'How much is this?', 'igeo eolmayeyo'), d('Shopkeeper', '한 개에 천 원이에요.', 'It is 1,000 won each.', 'han gaee cheon wonieyo'), d('You', '두 개 주세요.', 'Two, please.', 'du gae juseyo'), d('Shopkeeper', '이천 원이에요.', 'That is 2,000 won.', 'icheon wonieyo')],
    pattern: { form: '하나 → 한 개 · 둘 → 두 개', explanation: bi('Use native Korean numbers to count items. Use Sino-Korean numbers for prices: 일 1, 이 2, 삼 3, 천 1,000. 이천 원 is 2,000 won. These prices are practice examples.', '개수는 고유어 수사, 가격은 한자어 수사로 말해요. 일·이·삼, 천을 익혀요. 이천 원은 2,000원이에요. 가격은 연습용 예시예요.'), example: '한 개 · 두 개 · 세 개 / 천 원 · 이천 원 · 삼천 원' },
    culture: bi('Ask before assuming a payment method is accepted. Pointing at an item while asking 이거 얼마예요? is perfectly useful.', '결제 방법은 가게에 확인해요. 물건을 가리키며 이거 얼마예요?라고 물어도 충분해요.'),
    mission: bi('Use two objects as shop items. Ask the price, buy two, and check whether you can pay by card.', '물건 두 개로 가게 놀이를 해요. 가격을 묻고 두 개를 산 뒤 카드 결제가 되는지 물어보세요.'), sample: '이거 얼마예요? 두 개 주세요. 카드 돼요?',
    questions: [q('Which means two items?', '물건 두 개를 뜻하는 표현은?', ['이 개', '둘 개', '두 개'], 2, '둘 changes to 두 before the counter 개.', '둘은 단위 개 앞에서 두로 바뀌어요.'), q('The practice price is 이천 원. How much?', '연습 가격 이천 원은 얼마인가요?', ['1,000원', '2,000원', '3,000원'], 1, '이 is two and 천 is thousand: 2,000.', '이와 천을 합쳐 이천, 2,000이에요.')], review: ['cafe-order', 'restaurant-order'],
  },
  {
    id: 'directions', title: bi('Find your way around', '길을 물어봐요'),
    goal: bi('Ask where a place is and recognize simple directions.', '장소가 어디인지 묻고 간단한 길 안내를 알아들어요.'), scene: 'transit', minutes: 10, teacherUnit: 25,
    words: [p('어디', 'where', 'eodi'), p('화장실', 'restroom', 'hwajangsil'), p('오른쪽', 'right', 'oreunjjok'), p('왼쪽', 'left', 'oenjjok')],
    phrases: [p('화장실 어디예요?', 'Where is the restroom?', 'hwajangsil eodiyeyo'), p('오른쪽이에요.', 'It is on the right.', 'oreunjjogieyo'), p('다시 말해 주세요.', 'Please say that again.', 'dasi malhae juseyo')],
    dialogue: [d('You', '저기요. 화장실 어디예요?', 'Excuse me. Where is the restroom?', 'jeogiyo. hwajangsil eodiyeyo'), d('Attendant', '오른쪽이에요.', 'It is on the right.', 'oreunjjogieyo'), d('You', '오른쪽이요?', 'On the right?', 'oreunjjogiyo'), d('Attendant', '네, 오른쪽이에요.', 'Yes, on the right.', 'ne, oreunjjogieyo')],
    pattern: { form: '장소 + 어디예요?', explanation: bi('Put a place name before 어디예요? to ask its location. Everyday speech often omits a particle when the meaning is clear.', '장소 이름 뒤에 어디예요?를 붙여 위치를 물어요. 일상 대화에서는 뜻이 분명하면 조사를 생략하기도 해요.'), example: '카페 어디예요? · 지하철역 어디예요?' },
    culture: bi('저기요 politely gets someone’s attention. If you did not understand, ask again and repeat the key direction to confirm.', '저기요로 공손하게 말을 걸어요. 못 알아들었다면 다시 요청하고 방향을 되물어 확인해요.'),
    mission: bi('Draw a cafe on the left and a restroom on the right. Ask and answer where each one is.', '왼쪽에 카페, 오른쪽에 화장실을 그려 서로 위치를 묻고 답해 보세요.'), sample: '카페 어디예요? 왼쪽이에요. / 화장실 어디예요? 오른쪽이에요.',
    questions: [q('Ask where the restroom is.', '화장실 위치를 물어보세요.', ['화장실 얼마예요?', '화장실 어디예요?', '화장실 주세요.'], 1, '어디예요? asks where something is.', '어디예요?는 위치를 묻는 표현이에요.'), q('오른쪽 means…', '오른쪽의 뜻은?', ['Left', 'Right', 'Yesterday'], 1, '오른쪽 is right; 왼쪽 is left.', '오른쪽은 right, 왼쪽은 left예요.')], review: ['say-hello', 'shopping'],
  },
  {
    id: 'getting-around', title: bi('Get to your next stop', '다음 장소로 이동'),
    goal: bi('Say where you are going and request help with transport.', '목적지를 말하고 이동에 필요한 도움을 요청해요.'), scene: 'transit', minutes: 10, teacherUnit: 16,
    words: [p('역', 'station', 'yeok'), p('버스', 'bus', 'beoseu'), p('지하철', 'subway', 'jihacheol'), p('가요', 'go / am going', 'gayo')],
    phrases: [p('서울역에 가요.', 'I am going to Seoul Station.', 'seoullyeoge gayo'), p('이 버스 서울역에 가요?', 'Does this bus go to Seoul Station?', 'i beoseu seoullyeoge gayo'), p('여기서 내려요.', 'I get off here.', 'yeogiseo naeryeoyo')],
    dialogue: [d('You', '이 버스 서울역에 가요?', 'Does this bus go to Seoul Station?', 'i beoseu seoullyeoge gayo'), d('Driver', '네, 가요.', 'Yes, it does.', 'ne, gayo'), d('You', '감사합니다.', 'Thank you.', 'gamsahamnida'), d('Driver', '천천히 타세요.', 'Take your time getting on.', 'cheoncheonhi taseyo')],
    pattern: { form: '목적지 + 에 가요', explanation: bi('에 marks the destination with 가요. Raise your intonation to ask a question. The bus conversation is fictional practice, not route information.', '가요 앞의 에는 목적지를 나타내요. 끝을 올려 질문해요. 이 대화는 가상의 연습이며 실제 노선 안내가 아니에요.'), example: '집에 가요. · 카페에 가요.' },
    culture: bi('Check current routes and stop names before traveling. Your Korean question helps you confirm the destination with staff.', '이동 전 실제 노선과 정류장 이름을 확인해요. 배운 질문으로 직원에게 목적지를 다시 확인할 수 있어요.'),
    mission: bi('Choose a destination on a map. Say where you are going, then ask whether a bus goes there.', '지도에서 목적지를 골라 어디에 가는지 말하고 버스가 그곳에 가는지 물어보세요.'), sample: '서울역에 가요. 이 버스 서울역에 가요?',
    questions: [q('Complete: 카페__ 가요.', '카페__ 가요를 완성하세요.', ['에', '를', '개'], 0, 'Use 에 for the destination of going.', '이동하는 목적지에는 에를 붙여요.'), q('Which word means subway?', '지하철을 뜻하는 단어는?', ['버스', '지하철', '메뉴'], 1, '지하철 means subway.', '지하철은 subway예요.')], review: ['directions'],
  },
  {
    id: 'daily-life', title: bi('Talk about your everyday', '나의 하루 이야기'),
    goal: bi('Say what you do and where you do it.', '무엇을 어디에서 하는지 말해요.'), scene: 'routine', minutes: 12, teacherUnit: 5,
    words: [p('먹어요', 'eat', 'meogeoyo'), p('마셔요', 'drink', 'masyeoyo'), p('공부해요', 'study', 'gongbuhaeyo'), p('집', 'home', 'jip')],
    phrases: [p('한국어를 공부해요.', 'I study Korean.', 'hangugeoreul gongbuhaeyo'), p('카페에서 커피를 마셔요.', 'I drink coffee at a cafe.', 'kapeeseo keopireul masyeoyo'), p('집에서 밥을 먹어요.', 'I eat a meal at home.', 'jibeseo babeul meogeoyo')],
    dialogue: [d('Friend', '오늘 뭐 해요?', 'What are you doing today?', 'oneul mwo haeyo'), d('You', '한국어를 공부해요.', 'I am studying Korean.', 'hangugeoreul gongbuhaeyo'), d('Friend', '어디에서 공부해요?', 'Where do you study?', 'eodieseo gongbuhaeyo'), d('You', '카페에서 공부해요.', 'I study at a cafe.', 'kapeeseo gongbuhaeyo')],
    pattern: { form: '장소 + 에서 · 대상 + 을/를 · 동사', explanation: bi('에서 marks where an action happens. 을 follows a final consonant and 를 follows a vowel to mark the object: 밥을, 커피를. Start with one whole sentence, then swap one word.', '에서로 행동하는 장소를 나타내요. 목적어에 받침이 있으면 을, 없으면 를을 붙여요. 문장 하나를 익힌 뒤 단어 하나씩 바꿔요.'), example: '집에서 한국어를 공부해요.' },
    culture: bi('You can leave out “I” when it is obvious who is speaking. Short, clear sentences are enough for this activity.', '누가 말하는지 분명하면 저는을 생략해도 돼요. 짧고 분명한 문장부터 시작해요.'),
    mission: bi('Say three true sentences about your day. Change at least one place and one activity from the examples.', '내 하루를 세 문장으로 말해요. 예시에서 장소와 행동을 하나 이상 바꿔 보세요.'), sample: '집에서 밥을 먹어요. 카페에서 커피를 마셔요. 한국어를 공부해요.',
    questions: [q('Choose the location of an activity.', '행동하는 장소를 나타내는 문장은?', ['카페에서 공부해요.', '카페를 공부해요.', '카페 한 개 공부해요.'], 0, '에서 marks the place where studying happens.', '에서가 공부하는 장소를 나타내요.'), q('Complete: 밥__ 먹어요.', '밥__ 먹어요를 완성하세요.', ['를', '을', '에'], 1, '밥 ends in ㅂ, so use 을.', '밥에 받침 ㅂ이 있어서 을을 붙여요.')], review: ['cafe-order', 'getting-around'],
  },
  {
    id: 'things-you-love', title: bi('Make a connection', '좋아하는 것으로 대화'),
    goal: bi('Share what you like and ask another person.', '좋아하는 것을 말하고 상대에게 물어요.'), scene: 'friends', minutes: 10, teacherUnit: 14,
    words: [p('음악', 'music', 'eumak'), p('영화', 'film', 'yeonghwa'), p('여행', 'travel', 'yeohaeng'), p('좋아해요', 'like', 'joahaeyo')],
    phrases: [p('한국 음악을 좋아해요.', 'I like Korean music.', 'hanguk eumageul joahaeyo'), p('뭐 좋아해요?', 'What do you like?', 'mwo joahaeyo'), p('저도 좋아해요.', 'I like it, too.', 'jeodo joahaeyo')],
    dialogue: [d('Friend', '뭐 좋아해요?', 'What do you like?', 'mwo joahaeyo'), d('You', '한국 영화를 좋아해요.', 'I like Korean films.', 'hanguk yeonghwareul joahaeyo'), d('Friend', '저도 좋아해요.', 'I like them, too.', 'jeodo joahaeyo'), d('You', '음악도 좋아해요?', 'Do you like music, too?', 'eumakdo joahaeyo')],
    pattern: { form: '좋아하는 것 + 을/를 좋아해요', explanation: bi('Use 좋아해요 for liking a thing or activity. 도 means too or also: 저도, 음악도. It can replace the object particle in this sentence.', '좋아하는 대상에 을/를 좋아해요를 붙여요. 도는 역시, 또한의 뜻이에요. 음악도처럼 목적격 조사 대신 쓸 수 있어요.'), example: '커피를 좋아해요. · 여행도 좋아해요.' },
    culture: bi('Keep the polite 요 endings while getting to know someone. You can talk about music without needing slang or informal speech.', '처음 알아가는 사람과는 요로 끝나는 공손한 말투를 유지해요. 유행어나 반말 없이도 음악 이야기를 할 수 있어요.'),
    mission: bi('Share two things you like. Ask your partner what they like and find one thing in common.', '좋아하는 것 두 가지를 말해요. 상대에게도 물어서 공통점을 찾아보세요.'), sample: '커피를 좋아해요. 한국 음악도 좋아해요. 뭐 좋아해요?',
    questions: [q('Say “I like music.”', '음악을 좋아한다고 말하세요.', ['음악에 가요.', '음악을 좋아해요.', '음악 한 잔 주세요.'], 1, '음악을 좋아해요 uses 을 to mark what you like.', '음악에 을을 붙여 좋아하는 대상을 말해요.'), q('What does 저도 mean here?', '여기서 저도의 뜻은?', ['Me, too', 'Where', 'Two cups'], 0, '도 adds the meaning too or also.', '도는 또한, 역시의 뜻을 더해요.')], review: ['say-hello', 'daily-life'],
  },
  {
    id: 'yesterday', title: bi('Tell a tiny story', '어제의 작은 이야기'),
    goal: bi('Say two things you did yesterday.', '어제 한 일을 두 가지 말해요.'), scene: 'restaurant', minutes: 12, teacherUnit: 20,
    words: [p('어제', 'yesterday', 'eoje'), p('갔어요', 'went', 'gasseoyo'), p('먹었어요', 'ate', 'meogeosseoyo'), p('봤어요', 'saw / watched', 'bwasseoyo')],
    phrases: [p('어제 카페에 갔어요.', 'I went to a cafe yesterday.', 'eoje kapee gasseoyo'), p('김밥을 먹었어요.', 'I ate gimbap.', 'gimbabeul meogeosseoyo'), p('영화를 봤어요.', 'I watched a film.', 'yeonghwareul bwasseoyo')],
    dialogue: [d('Friend', '어제 뭐 했어요?', 'What did you do yesterday?', 'eoje mwo haesseoyo'), d('You', '친구를 만났어요.', 'I met a friend.', 'chingureul mannasseoyo'), d('Friend', '뭐 먹었어요?', 'What did you eat?', 'mwo meogeosseoyo'), d('You', '비빔밥을 먹었어요.', 'I ate bibimbap.', 'bibimbabeul meogeosseoyo')],
    pattern: { form: '가요 → 갔어요 · 먹어요 → 먹었어요', explanation: bi('Learn these useful present/past pairs. Past polite endings contain 았 or 었. 해요 becomes 했어요. You can tell a short story with two separate sentences.', '현재와 과거 표현을 짝으로 익혀요. 과거형에는 았 또는 었이 들어가요. 해요는 했어요가 돼요. 두 문장만으로도 짧은 이야기가 돼요.'), example: '공부해요 → 공부했어요 · 봐요 → 봤어요' },
    culture: bi('Your story can be ordinary. A meal or a film is enough. Focus on being understood before adding longer explanations.', '평범한 식사나 영화 이야기도 좋아요. 긴 설명보다 뜻이 전달되는 두 문장을 먼저 연습해요.'),
    mission: bi('Tell a two-sentence story about yesterday. Your partner asks what you ate or where you went.', '어제를 두 문장으로 이야기해요. 상대는 무엇을 먹었는지, 어디에 갔는지 물어요.'), sample: '어제 친구를 만났어요. 같이 김밥을 먹었어요.',
    questions: [q('Which means “went”?', '갔다고 말하는 표현은?', ['가요', '갔어요', '갈 거예요'], 1, '갔어요 is the polite past form of 가다.', '갔어요는 가다의 공손한 과거형이에요.'), q('Complete: 어제 김밥을 ___.', '어제 김밥을 ___를 완성하세요.', ['먹었어요', '어디예요', '한 잔'], 0, '먹었어요 tells what you ate in the past.', '먹었어요로 과거에 먹은 것을 말해요.')], review: ['restaurant-order', 'daily-life'],
  },
  {
    id: 'weekend-plans', title: bi('Make a little plan', '주말 약속 만들기'),
    goal: bi('Say what you want to do and suggest meeting.', '하고 싶은 일을 말하고 만남을 제안해요.'), scene: 'hero', minutes: 12, teacherUnit: 27,
    words: [p('내일', 'tomorrow', 'naeil'), p('주말', 'weekend', 'jumal'), p('같이', 'together', 'gachi'), p('만나요', 'meet', 'mannayo')],
    phrases: [p('서울에 가고 싶어요.', 'I want to go to Seoul.', 'seoure gago sipeoyo'), p('같이 갈까요?', 'Shall we go together?', 'gachi galkkayo'), p('내일 만나요.', 'See you tomorrow.', 'naeil mannayo')],
    dialogue: [d('You', '주말에 뭐 하고 싶어요?', 'What do you want to do this weekend?', 'jumare mwo hago sipeoyo'), d('Friend', '카페에 가고 싶어요.', 'I want to go to a cafe.', 'kapee gago sipeoyo'), d('You', '같이 갈까요?', 'Shall we go together?', 'gachi galkkayo'), d('Friend', '좋아요. 내일 만나요.', 'Sounds good. See you tomorrow.', 'joayo. naeil mannayo')],
    pattern: { form: '동사 어간 + 고 싶어요', explanation: bi('Remove 다 from a dictionary verb and add 고 싶어요: 가다 → 가고 싶어요. Learn 같이 갈까요? as a useful invitation.', '사전형 동사의 다를 빼고 고 싶어요를 붙여요. 같이 갈까요?는 제안하는 표현으로 익혀요.'), example: '먹다 → 먹고 싶어요 · 보다 → 보고 싶어요' },
    culture: bi('좋아요 can mean sounds good in response to a suggestion. Confirm a real meeting’s time and place separately.', '제안에 좋아요라고 답하면 동의의 뜻이에요. 실제 약속은 시간과 장소도 따로 확인해요.'),
    mission: bi('Suggest an activity, ask a friend to join, and agree on tomorrow or the weekend.', '하고 싶은 일을 말하고 함께하자고 제안한 뒤 내일이나 주말로 약속해요.'), sample: '비빔밥을 먹고 싶어요. 같이 갈까요? 좋아요. 내일 만나요.',
    questions: [q('Say “I want to eat.”', '먹고 싶다고 말하세요.', ['먹다 싶어요.', '먹고 싶어요.', '먹었어요.'], 1, '먹다 loses 다 and takes 고 싶어요.', '먹다에서 다를 빼고 고 싶어요를 붙여요.'), q('Which line invites someone to go together?', '함께 가자고 제안하는 표현은?', ['같이 갈까요?', '어디예요?', '어제 갔어요.'], 0, '같이 갈까요? means shall we go together?', '같이 갈까요?는 함께 가자고 제안하는 질문이에요.')], review: ['things-you-love', 'getting-around'],
  },
  {
    id: 'ask-for-help', title: bi('Keep the conversation going', '막혀도 대화를 이어가요'),
    goal: bi('Ask for repetition, slower speech, and help.', '다시, 천천히 말해 달라고 하고 도움을 요청해요.'), scene: 'clarification', minutes: 10, teacherUnit: 29,
    words: [p('다시', 'again', 'dasi'), p('천천히', 'slowly', 'cheoncheonhi'), p('한국어', 'Korean language', 'hangugeo'), p('조금', 'a little', 'jogeum')],
    phrases: [p('다시 말해 주세요.', 'Please say that again.', 'dasi malhae juseyo'), p('천천히 말해 주세요.', 'Please speak slowly.', 'cheoncheonhi malhae juseyo'), p('도와주세요.', 'Please help me.', 'dowajuseyo')],
    dialogue: [d('You', '한국어를 조금 해요.', 'I speak a little Korean.', 'hangugeoreul jogeum haeyo'), d('Attendant', '어디에 가요?', 'Where are you going?', 'eodie gayo'), d('You', '천천히 말해 주세요.', 'Please speak slowly.', 'cheoncheonhi malhae juseyo'), d('Attendant', '어디에 가요?', 'Where are you going?', 'eodie gayo')],
    pattern: { form: '다시 / 천천히 + 말해 주세요', explanation: bi('Add 다시 for again or 천천히 for slowly before 말해 주세요. A repair phrase lets you continue a conversation when you miss a word.', '말해 주세요 앞에 다시 또는 천천히를 붙여요. 모르는 말이 나와도 대화를 다시 이어갈 수 있어요.'), example: '다시 말해 주세요. · 천천히 말해 주세요.' },
    culture: bi('It is okay to ask more than once. You can also point to a map or show a written destination to support your words.', '두 번 이상 물어봐도 괜찮아요. 지도나 적어 둔 목적지를 보여 주면 뜻을 전하는 데 도움이 돼요.'),
    mission: bi('Ask your partner a directions question. They answer quickly; ask them to slow down, then confirm what you understood.', '길을 물어요. 상대가 빠르게 답하면 천천히 말해 달라고 요청한 뒤 이해한 내용을 확인해요.'), sample: '화장실 어디예요? 천천히 말해 주세요. 오른쪽이요? 감사합니다.',
    questions: [q('Ask someone to speak slowly.', '천천히 말해 달라고 하세요.', ['천천히 말해 주세요.', '아이스로 주세요.', '두 개 주세요.'], 0, '천천히 means slowly.', '천천히는 slowly예요.'), q('Which word means again?', '다시를 뜻하는 단어는?', ['조금', '다시', '내일'], 1, '다시 asks for something to happen again.', '다시는 같은 일을 한 번 더 한다는 뜻이에요.')], review: ['directions', 'weekend-plans'],
  },
  {
    id: 'your-seoul-day', title: bi('A day in Seoul, in your words', '내 말로 완성하는 서울의 하루'),
    goal: bi('Combine greetings, ordering, directions, and a short story.', '인사·주문·길 묻기·짧은 이야기를 연결해요.'), scene: 'hero', minutes: 15, teacherUnit: 22,
    words: [p('오늘', 'today', 'oneul'), p('어제', 'yesterday', 'eoje'), p('내일', 'tomorrow', 'naeil'), p('같이', 'together', 'gachi')],
    phrases: [p('안녕하세요. 저는 미나예요.', 'Hello. I am Mina.', 'annyeonghaseyo. jeoneun minayeyo'), p('커피 한 잔 주세요.', 'One coffee, please.', 'keopi han jan juseyo'), p('내일 같이 갈까요?', 'Shall we go together tomorrow?', 'naeil gachi galkkayo')],
    dialogue: [d('Friend', '어제 뭐 했어요?', 'What did you do yesterday?', 'eoje mwo haesseoyo'), d('You', '카페에 갔어요. 커피를 마셨어요.', 'I went to a cafe. I drank coffee.', 'kapee gasseoyo. keopireul masyeosseoyo'), d('Friend', '저도 가고 싶어요.', 'I want to go, too.', 'jeodo gago sipeoyo'), d('You', '내일 같이 갈까요?', 'Shall we go together tomorrow?', 'naeil gachi galkkayo')],
    pattern: { form: '인사 → 주문 → 길 묻기 → 이야기', explanation: bi('This is a transfer task, not a new grammar lesson. Reuse what you know in a new order. Change the name, drink, destination, and activity to make the conversation yours.', '새 문법 대신 배운 표현을 다른 순서로 써 보는 활동이에요. 이름·음료·목적지·활동을 바꿔 나만의 대화를 만들어요.'), example: '어제 카페에 갔어요. 내일 서울역에 가요.' },
    culture: bi('Completing these missions is a first step, not a fluency certificate. Revisit difficult scenes and use your tutor’s feedback to choose the next lesson.', '미션 완료는 입문의 첫걸음이에요. 유창성을 인증하는 것은 아니에요. 어려웠던 장면을 복습하고 선생님 피드백으로 다음 수업을 골라요.'),
    mission: bi('Do four mini-scenes without the script: introduce yourself, order a drink, ask directions, and tell a two-sentence story. Use a repair phrase whenever you need one.', '대본 없이 자기소개, 음료 주문, 길 묻기, 두 문장 이야기의 네 장면을 연습해요. 막히면 다시 말해 주세요를 써요.'), sample: '안녕하세요. 저는 미나예요. / 물 한 잔 주세요. / 서울역 어디예요? / 어제 친구를 만났어요. 같이 김밥을 먹었어요.',
    questions: [q('You did not understand a reply. What helps?', '답을 못 알아들었을 때 도움이 되는 말은?', ['반가워요.', '다시 말해 주세요.', '두 개 주세요.'], 1, 'A repair phrase lets you ask for repetition instead of stopping.', '다시 말해 달라고 하면 대화를 이어갈 수 있어요.'), q('Choose a sentence about yesterday.', '어제 한 일을 말하는 문장은?', ['어제 카페에 갔어요.', '내일 같이 갈까요?', '물 주세요.'], 0, '어제 and 갔어요 form a clear past-time sentence.', '어제와 과거형 갔어요로 지난 일을 말해요.')], review: ['say-hello', 'cafe-order', 'directions', 'yesterday', 'ask-for-help'],
  },
];

export const FIRST_STEPS_VERSION = 1;
export function firstStepById(id: string): FirstStep | undefined { return FIRST_STEPS.find((lesson) => lesson.id === id); }
