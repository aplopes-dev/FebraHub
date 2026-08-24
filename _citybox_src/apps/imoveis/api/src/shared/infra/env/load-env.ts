import { config } from 'dotenv';
import { resolve } from 'node:path';

/**
 * O `.env` desta API precisa ganhar de variáveis herdadas pelo `dev:pick`/turbo
 * (`dotenv/config` não sobrescreve). Sem `DATABASE_URL`, o `pg.Pool` cai em
 * `127.0.0.1:5432` — o Postgres local da Citybox escuta em **15433**.
 */
config({ path: resolve(process.cwd(), '.env'), override: true });
