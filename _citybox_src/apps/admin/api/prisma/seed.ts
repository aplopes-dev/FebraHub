import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * Planos do catálogo, **escopados por vertical** (PLAT-001).
 *
 * Isto não é detalhe de seed: `CreateStoreUseCase` recusa criar loja quando
 * `plan.vertical !== store.vertical` (`PlanVerticalMismatchError`). Um plano com
 * `vertical: null` — como este seed criava antes desta correção — é inutilizável: as 4
 * linhas existiam no banco e **nenhuma loja podia ser cadastrada**.
 *
 * `maxNegocios` é o limite da unidade operacional de cada vertical: filiais por
 * organização no Comércio, clínicas por organização na Clínica. `maxStores` é o limite de
 * lojas da plataforma e segue 1 — desde o PLAT-001 a Loja É o cliente, então não há
 * "várias lojas por contrato".
 */
const plans = [
  // ─── Comércio (apps/erp: food + varejo) ────────────────────────────────────
  {
    code: 'comercio-starter',
    name: 'Comércio Starter',
    description:
      'Para quem está começando: uma unidade e equipe enxuta. Catálogo e estoque.',
    vertical: 'Comércio',
    tier: 'starter',
    maxStores: 1,
    maxNegocios: 1,
    maxUsers: 3,
    maxProducts: 500,
    status: 'ACTIVE' as const,
    prices: [
      { cycle: 'MONTHLY' as const, priceCents: 9900 },
      { cycle: 'YEARLY' as const, priceCents: 99000 },
    ],
  },
  {
    code: 'comercio-professional',
    name: 'Comércio Professional',
    description: 'Múltiplas filiais, equipe maior e catálogo sem aperto.',
    vertical: 'Comércio',
    tier: 'professional',
    maxStores: 1,
    maxNegocios: 5,
    maxUsers: 15,
    maxProducts: 5000,
    status: 'ACTIVE' as const,
    prices: [
      { cycle: 'MONTHLY' as const, priceCents: 29900 },
      { cycle: 'YEARLY' as const, priceCents: 299000 },
    ],
  },
  {
    code: 'comercio-enterprise',
    name: 'Comércio Enterprise',
    description:
      'Redes com muitas filiais e alto volume. Sem limite de produtos.',
    vertical: 'Comércio',
    tier: 'enterprise',
    maxStores: 1,
    maxNegocios: 50,
    maxUsers: 100,
    maxProducts: null,
    status: 'ACTIVE' as const,
    prices: [
      { cycle: 'MONTHLY' as const, priceCents: 79900 },
      { cycle: 'YEARLY' as const, priceCents: 799000 },
    ],
  },

  // ─── Clínica (apps/verticals/clinica) ──────────────────────────────────────
  {
    code: 'clinica-bronze',
    name: 'Clínica Bronze',
    description: 'Consultório único: agenda, prontuário e financeiro básico.',
    vertical: 'Clínica',
    tier: 'bronze',
    maxStores: 1,
    maxNegocios: 1,
    maxUsers: 5,
    maxProducts: null,
    status: 'ACTIVE' as const,
    prices: [
      { cycle: 'MONTHLY' as const, priceCents: 14900 },
      { cycle: 'YEARLY' as const, priceCents: 149000 },
    ],
  },
  {
    code: 'clinica-prata',
    name: 'Clínica Prata',
    description:
      'Até 3 clínicas na mesma organização, com equipe compartilhada.',
    vertical: 'Clínica',
    tier: 'prata',
    maxStores: 1,
    maxNegocios: 3,
    maxUsers: 20,
    maxProducts: null,
    status: 'ACTIVE' as const,
    prices: [
      { cycle: 'MONTHLY' as const, priceCents: 39900 },
      { cycle: 'YEARLY' as const, priceCents: 399000 },
    ],
  },
  {
    code: 'clinica-ouro',
    name: 'Clínica Ouro',
    description: 'Rede de clínicas, equipe ampla e suporte dedicado.',
    vertical: 'Clínica',
    tier: 'ouro',
    maxStores: 1,
    maxNegocios: 20,
    maxUsers: 100,
    maxProducts: null,
    status: 'ACTIVE' as const,
    prices: [
      { cycle: 'MONTHLY' as const, priceCents: 99900 },
      { cycle: 'YEARLY' as const, priceCents: 999000 },
    ],
  },

  // ─── Imóveis (apps/imoveis) ────────────────────────────────────────────────
  {
    code: 'imoveis-starter',
    name: 'Imóveis Starter',
    description: 'Corretor autônomo ou imobiliária pequena: leads, imóveis e agenda.',
    vertical: 'Imóveis',
    tier: 'starter',
    maxStores: 1,
    maxNegocios: 1,
    maxUsers: 3,
    maxProducts: null,
    status: 'ACTIVE' as const,
    prices: [
      { cycle: 'MONTHLY' as const, priceCents: 12900 },
      { cycle: 'YEARLY' as const, priceCents: 129000 },
    ],
  },
  {
    code: 'imoveis-professional',
    name: 'Imóveis Professional',
    description: 'Equipe de corretores com CRM, negócios e integrações.',
    vertical: 'Imóveis',
    tier: 'professional',
    maxStores: 1,
    maxNegocios: 3,
    maxUsers: 15,
    maxProducts: null,
    status: 'ACTIVE' as const,
    prices: [
      { cycle: 'MONTHLY' as const, priceCents: 34900 },
      { cycle: 'YEARLY' as const, priceCents: 349000 },
    ],
  },
  {
    code: 'imoveis-enterprise',
    name: 'Imóveis Enterprise',
    description: 'Rede imobiliária com equipe ampla e suporte dedicado.',
    vertical: 'Imóveis',
    tier: 'enterprise',
    maxStores: 1,
    maxNegocios: 20,
    maxUsers: 100,
    maxProducts: null,
    status: 'ACTIVE' as const,
    prices: [
      { cycle: 'MONTHLY' as const, priceCents: 89900 },
      { cycle: 'YEARLY' as const, priceCents: 899000 },
    ],
  },
];

async function main() {
  console.log('Seeding plans...');

  for (const plan of plans) {
    const { prices, ...planData } = plan;

    const upsertedPlan = await prisma.plan.upsert({
      where: { code: plan.code },
      update: planData,
      create: planData,
    });

    for (const price of prices) {
      await prisma.planPrice.upsert({
        where: {
          planId_cycle: {
            planId: upsertedPlan.id,
            cycle: price.cycle,
          },
        },
        update: {
          priceCents: price.priceCents,
        },
        create: {
          planId: upsertedPlan.id,
          cycle: price.cycle,
          priceCents: price.priceCents,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
