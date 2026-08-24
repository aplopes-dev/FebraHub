import '../src/shared/infra/env/load-env';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  booleanPermissionsForRole,
  type ImovelRoleKey,
} from '@citybox/imoveis-permissions';
import { PrismaClient, TeamMemberRole } from '../generated/prisma/client';
import { seedDemoCatalog } from './seed-demo-catalog';

/**
 * Seed de desenvolvimento.
 * - Garante configuração de comissão.
 * - Equipe demo Keycloak só na loja `dev-store-imoveis` (link-on-first-login).
 * - Catálogo demo (imóveis, leads, funil, negócios, visitas) é **idempotente**
 *   (não apaga cadastros; pula e-mail/nome já existentes).
 *
 * Loja: `SEED_STORE_ID` → senão a única (ou a maior) loja em `team_members`
 * → senão `dev-store-imoveis`.
 */
const FALLBACK_STORE_ID = 'dev-store-imoveis';

/**
 * Equipe demo da loja de desenvolvimento.
 *
 * O realm `citybox-imoveis` (`infra/keycloak/import/citybox-imoveis-realm.json`)
 * sobe **sem usuários** — cada realm de sistema nasce vazio (ADR C-16). Estas
 * linhas existem para o link-on-first-login por e-mail em `GET /v1/members/me`:
 * o `keycloakSub` é gravado quando a pessoa entra pela primeira vez, com a
 * identidade criada pelo `imoveis-provisioning` (equipe) ou pelo provisionamento
 * M2M do admin (responsável da loja).
 */
const KEYCLOAK_DEMO_TEAM = [
  {
    agentId: 'admin-citybox',
    name: 'Admin Plataforma',
    email: 'admin@citybox.com',
    role: 'admin' as const,
    initials: 'AP',
  },
  {
    agentId: 'lojista-citybox',
    name: 'Maria Lojista',
    email: 'lojista@citybox.com',
    role: 'broker' as const,
    initials: 'ML',
  },
] as const;

/** Comissão padrão da loja: 6% de comissão, dividida 40 (imobiliária) / 30 / 30. */
const DEFAULT_COMMISSION = {
  defaultCommissionPercent: 6,
  agencyPercent: 40,
  captorPercent: 30,
  sellerPercent: 30,
} as const;

async function resolveStoreId(prisma: PrismaClient): Promise<string> {
  const fromEnv = process.env.SEED_STORE_ID?.trim();
  if (fromEnv) return fromEnv;

  const grouped = await prisma.teamMember.groupBy({
    by: ['storeId'],
    _count: { storeId: true },
    orderBy: { _count: { storeId: 'desc' } },
  });
  if (grouped.length === 1) return grouped[0].storeId;
  if (grouped.length > 1) {
    console.log(
      `[imoveis-seed] ${grouped.length} lojas em team_members — usando a maior (${grouped[0].storeId}). Defina SEED_STORE_ID para escolher outra.`,
    );
    return grouped[0].storeId;
  }
  return FALLBACK_STORE_ID;
}

async function resolveAgent(
  prisma: PrismaClient,
  storeId: string,
): Promise<{ agentId: string; actorName: string }> {
  const members = await prisma.teamMember.findMany({
    where: { storeId, active: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });
  const admin = members.find((member) => member.role === TeamMemberRole.admin);
  const chosen = admin ?? members[0];
  if (!chosen) {
    return { agentId: 'ana-helena', actorName: 'Ana Helena' };
  }
  return { agentId: chosen.agentId, actorName: chosen.name };
}

async function seedCommissionConfig(
  prisma: PrismaClient,
  storeId: string,
): Promise<void> {
  const existing = await prisma.commissionConfig.findUnique({
    where: { storeId },
  });
  if (existing) {
    console.log(
      `[imoveis-seed] store=${storeId} já tem configuração de comissão — mantendo.`,
    );
    return;
  }

  await prisma.commissionConfig.create({
    data: { storeId, ...DEFAULT_COMMISSION },
  });
  console.log(
    `[imoveis-seed] configuração de comissão padrão criada em store=${storeId}`,
  );
}

async function seedKeycloakDemoTeam(
  prisma: PrismaClient,
  storeId: string,
): Promise<void> {
  if (storeId !== FALLBACK_STORE_ID) {
    console.log(
      `[imoveis-seed] store=${storeId} não é a loja de bootstrap — pulando equipe Keycloak demo.`,
    );
    return;
  }

  for (const member of KEYCLOAK_DEMO_TEAM) {
    const role = member.role as TeamMemberRole;
    const permissionsJson = booleanPermissionsForRole(
      member.role as ImovelRoleKey,
    );
    const byAgent = await prisma.teamMember.findFirst({
      where: { storeId, agentId: member.agentId },
    });
    const byEmail = await prisma.teamMember.findFirst({
      where: {
        storeId,
        email: { equals: member.email, mode: 'insensitive' },
      },
    });
    const existing = byAgent ?? byEmail;

    if (existing) {
      await prisma.teamMember.update({
        where: { id: existing.id },
        data: {
          agentId: member.agentId,
          name: member.name,
          email: member.email,
          role,
          initials: member.initials,
          active: true,
          permissionsJson,
        },
      });
      console.log(
        `[imoveis-seed] equipe Keycloak atualizada: ${member.email} (${member.role})`,
      );
      continue;
    }

    await prisma.teamMember.create({
      data: {
        storeId,
        agentId: member.agentId,
        name: member.name,
        email: member.email,
        phone: '',
        role,
        initials: member.initials,
        active: true,
        permissionsJson,
        hasPassword: false,
        mustChangePassword: false,
      },
    });
    console.log(
      `[imoveis-seed] equipe Keycloak criada: ${member.email} (${member.role})`,
    );
  }
}

async function main(): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const storeId = await resolveStoreId(prisma);
    await seedCommissionConfig(prisma, storeId);
    await seedKeycloakDemoTeam(prisma, storeId);

    const agent = await resolveAgent(prisma, storeId);
    const created = await seedDemoCatalog(prisma, {
      storeId,
      agentId: agent.agentId,
      actorName: agent.actorName,
    });

    console.log(
      `[imoveis-seed] catálogo demo em store=${storeId} agent=${agent.agentId}: ` +
        `+${created.properties} imóveis, +${created.leads} leads, ` +
        `+${created.deals} negócios (funil), +${created.transactions} transações, ` +
        `+${created.appointments} visitas.`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[imoveis-seed] falhou:', error);
  process.exit(1);
});
