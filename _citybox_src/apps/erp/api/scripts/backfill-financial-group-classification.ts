import 'dotenv/config';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '../src/shared/infra/prisma/prisma.module';
import { PrismaService } from '../src/shared/infra/prisma/prisma.service';

/**
 * Backfill de classificação dos grupos financeiros de sistema para
 * organizações existentes (criadas antes desta feature) — ver
 * specs/erp/003-financial-reports-cost-center/research.md D2.
 *
 * `caixa-e-bancos` e `ativo` são patrimoniais (sangria/suprimento de caixa,
 * recebimento de cliente), não resultado do período — sem esta correção eles
 * entrariam na DRE como receita, inflando o resultado. Organizações novas já
 * nascem corretas via `finance.seed.ts` + `writeFinancialGroups` (ver T007);
 * este script cobre só o que já existe no banco.
 *
 * Idempotente: um `updateMany` por `systemKey`, roda sem efeito colateral se
 * já aplicado antes.
 *
 * Uso: pnpm --filter @citybox/erp-api db:backfill:financial-group-classification
 */
@Module({ imports: [PrismaModule] })
class BackfillScriptModule {}

const PATRIMONIAL_SYSTEM_KEYS = ['caixa-e-bancos', 'ativo'];

async function main(): Promise<void> {
  const context = await NestFactory.createApplicationContext(
    BackfillScriptModule,
    { logger: ['error', 'warn', 'log'] },
  );

  try {
    // Acesso cru (não `.scoped`) de propósito: script cross-organização, sem
    // contexto de tenant de requisição — o `where` já filtra por
    // `systemKey`, que só existe em registros de sistema.
    const prisma = context.get(PrismaService);
    const result = await prisma.financialGroup.updateMany({
      where: { systemKey: { in: PATRIMONIAL_SYSTEM_KEYS } },
      data: { classification: 'patrimonial' },
    });

    console.log(
      `[backfill] concluído — ${result.count} grupo(s) financeiro(s) de sistema corrigido(s) para "patrimonial"`,
    );
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
