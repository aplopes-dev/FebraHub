import 'dotenv/config';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '../src/shared/infra/prisma/prisma.module';
import { PrismaService } from '../src/shared/infra/prisma/prisma.service';
import { SYSTEM_PROFILE_CAIXA } from '../src/shared/infra/http/permissions/fine-to-coarse';

/**
 * Remove `pdv.operacao.caixa.withdrawal` dos perfis Caixa já provisionados.
 * Novos seeds já nascem sem a permissão (ver `fine-to-coarse.ts`).
 *
 * Uso:
 *   pnpm --filter @citybox/erp-api db:strip:caixa-withdrawal
 *   pnpm --filter @citybox/erp-api db:strip:caixa-withdrawal -- --apply
 */
@Module({ imports: [PrismaModule] })
class StripScriptModule {}

const WITHDRAWAL_PERMISSION = 'pdv.operacao.caixa.withdrawal';

function parseArgs(argv: string[]) {
  return { apply: argv.includes('--apply') };
}

async function run() {
  const { apply } = parseArgs(process.argv.slice(2));
  const dryRun = !apply;

  const app = await NestFactory.createApplicationContext(StripScriptModule, {
    logger: ['error', 'warn', 'log'],
  });
  const prisma = app.get(PrismaService);

  const profiles = await prisma.permissionProfile.findMany({
    where: { systemKey: SYSTEM_PROFILE_CAIXA, deletedAt: null },
    select: { id: true, organizationId: true, name: true, permissionIds: true },
  });

  const updates: {
    id: string;
    organizationId: string;
    before: number;
    after: number;
  }[] = [];

  for (const profile of profiles) {
    const ids = Array.isArray(profile.permissionIds)
      ? (profile.permissionIds as string[])
      : [];
    if (!ids.includes(WITHDRAWAL_PERMISSION)) continue;

    const next = ids.filter((id) => id !== WITHDRAWAL_PERMISSION);
    updates.push({
      id: profile.id,
      organizationId: profile.organizationId,
      before: ids.length,
      after: next.length,
    });

    if (!dryRun) {
      await prisma.permissionProfile.update({
        where: { id: profile.id },
        data: { permissionIds: next },
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? 'dry-run' : 'apply',
        permissionRemoved: WITHDRAWAL_PERMISSION,
        profilesScanned: profiles.length,
        profilesUpdated: updates.length,
        updates,
      },
      null,
      2,
    ),
  );

  await app.close();
  process.exit(0);
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
