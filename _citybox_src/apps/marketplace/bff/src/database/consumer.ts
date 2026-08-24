import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/consumer/client.js';
import { config } from '../config.js';

let client: PrismaClient | null = null;

export function getConsumerClient(): PrismaClient {
  if (!client) {
    const pool = new Pool({ connectionString: config.databaseUrl() });
    // O adapter pg ignora o query param ?schema= da URL — o schema vai aqui.
    client = new PrismaClient({ adapter: new PrismaPg(pool, { schema: 'consumer' }) });
  }
  return client;
}
