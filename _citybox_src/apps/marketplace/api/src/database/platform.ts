import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/platform/client.js';

export type PlatformPrisma = PrismaClient;
export type { Prisma as PlatformPrismaTypes } from '../generated/platform/client.js';

export function createPlatformClient(url?: string): PlatformPrisma {
  const connectionString =
    url ?? process.env.PLATFORM_DATABASE_URL ?? 'postgresql://citybox:citybox@127.0.0.1:15433/citybox_platform';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
