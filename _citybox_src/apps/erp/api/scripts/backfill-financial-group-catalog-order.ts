import 'dotenv/config';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '../src/shared/infra/prisma/prisma.module';
import { PrismaService } from '../src/shared/infra/prisma/prisma.service';

/**
 * Backfill de renomeação para organizações já provisionadas antes da spec
 * `007-financeiro-ajustes-ui` (reestruturação das 9 categorias fixas da DRE).
 *
 * Só cobre o que `writeFinancialGroups`/`writeChartOfAccounts` (upsert de
 * provisionamento, ver `store-setup/infrastructure/database/writers/finance.writer.ts`)
 * de propósito **não** reescreve: o campo `name` de registro já existente —
 * essa proteção existe para não desfazer um nome que o lojista escolheu. Os
 * demais campos (`catalogOrder`, `sign`, `financialGroupId` da conta
 * "Outras despesas") já são reaplicados automaticamente por
 * `pnpm --filter @citybox/erp-api provision:orgs --force` (ou na próxima vez
 * que a organização for reprovisionada, já que a versão do template subiu
 * para 4) — **rode esse comando primeiro**, este script só cuida do rename.
 *
 * Cada rename só acontece se o nome atual ainda for o nome antigo conhecido —
 * se o lojista já renomeou o grupo/conta para outra coisa, o registro fica
 * intocado (mesma garantia dos writers de provisionamento).
 *
 * Idempotente: rodar de novo depois de aplicado não muda nada (o `where`
 * nunca mais casa).
 *
 * Uso: pnpm --filter @citybox/erp-api db:backfill:financial-group-catalog-order
 */
@Module({ imports: [PrismaModule] })
class BackfillScriptModule {}

const GROUP_RENAMES: ReadonlyArray<{
  systemKey: string;
  oldName: string;
  newName: string;
}> = [
  {
    systemKey: 'receitas',
    oldName: 'Receitas',
    newName: 'Receitas Operacionais',
  },
  { systemKey: 'custos', oldName: 'Custos', newName: 'Custos Operacionais' },
  {
    systemKey: 'despesas',
    oldName: 'Despesas',
    newName: 'Despesas Operacionais',
  },
  {
    systemKey: 'outras-receitas',
    oldName: 'Outras receitas',
    newName: 'Outras Receitas',
  },
];

const ACCOUNT_RENAMES: ReadonlyArray<{
  systemKey: string;
  oldName: string;
  newName: string;
}> = [
  {
    systemKey: 'vendas-mercadorias',
    oldName: 'Vendas de mercadorias',
    newName: 'Faturamento com venda de produtos',
  },
  {
    systemKey: 'prestacao-servicos',
    oldName: 'Prestação de serviços',
    newName: 'Faturamento com serviços',
  },
];

async function main(): Promise<void> {
  const context = await NestFactory.createApplicationContext(
    BackfillScriptModule,
    { logger: ['error', 'warn', 'log'] },
  );

  try {
    // Acesso cru (não `.scoped`) de propósito — mesmo padrão dos outros
    // backfills: script cross-organização, sem contexto de tenant de
    // requisição. O `where` já restringe por `systemKey` + nome antigo.
    const prisma = context.get(PrismaService);

    let groupsRenamed = 0;
    for (const rename of GROUP_RENAMES) {
      const result = await prisma.financialGroup.updateMany({
        where: { systemKey: rename.systemKey, name: rename.oldName },
        data: { name: rename.newName },
      });
      groupsRenamed += result.count;
    }

    let accountsRenamed = 0;
    for (const rename of ACCOUNT_RENAMES) {
      const result = await prisma.chartOfAccount.updateMany({
        where: { systemKey: rename.systemKey, name: rename.oldName },
        data: { name: rename.newName },
      });
      accountsRenamed += result.count;
    }

    console.log(
      `[backfill] concluído — ${groupsRenamed} grupo(s) financeiro(s) e ${accountsRenamed} conta(s) do plano renomeados. ` +
        'Lembrete: rode "pnpm --filter @citybox/erp-api provision:orgs --force" para aplicar catalogOrder/sign/reassociação de grupo em todas as organizações, se ainda não rodou.',
    );
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
