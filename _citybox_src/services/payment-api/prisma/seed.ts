import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { DEV_MERCHANT_ID, DEV_TENANT_ID } from '../src/dev/dev-constants.js';
import { seedProviderAccounts } from './seed-providers.js';
import { seedConsumerWebhooks } from './seed-consumer-webhook.js';

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error('DATABASE_URL é obrigatório para seed');
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PAYMENTS_SEED !== 'true') {
    throw new Error(
      'Seed bloqueado em produção. Defina ALLOW_PAYMENTS_SEED=true apenas em pipelines controlados.',
    );
  }

  const tenant = await prisma.tenant.upsert({
    where: { id: DEV_TENANT_ID },
    update: { name: 'Citybox Dev', status: 'ACTIVE' },
    create: {
      id: DEV_TENANT_ID,
      name: 'Citybox Dev',
      status: 'ACTIVE',
    },
  });

  await prisma.merchant.upsert({
    where: { id: DEV_MERCHANT_ID },
    update: {
      legalName: 'Loja Piloto Ilhéus LTDA',
      tradeName: 'Loja Piloto Ilhéus',
      cpfCnpj: '00000000000191',
      email: 'loja@piloto.ilheus.citybox.dev',
      status: 'ACTIVE',
    },
    create: {
      id: DEV_MERCHANT_ID,
      tenantId: tenant.id,
      legalName: 'Loja Piloto Ilhéus LTDA',
      tradeName: 'Loja Piloto Ilhéus',
      cpfCnpj: '00000000000191',
      email: 'loja@piloto.ilheus.citybox.dev',
      status: 'ACTIVE',
    },
  });

  await seedProviderAccounts(prisma, tenant.id, DEV_MERCHANT_ID);
  await seedConsumerWebhooks(prisma, tenant.id);

  console.log(`Seed payment-api: tenant=${tenant.id} merchant=${DEV_MERCHANT_ID}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
