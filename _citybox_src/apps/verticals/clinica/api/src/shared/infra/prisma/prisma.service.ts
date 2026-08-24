import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  type PrismaClient,
  PrismaClient as PrismaClientClass,
} from '../../../../generated/prisma/client';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

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
