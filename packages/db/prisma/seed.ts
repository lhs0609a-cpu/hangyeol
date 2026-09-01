import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes, createCipheriv } from 'node:crypto';
import { argon2id } from 'hash-wasm';

/*
 * 개발용 시드.
 *
 * 교육 콘텐츠(250차시·HVPT 음원 416개·시나리오 60개)는 여기서 만들지 않는다.
 * 그건 08번 문서대로 한국어교원이 검수하는 별도 트랙이다.
 * 여기서는 "플로우가 끝까지 도는지" 확인하는 데 필요한 최소한만 넣는다.
 */

const prisma = new PrismaClient();

const PEPPER = process.env.EMAIL_HASH_PEPPER ?? 'dev-pepper';
const ENC_KEY = Buffer.from(
  (process.env.EMAIL_ENC_KEY ?? '').replace(/^base64:/, '') || randomBytes(32).toString('base64'),
  'base64',
);

function hashEmail(email: string): string {
  return createHash('sha256').update(`${email.toLowerCase()}${PEPPER}`).digest('hex');
}

function encryptEmail(email: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const body = Buffer.concat([cipher.update(email.toLowerCase(), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

const STUDENTS = [
  { name: 'Maria Santos', nameKo: '마리아', email: 'maria@example.com', l1: 'es', country: 'ES', platform: 'preply', lesson: 14, status: 'active' },
  { name: 'Misaki Ito', nameKo: '미사키', email: 'misaki@example.com', l1: 'ja', country: 'JP', platform: 'italki', lesson: 22, status: 'active' },
  { name: 'Nguyen Minh', nameKo: '민', email: 'minh@example.com', l1: 'vi', country: 'VN', platform: 'italki', lesson: 6, status: 'active' },
  { name: 'Lucas Brown', nameKo: '루카스', email: 'lucas@example.com', l1: 'en', country: 'US', platform: 'preply', lesson: 3, status: 'pending' },
  { name: 'Sarah Putri', nameKo: '사라', email: 'sarah@example.com', l1: 'id', country: 'ID', platform: 'italki', lesson: 9, status: 'dormant' },
];

async function main() {
  const email = 'teacher@example.com';

  const teacher = await prisma.teacher.upsert({
    where: { email },
    update: {},
    create: {
      email,
      // 개발 시드 비밀번호. 운영에서 쓰지 않는다.
      passwordHash: await argon2id({
        password: 'devpassword1',
        salt: randomBytes(16),
        parallelism: 1,
        iterations: 3,
        memorySize: 19456,
        hashLength: 32,
        outputType: 'encoded',
      }),
      name: '이지은',
      hourlyRateUsd: 18,
      rateTier: 'B',
      emailVerifiedAt: new Date(),
      onboardingStage: 'teaching',
    },
  });

  // 차시 하나만 넣는다. 슬라이드 자산이 없으므로 pageCount 는 0이다.
  const unit = await prisma.curriculumUnit.upsert({
    where: { unitNo: 15 },
    update: {},
    create: {
      levelCode: 'topik1',
      unitNo: 15,
      title: '카페에서 주문하기',
      goalStatement: '카페에서 주문하고 추가 요청까지 말할 수 있다',
      targetForms: ['-아/어 주세요', '-고 싶어요'],
      targetVocab: ['아메리카노', '따뜻하다', '차갑다'],
      recycleFrom: [12],
    },
  });

  const now = new Date();

  for (const s of STUDENTS) {
    const student = await prisma.student.upsert({
      where: { teacherId_emailHash: { teacherId: teacher.id, emailHash: hashEmail(s.email) } },
      update: {},
      create: {
        teacherId: teacher.id,
        name: s.name,
        nameKo: s.nameKo,
        emailHash: hashEmail(s.email),
        emailEnc: encryptEmail(s.email),
        l1Code: s.l1,
        countryCode: s.country,
        platform: s.platform,
        levelCode: s.lesson > 20 ? 'topik2' : 'topik1',
        status: s.status,
        currentLessonNo: s.lesson,
        verifiedAt: s.status === 'pending' ? null : new Date(now.getTime() - 30 * 86_400_000),
        lastLessonAt:
          s.status === 'dormant'
            ? new Date(now.getTime() - 34 * 86_400_000)
            : new Date(now.getTime() - 2 * 86_400_000),
      },
    });

    // 활성 학생에게는 진행 중 주기를 하나씩 열어둔다. 청구 화면이 실제 값을 읽도록.
    if (s.status === 'active') {
      const periodStart = new Date(now.getTime() - 10 * 86_400_000);
      await prisma.billingCycle.upsert({
        where: { studentId_cycleNo: { studentId: student.id, cycleNo: 1 } },
        update: {},
        create: {
          studentId: student.id,
          teacherId: teacher.id,
          cycleNo: 1,
          periodStart,
          periodEnd: new Date(periodStart.getTime() + 28 * 86_400_000),
          tier: 'B',
          baseAmount: 14_900,
          discountPct: 0,
          amount: 14_900,
          status: 'open',
        },
      });
    }
  }

  console.log(`시드 완료 — 강사 1명(${email} / devpassword1), 학생 ${STUDENTS.length}명, 차시 ${unit.unitNo}`);
  console.log('슬라이드 자산은 포함되지 않습니다. 08번 문서의 별도 제작 트랙입니다.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
