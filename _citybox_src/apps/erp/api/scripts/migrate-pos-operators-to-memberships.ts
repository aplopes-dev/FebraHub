import 'dotenv/config';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '../src/shared/infra/prisma/prisma.module';
import { PrismaService } from '../src/shared/infra/prisma/prisma.service';
import { PDV_ALCADA_AUTHORIZE_PERMISSION } from '../src/shared/infra/http/permissions/permission-catalog';
import {
  SYSTEM_PROFILE_GERENTE,
  SYSTEM_PROFILE_ADMINISTRADOR,
} from '../src/shared/infra/http/permissions/fine-to-coarse';

/**
 * One-shot histórico: copia credenciais de `erp.pos_operators` → `memberships`.
 *
 * ⚠️ Só funciona enquanto a tabela `pos_operators` ainda existir. Depois da
 * migration `drop_pos_operators`, este script encerra com aviso.
 *
 * Matching (sem inventar User/Keycloak):
 * 1. Nome do operador == nome do User (trim, case-insensitive), na mesma org
 * 2. Preferência: membership ainda sem `pdvPinHash`
 * 3. Se `role=supervisor`, garante perfil com `pdv.operacao.alcada.authorize`
 *
 * Flags:
 *   --dry-run   só relatório (default)
 *   --apply     grava membership + soft-delete do PosOperator migrado
 *
 * Uso (antes do drop):
 *   pnpm --filter @citybox/erp-api db:migrate:pos-operators-to-memberships
 *   pnpm --filter @citybox/erp-api db:migrate:pos-operators-to-memberships -- --apply
 */
@Module({ imports: [PrismaModule] })
class MigrateScriptModule {}

type LegacyPosOperator = {
  id: string;
  organization_id: string;
  branch_id: string;
  code: string;
  name: string;
  role: string;
  pin_hash: string;
  pin_updated_at: Date | null;
  failed_attempts: number;
  locked_until: Date | null;
};

type MigrateRow = {
  posOperatorId: string;
  organizationId: string;
  branchId: string;
  code: string;
  name: string;
  role: string;
  status: 'migrated' | 'orphan' | 'skipped' | 'conflict';
  membershipId?: string;
  userId?: string;
  pdvCodeAssigned?: string;
  note?: string;
};

function parseArgs(argv: string[]) {
  return { apply: argv.includes('--apply') };
}

async function tableExists(prisma: PrismaService): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'erp'
        AND table_name = 'pos_operators'
    ) AS "exists"
  `;
  return Boolean(rows[0]?.exists);
}

async function resolveUniquePdvCode(
  prisma: PrismaService,
  organizationId: string,
  desired: string,
  excludeMembershipId?: string,
): Promise<string> {
  let candidate = desired.trim();
  let suffix = 2;
  for (;;) {
    const conflict = await prisma.membership.findFirst({
      where: {
        organizationId,
        active: true,
        pdvCode: candidate,
        pdvPinHash: { not: null },
        ...(excludeMembershipId ? { id: { not: excludeMembershipId } } : {}),
      },
      select: { id: true },
    });
    if (!conflict) return candidate;
    candidate = `${desired.trim()}-${suffix}`;
    suffix += 1;
  }
}

async function ensureAlcadaOnProfile(
  prisma: PrismaService,
  organizationId: string,
  membershipId: string,
  permissionProfileId: string | null,
  dryRun: boolean,
): Promise<string | undefined> {
  if (!permissionProfileId) {
    return 'membership sem perfil — atribua Gerente/Admin manualmente para alçada';
  }

  const profile = await prisma.permissionProfile.findFirst({
    where: { id: permissionProfileId, organizationId },
  });
  if (!profile) return 'perfil do membership não encontrado';

  const ids = Array.isArray(profile.permissionIds)
    ? (profile.permissionIds as string[])
    : [];
  if (ids.includes(PDV_ALCADA_AUTHORIZE_PERMISSION)) return undefined;

  const gerenteOrAdmin = await prisma.permissionProfile.findFirst({
    where: {
      organizationId,
      systemKey: {
        in: [SYSTEM_PROFILE_GERENTE, SYSTEM_PROFILE_ADMINISTRADOR],
      },
    },
    orderBy: { systemKey: 'asc' },
  });

  if (!gerenteOrAdmin) {
    return 'supervisor sem alcada no perfil e sem perfil Gerente/Admin na org';
  }

  if (!dryRun) {
    await prisma.membership.update({
      where: { id: membershipId },
      data: { permissionProfileId: gerenteOrAdmin.id },
    });
  }

  return `perfil trocado para ${gerenteOrAdmin.systemKey ?? gerenteOrAdmin.name} (alçada)`;
}

async function run() {
  const { apply } = parseArgs(process.argv.slice(2));
  const dryRun = !apply;

  const app = await NestFactory.createApplicationContext(MigrateScriptModule, {
    logger: ['error', 'warn', 'log'],
  });
  const prisma = app.get(PrismaService);

  if (!(await tableExists(prisma))) {
    console.log(
      JSON.stringify({
        mode: dryRun ? 'dry-run' : 'apply',
        skipped: true,
        reason:
          'Tabela erp.pos_operators não existe (já dropada). Nada a migrar.',
      }),
    );
    await app.close();
    process.exit(0);
  }

  const operators = await prisma.$queryRaw<LegacyPosOperator[]>`
    SELECT
      id,
      organization_id,
      branch_id,
      code,
      name,
      role::text AS role,
      pin_hash,
      pin_updated_at,
      failed_attempts,
      locked_until
    FROM erp.pos_operators
    WHERE deleted_at IS NULL
    ORDER BY organization_id ASC, code ASC
  `;

  const report: MigrateRow[] = [];

  for (const operator of operators) {
    const members = await prisma.membership.findMany({
      where: {
        organizationId: operator.organization_id,
        active: true,
        user: {
          name: {
            equals: operator.name.trim(),
            mode: 'insensitive',
          },
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        branchAccess: { select: { branchId: true } },
      },
    });

    const ranked = [...members].sort((a, b) => {
      const aHasPin = a.pdvPinHash ? 1 : 0;
      const bHasPin = b.pdvPinHash ? 1 : 0;
      if (aHasPin !== bHasPin) return aHasPin - bHasPin;
      const aBranch = a.branchAccess.some((x) => x.branchId === operator.branch_id)
        ? 0
        : 1;
      const bBranch = b.branchAccess.some((x) => x.branchId === operator.branch_id)
        ? 0
        : 1;
      return aBranch - bBranch;
    });

    const match = ranked[0];
    if (!match) {
      report.push({
        posOperatorId: operator.id,
        organizationId: operator.organization_id,
        branchId: operator.branch_id,
        code: operator.code,
        name: operator.name,
        role: operator.role,
        status: 'orphan',
        note: 'sem Membership com User.name igual — crie o usuário no ERP e rode de novo',
      });
      continue;
    }

    if (match.pdvPinHash && match.pdvCode) {
      report.push({
        posOperatorId: operator.id,
        organizationId: operator.organization_id,
        branchId: operator.branch_id,
        code: operator.code,
        name: operator.name,
        role: operator.role,
        status: 'skipped',
        membershipId: match.id,
        userId: match.userId,
        pdvCodeAssigned: match.pdvCode,
        note: 'membership já tem credencial PDV',
      });
      if (!dryRun) {
        await prisma.$executeRaw`
          UPDATE erp.pos_operators
          SET deleted_at = NOW()
          WHERE id = ${operator.id}::uuid
        `;
      }
      continue;
    }

    const pdvCodeAssigned = await resolveUniquePdvCode(
      prisma,
      operator.organization_id,
      operator.code,
      match.id,
    );
    const codeChanged = pdvCodeAssigned !== operator.code;

    let alcadaNote: string | undefined;
    if (operator.role === 'supervisor') {
      alcadaNote = await ensureAlcadaOnProfile(
        prisma,
        operator.organization_id,
        match.id,
        match.permissionProfileId,
        dryRun,
      );
    }

    if (!dryRun) {
      await prisma.membership.update({
        where: { id: match.id },
        data: {
          pdvCode: pdvCodeAssigned,
          pdvPinHash: operator.pin_hash,
          pdvPinUpdatedAt: operator.pin_updated_at,
          pdvFailedAttempts: operator.failed_attempts,
          pdvLockedUntil: operator.locked_until,
        },
      });

      const hasBranch =
        match.role !== 'MEMBER' ||
        match.branchAccess.some((x) => x.branchId === operator.branch_id);
      if (!hasBranch) {
        await prisma.branchAccess.create({
          data: {
            organizationId: operator.organization_id,
            membershipId: match.id,
            branchId: operator.branch_id,
          },
        });
      }

      await prisma.$executeRaw`
        UPDATE erp.pos_operators
        SET deleted_at = NOW()
        WHERE id = ${operator.id}::uuid
      `;
    }

    report.push({
      posOperatorId: operator.id,
      organizationId: operator.organization_id,
      branchId: operator.branch_id,
      code: operator.code,
      name: operator.name,
      role: operator.role,
      status: codeChanged ? 'conflict' : 'migrated',
      membershipId: match.id,
      userId: match.userId,
      pdvCodeAssigned,
      note: [
        codeChanged
          ? `código remapeado ${operator.code} → ${pdvCodeAssigned}`
          : null,
        alcadaNote,
        dryRun ? 'dry-run' : null,
      ]
        .filter(Boolean)
        .join('; ') || undefined,
    });
  }

  const orphans = report.filter((r) => r.status === 'orphan');
  const migrated = report.filter(
    (r) => r.status === 'migrated' || r.status === 'conflict',
  );
  const skipped = report.filter((r) => r.status === 'skipped');

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? 'dry-run' : 'apply',
        totals: {
          operators: operators.length,
          migrated: migrated.length,
          skipped: skipped.length,
          orphans: orphans.length,
        },
        cutoverBlocked: orphans.length > 0,
        rows: report,
      },
      null,
      2,
    ),
  );

  if (orphans.length > 0) {
    console.error(
      `\n⚠️  ${orphans.length} órfão(s) — cutover bloqueado até criar Membership correspondente.`,
    );
  }

  await app.close();
  process.exit(orphans.length > 0 && apply ? 1 : 0);
}

void run().catch(async (error: unknown) => {
  console.error(error);
  process.exit(1);
});
