#!/usr/bin/env node
/*
 * 첫 강사 승인 — 닭과 달걀을 끊는다.
 *
 *   node tools/admin-approve.mjs me@example.com
 *   node tools/admin-approve.mjs --list
 *
 * 왜 이 스크립트가 필요한가.
 *
 * 관리자 화면은 requireAdmin 을 지난다. requireAdmin = requireTeacher +
 * ADMIN_EMAILS 에 든 주소다. 그리고 requireTeacher 는 access 토큰을 본다.
 * access 토큰은 로그인에서만 나오고, 로그인은 approvalStatus 가 approved 여야 한다.
 *
 *   승인하려면 관리자로 로그인해야 하고
 *   로그인하려면 승인돼 있어야 한다
 *
 * 그래서 첫 한 명은 화면 밖에서 승인할 수밖에 없다.
 * 그 권한을 가진 사람은 DB 접속 정보를 가진 사람이고, 그게 맞는 자리다.
 *
 * 두 번째부터는 이 스크립트를 쓰지 않는다. /admin/teachers 에서 한다 —
 * 거기에는 신청 사유가 같이 보이고 거절 사유가 기록으로 남는다.
 */

import { PrismaClient } from '@prisma/client';

const arg = process.argv[2];

if (!arg) {
  console.error('사용법: node tools/admin-approve.mjs <이메일>');
  console.error('        node tools/admin-approve.mjs --list    대기 중인 신청 보기');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 이 없습니다. tools/db-connect.mjs 를 먼저 실행하세요.');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  if (arg === '--list') {
    const rows = await prisma.teacher.findMany({
      where: { approvalStatus: 'pending' },
      orderBy: { createdAt: 'asc' },
      select: { email: true, name: true, createdAt: true, applyNote: true },
    });

    if (rows.length === 0) {
      console.log('대기 중인 신청이 없습니다.');
    } else {
      console.log(`대기 중 ${rows.length}건\n`);
      for (const r of rows) {
        console.log(`  ${r.email}  ${r.name}  ${r.createdAt.toISOString().slice(0, 10)}`);
        if (r.applyNote) console.log(`    ${r.applyNote.slice(0, 120)}`);
      }
    }
    process.exit(0);
  }

  const email = arg.trim().toLowerCase();
  const teacher = await prisma.teacher.findUnique({
    where: { email },
    select: { id: true, name: true, approvalStatus: true },
  });

  if (!teacher) {
    console.error(`${email} 로 신청한 기록이 없습니다.`);
    console.error('먼저 /signup 에서 신청하세요. 이 스크립트는 계정을 만들지 않습니다 —');
    console.error('비밀번호를 여기서 받으면 평문이 셸 기록에 남습니다.');
    process.exit(1);
  }

  if (teacher.approvalStatus === 'approved') {
    console.log(`${email} 은 이미 승인돼 있습니다.`);
    process.exit(0);
  }

  await prisma.teacher.update({
    where: { id: teacher.id },
    data: { approvalStatus: 'approved', approvedAt: new Date(), rejectedReason: null },
  });

  console.log(`승인 완료 — ${teacher.name} <${email}>`);
  console.log('이제 이 계정으로 로그인됩니다.');
  console.log('ADMIN_EMAILS 에 같은 주소가 들어 있으면 /admin/teachers 도 열립니다.');
} finally {
  await prisma.$disconnect();
}
