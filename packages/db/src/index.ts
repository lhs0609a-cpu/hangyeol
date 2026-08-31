import { PrismaClient } from '@prisma/client';

/**
 * Prisma 클라이언트 싱글턴.
 *
 * 서버리스에서 요청마다 새 클라이언트를 만들면 커넥션이 금방 마른다.
 * 개발 중에는 HMR 이 모듈을 다시 평가하므로 globalThis 에 붙여 재사용한다.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return globalForPrisma.prisma;
}

export type { PrismaClient };
export * from '@prisma/client';
