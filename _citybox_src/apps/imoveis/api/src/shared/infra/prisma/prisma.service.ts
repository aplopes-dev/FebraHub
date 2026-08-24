import '../env/load-env';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  type PrismaClient,
  PrismaClient as PrismaClientClass,
} from '../../../../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL não configurado. Copie de apps/imoveis/api/.env.example (Postgres local em 127.0.0.1:15433, não :5432).',
  );
}

const pool = new pg.Pool({ connectionString: databaseUrl });

@Injectable()
export class PrismaService
  extends (PrismaClientClass as unknown as new (opts: unknown) => PrismaClient)
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter: new PrismaPg(pool) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
