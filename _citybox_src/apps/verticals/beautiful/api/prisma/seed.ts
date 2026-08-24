import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { STORE_PERMISSION_IDS } from '@citybox/beautiful-permissions';

const SEED_ORG_ID =
  process.env.SEED_ORGANIZATION_ID?.trim() ||
  '019c0000-0000-7000-8000-000000000010';
const SEED_OWNER_MEMBER_ID =
  process.env.SEED_OWNER_MEMBER_ID?.trim() ||
  '019c0000-0000-7000-8000-000000000011';
const SEED_STORE_MEMBER_ID =
  process.env.SEED_STORE_MEMBER_ID?.trim() ||
  '019c0000-0000-7000-8000-000000000012';

// ── Definições de Seeds Padrão ──
export const DEFAULT_ACCOUNTS = [
  { name: 'Caixa', type: 'cash' },
  { name: 'Conta Corrente', type: 'checking' },
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Custos fixos', color: '#F97316' },
  { name: 'Produtos / materiais', color: '#3B82F6' },
  { name: 'Encargos', color: '#EF4444' },
  { name: 'Outras despesas', color: '#A855F7' },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Serviços', color: '#22C55E' },
  { name: 'Produtos', color: '#F59E0B' },
  { name: 'Outras receitas', color: '#6B7280' },
] as const;

export const DEFAULT_CLIENT_CATEGORIES = [
  { name: 'VIP', colorId: '#EAB308', isProtected: false },
  { name: 'Frequente', colorId: '#3B82F6', isProtected: false },
  { name: 'Novo', colorId: '#10B981', isProtected: false },
  { name: 'Geral', colorId: '#6B7280', isProtected: true },
] as const;

export const DEFAULT_APPOINTMENT_CATEGORIES = [
  { name: 'Estética', color: '#8B5CF6' },
  { name: 'Geral', color: '#3B82F6' },
] as const;

export type SeedResultStats = {
  accountsCreated: number;
  expenseCategoriesCreated: number;
  incomeCategoriesCreated: number;
  clientCategoriesCreated: number;
  appointmentCategoriesCreated: number;
};

/**
 * Aplica os registros padrão (contas, categorias, clientes, agendamentos) em uma loja.
 * É 100% idempotente: apenas cria o que ainda não existe para a loja informada.
 */
export async function seedDefaultsForStore(
  prisma: PrismaClient,
  storeId: string,
): Promise<SeedResultStats> {
  const stats: SeedResultStats = {
    accountsCreated: 0,
    expenseCategoriesCreated: 0,
    incomeCategoriesCreated: 0,
    clientCategoriesCreated: 0,
    appointmentCategoriesCreated: 0,
  };

  // 1. Contas Financeiras
  for (const acc of DEFAULT_ACCOUNTS) {
    const existing = await prisma.financialAccount.findFirst({
      where: { storeId, name: acc.name },
    });
    if (!existing) {
      await prisma.financialAccount.create({
        data: {
          storeId,
          name: acc.name,
          type: acc.type,
          isActive: true,
        },
      });
      stats.accountsCreated++;
    }
  }

  // 2. Categorias de Despesas
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    const existing = await prisma.financialCategory.findFirst({
      where: { storeId, kind: 'expense', name: cat.name },
    });
    if (!existing) {
      await prisma.financialCategory.create({
        data: {
          storeId,
          kind: 'expense',
          name: cat.name,
          color: cat.color,
        },
      });
      stats.expenseCategoriesCreated++;
    } else if (!existing.color?.trim()) {
      await prisma.financialCategory.update({
        where: { id: existing.id },
        data: { color: cat.color },
      });
    }
  }

  // 3. Categorias de Receitas
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    const existing = await prisma.financialCategory.findFirst({
      where: { storeId, kind: 'income', name: cat.name },
    });
    if (!existing) {
      await prisma.financialCategory.create({
        data: {
          storeId,
          kind: 'income',
          name: cat.name,
          color: cat.color,
        },
      });
      stats.incomeCategoriesCreated++;
    } else if (!existing.color?.trim()) {
      await prisma.financialCategory.update({
        where: { id: existing.id },
        data: { color: cat.color },
      });
    }
  }

  // 4. Categorias de Clientes
  for (const cat of DEFAULT_CLIENT_CATEGORIES) {
    const existing = await prisma.clientCategory.findFirst({
      where: { storeId, name: cat.name },
    });
    if (!existing) {
      await prisma.clientCategory.create({
        data: {
          storeId,
          name: cat.name,
          colorId: cat.colorId,
          isProtected: cat.isProtected,
        },
      });
      stats.clientCategoriesCreated++;
    }
  }

  // 5. Categorias de Agendamentos
  for (const cat of DEFAULT_APPOINTMENT_CATEGORIES) {
    const existing = await prisma.appointmentCategory.findFirst({
      where: { storeId, name: cat.name },
    });
    if (!existing) {
      await prisma.appointmentCategory.create({
        data: {
          storeId,
          name: cat.name,
          color: cat.color,
        },
      });
      stats.appointmentCategoriesCreated++;
    }
  }

  return stats;
}

/**
 * Script de Seed Dinâmico e Idempotente para a vertical Beautiful.
 *
 * Modos de Execução:
 * 1. Loja específica: Informe `SEED_STORE_ID=<uuid>` no .env ou CLI (`pnpm db:seed -- --store <id>`).
 * 2. Todas as lojas: Informe `SEED_ALL_STORES=true`, passe `--all`, ou execute sem `SEED_STORE_ID`.
 */
function formatSeedStats(stats: SeedResultStats): string {
  return (
    `contas=${stats.accountsCreated} ` +
    `despesas=${stats.expenseCategoriesCreated} ` +
    `receitas=${stats.incomeCategoriesCreated} ` +
    `clientes=${stats.clientCategoriesCreated} ` +
    `agenda=${stats.appointmentCategoriesCreated}`
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const storeFlagIndex = args.indexOf('--store');
  const storeFlagId = storeFlagIndex !== -1 ? args[storeFlagIndex + 1]?.trim() : undefined;

  const targetStoreId = storeFlagId || process.env.SEED_STORE_ID?.trim();
  const runAllStores =
    args.includes('--all') ||
    process.env.SEED_ALL_STORES?.trim() === 'true' ||
    !targetStoreId;

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    if (!runAllStores && targetStoreId) {
      // ── MODO 1: Loja única específica ──
      console.log(`[beautiful-seed] Executando seed para a loja específica: ${targetStoreId}`);

      const keycloakSub = process.env.SEED_OWNER_KEYCLOAK_SUB?.trim();
      const username = process.env.SEED_OWNER_USERNAME?.trim().toLowerCase() || 'lojista';
      const email = process.env.SEED_OWNER_EMAIL?.trim() || 'lojista@citybox.com';
      const firstName = process.env.SEED_OWNER_FIRST_NAME?.trim() || 'Maria';
      const lastName = process.env.SEED_OWNER_LAST_NAME?.trim() || 'Lojista';
      const orgName = process.env.SEED_ORGANIZATION_NAME?.trim() || 'Beautiful Demo';
      const storeName = process.env.SEED_STORE_NAME?.trim() || 'Beautiful Demo';

      await prisma.organization.upsert({
        where: { id: SEED_ORG_ID },
        create: { id: SEED_ORG_ID, name: orgName, status: 'active' },
        update: { name: orgName, status: 'active' },
      });

      await prisma.store.upsert({
        where: { id: targetStoreId },
        create: {
          id: targetStoreId,
          organizationId: SEED_ORG_ID,
          name: storeName,
          status: 'active',
        },
        update: { organizationId: SEED_ORG_ID, name: storeName, status: 'active' },
      });

      console.log(
        `[beautiful-seed] Org ${SEED_ORG_ID} + Store ${targetStoreId} garantidos.`,
      );

      if (keycloakSub) {
        await prisma.member.upsert({
          where: { id: SEED_OWNER_MEMBER_ID },
          create: {
            id: SEED_OWNER_MEMBER_ID,
            organizationId: SEED_ORG_ID,
            keycloakSub,
            username,
            email,
            firstName,
            lastName,
            status: 'active',
            organizationRole: 'OWNER',
            hasPassword: true,
          },
          update: {
            keycloakSub,
            username,
            email,
            firstName,
            lastName,
            status: 'active',
            organizationRole: 'OWNER',
            hasPassword: true,
            deletedAt: null,
            disabledAt: null,
          },
        });

        await prisma.storeMember.upsert({
          where: { id: SEED_STORE_MEMBER_ID },
          create: {
            id: SEED_STORE_MEMBER_ID,
            storeId: targetStoreId,
            memberId: SEED_OWNER_MEMBER_ID,
            role: 'profissional',
            permissions: [...STORE_PERMISSION_IDS],
          },
          update: {
            storeId: targetStoreId,
            memberId: SEED_OWNER_MEMBER_ID,
            role: 'profissional',
            permissions: [...STORE_PERMISSION_IDS],
          },
        });
      } else {
        console.warn(
          '[beautiful-seed] SEED_OWNER_KEYCLOAK_SUB ausente — OWNER não criado. ' +
            'Defina o sub do usuário no realm citybox-beautiful (KEYCLOAK_REALM) ' +
            'no .env — subs de outros realms não valem aqui.',
        );
      }

      const stats = await seedDefaultsForStore(prisma, targetStoreId);
      console.log(`[beautiful-seed] Defaults da loja: ${formatSeedStats(stats)}`);
    } else {
      // ── MODO 2: Executar dinamicamente para TODAS as lojas do banco ──
      const stores = await prisma.store.findMany({
        select: { id: true, name: true },
      });

      if (stores.length === 0) {
        console.log('Nenhuma loja encontrada no banco de dados para seed.');
        return;
      }

      console.log(`Executando seed dinâmico para ${stores.length} loja(s)...`);

      const storeStats: SeedResultStats[] = [];
      for (const store of stores) {
        storeStats.push(await seedDefaultsForStore(prisma, store.id));
      }

      const emptyStats: SeedResultStats = {
        accountsCreated: 0,
        expenseCategoriesCreated: 0,
        incomeCategoriesCreated: 0,
        clientCategoriesCreated: 0,
        appointmentCategoriesCreated: 0,
      };
      const totals = storeStats.reduce(
        (acc, stats) => ({
          accountsCreated: acc.accountsCreated + stats.accountsCreated,
          expenseCategoriesCreated:
            acc.expenseCategoriesCreated + stats.expenseCategoriesCreated,
          incomeCategoriesCreated:
            acc.incomeCategoriesCreated + stats.incomeCategoriesCreated,
          clientCategoriesCreated:
            acc.clientCategoriesCreated + stats.clientCategoriesCreated,
          appointmentCategoriesCreated:
            acc.appointmentCategoriesCreated + stats.appointmentCategoriesCreated,
        }),
        emptyStats,
      );

      console.log(
        `[beautiful-seed] Finalizado em ${stores.length} loja(s). ${formatSeedStats(totals)}`,
      );
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[beautiful-seed] falhou:', error);
  process.exit(1);
});
