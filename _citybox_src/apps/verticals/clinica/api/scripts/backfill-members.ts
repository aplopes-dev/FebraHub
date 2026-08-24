import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Backfill idempotente de equipe (PLAT-001 / Fase 4).
 *
 * Copia `platform.store_members` + `platform.members` para `clinica.members` +
 * `clinica.clinic_members`.
 *
 * ⚠️ PONTO MAIS CRÍTICO DA MIGRAÇÃO
 * `clinica.members.id` recebe o **`platform.store_members.id`**, não um uuid novo.
 * Cerca de 15 colunas do domínio guardam esse id como String solta, sem FK:
 * `appointments.professional_id`, `budgets.responsible_id`,
 * `patient_treatments.professional_id`, `commission_rules.member_id`,
 * `professional_service_hours.member_id`, `internal_events.professional_id`, etc.
 * Se gerarmos ids novos, TODO o histórico de profissional e comissão fica órfão —
 * silenciosamente, porque não há FK para reclamar.
 *
 * Este script lê o schema `platform` diretamente porque ambos vivem no mesmo banco.
 * É uma dependência **temporária e só de migração** — o runtime da clínica não faz isso
 * (o único `$queryRaw` cross-schema do código foi removido nesta mesma fase).
 *
 * Rodar: pnpm --filter @citybox/clinica-api exec tsx scripts/backfill-members.ts
 */

type PlatformMemberRow = {
  store_member_id: string;
  store_id: string;
  role: string;
  permissions: unknown;
  keycloak_sub: string;
  username: string;
  email: string | null;
  first_name: string;
  last_name: string;
  is_active: boolean;
  has_password: boolean;
  disabled_at: Date | null;
  provisional_expires_at: Date | null;
  deleted_at: Date | null;
};

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  let membersCreated = 0;
  let linksCreated = 0;
  let skipped = 0;
  const orphans: string[] = [];

  try {
    const clinics = await prisma.clinic.findMany({
      select: { id: true, organizationId: true },
    });
    if (clinics.length === 0) {
      console.log(
        'Nenhuma clínica — rode backfill-organization-and-clinic.ts primeiro.',
      );
      return;
    }
    const clinicByStoreId = new Map(clinics.map((c) => [c.id, c]));

    const rows = await prisma.$queryRaw<PlatformMemberRow[]>`
      SELECT sm.id             AS store_member_id,
             sm.store_id,
             sm.role,
             sm.permissions,
             m.keycloak_sub,
             m.username,
             m.email,
             m.first_name,
             m.last_name,
             m.is_active,
             m.has_password,
             m.disabled_at,
             m.provisional_expires_at,
             m.deleted_at
      FROM platform.store_members sm
      INNER JOIN platform.members m ON m.id = sm.member_id
      ORDER BY sm.created_at
    `;
    console.log(`store_members no platform: ${rows.length}`);

    for (const row of rows) {
      // A clínica raiz tem id == store_id (Fase 3), então o lookup é direto.
      const clinic = clinicByStoreId.get(row.store_id);
      if (!clinic) {
        // Loja de outra vertical (food/varejo) ou clínica ainda não provisionada.
        orphans.push(`${row.username} (store ${row.store_id})`);
        continue;
      }

      const existing = await prisma.member.findUnique({
        where: { id: row.store_member_id },
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.member.create({
          data: {
            // AQUI: preserva o id legado para não órfãos no histórico clínico.
            id: row.store_member_id,
            organizationId: clinic.organizationId,
            keycloakSub: row.keycloak_sub,
            username: row.username,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            status: row.is_active && !row.disabled_at ? 'active' : 'disabled',
            hasPassword: row.has_password,
            provisionalExpiresAt: row.provisional_expires_at,
            disabledAt: row.disabled_at,
            deletedAt: row.deleted_at,
          },
        });
        membersCreated += 1;

        await tx.clinicMember.create({
          data: {
            clinicId: clinic.id,
            memberId: row.store_member_id,
            role: row.role,
            permissions: (row.permissions ?? []) as object,
          },
        });
        linksCreated += 1;
      });
    }

    console.log('---');
    console.log(`members criados: ${membersCreated}`);
    console.log(`vínculos clinic_members: ${linksCreated}`);
    console.log(`já existentes (pulados): ${skipped}`);
    if (orphans.length) {
      console.log(
        `sem clínica correspondente (ignorados, provavelmente outra vertical): ${orphans.length}`,
      );
      for (const o of orphans) console.log(`  - ${o}`);
    }

    // Invariante que justifica o script: todo professionalId em uso deve resolver.
    const unresolved = await prisma.$queryRaw<Array<{ professional_id: string }>>`
      SELECT DISTINCT a.professional_id
      FROM clinica.appointments a
      WHERE a.professional_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM clinica.members m WHERE m.id = a.professional_id)
    `;
    if (unresolved.length > 0) {
      console.error(
        `ATENÇÃO: ${unresolved.length} professional_id em appointments não resolve para nenhum Member — histórico órfão`,
      );
      process.exitCode = 1;
    } else {
      console.log('invariante ok: todo professional_id de appointments resolve');
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main();
