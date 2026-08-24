import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly db: PrismaClient;
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) {
      throw new Error('DATABASE_URL é obrigatório');
    }
    this.pool = new Pool({
      connectionString,
      max: Number(process.env.PAYMENTS_DB_POOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.PAYMENTS_DB_POOL_IDLE_MS ?? 30_000),
    });
    this.db = new PrismaClient({ adapter: new PrismaPg(this.pool) });
  }

  async onModuleInit() {
    await this.db.$connect();
  }

  async onModuleDestroy() {
    await this.db.$disconnect();
    await this.pool.end();
  }
}
