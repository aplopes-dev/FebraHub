import 'dotenv/config';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '../src/shared/infra/prisma/prisma.module';
import { PrismaService } from '../src/shared/infra/prisma/prisma.service';

/**
 * Backfill de `sale_order_payments.method_id` (spec erp/030, B2).
 *
 * `method_id` (`String`, sem FK) foi gravado historicamente com slugs do
 * catálogo mock do frontend (`pm-dinheiro`, `pm-boleto`, `pm-pix`,
 * `pm-cartao-debito`, `pm-cartao-credito`) em vez do UUID real de
 * `payment_methods.id` — nada travava a gravação errada, e isso bloqueava a
 * emissão de NF-e desses pedidos (o resolvedor de `tPag` não achava a forma
 * pelo id mock e caía no rótulo "desconhecida").
 *
 * `payment_methods.system_key` espelha os mesmos ids por design (ver
 * `SEED_PAYMENT_METHODS` em `finance.seed.ts`), com uma exceção: o slug de
 * crédito no mock é `pm-cartao-credito`, mas o `system_key` real da forma
 * "Cartão de Crédito" é `pm-cartao`. Os demais 4 batem 1:1. `pm-transferencia`
 * (mock) não tem forma de sistema correspondente — fica de fora, permanece
 * como está.
 *
 * Escopado por organização (`(organizationId, systemKey)` é `@@unique` no
 * schema, então nunca há ambiguidade de qual forma resolver) e ignora formas
 * excluídas (`deletedAt != null`) — um pagamento não pode passar a apontar
 * para uma forma removida.
 *
 * Idempotente: depois de rodado, nenhum pagamento mais casa a lista de ids
 * mock conhecidos, então rodar de novo não muda nada.
 *
 * Uso: pnpm --filter @citybox/erp-api db:backfill:sale-order-payment-method-ids
 */
@Module({ imports: [PrismaModule] })
class BackfillScriptModule {}

/** mock id (`SaleOrderPayment.methodId` histórico) → `PaymentMethod.systemKey` real. */
const MOCK_ID_TO_SYSTEM_KEY: ReadonlyMap<string, string> = new Map([
  ['pm-dinheiro', 'pm-dinheiro'],
  ['pm-boleto', 'pm-boleto'],
  ['pm-pix', 'pm-pix'],
  ['pm-cartao-debito', 'pm-cartao-debito'],
  ['pm-cartao-credito', 'pm-cartao'],
]);

export type BackfillResult = { resolved: number; unresolved: number };

/**
 * Lógica pura do backfill, separada de `main()` — testável sem subir um
 * `NestApplicationContext` inteiro, só com a `PrismaService` (mesmo padrão
 * de `backfill-sale-order-payment-method-ids.spec.ts`, que instancia a
 * própria `PrismaService` para o teste de integração).
 */
export async function backfillSaleOrderPaymentMethodIds(
  prisma: PrismaService,
): Promise<BackfillResult> {
  // Acesso cru (não `.scoped`) de propósito — script cross-organização, sem
  // contexto de tenant de requisição, mesmo padrão dos outros backfills
  // deste pacote.
  const pendingPayments = await prisma.saleOrderPayment.findMany({
    where: { methodId: { in: [...MOCK_ID_TO_SYSTEM_KEY.keys()] } },
    select: { organizationId: true, methodId: true },
    distinct: ['organizationId', 'methodId'],
  });

  let resolved = 0;
  let unresolved = 0;

  for (const pending of pendingPayments) {
    const systemKey = MOCK_ID_TO_SYSTEM_KEY.get(pending.methodId);
    if (!systemKey) continue; // impossível dado o `where`, guarda de tipo

    const method = await prisma.paymentMethod.findFirst({
      where: {
        organizationId: pending.organizationId,
        systemKey,
        deletedAt: null,
      },
    });

    if (!method) {
      unresolved += 1;
      console.warn(
        `[backfill] org ${pending.organizationId}: nenhuma forma com systemKey "${systemKey}" (de "${pending.methodId}") — pagamentos permanecem como estão.`,
      );
      continue;
    }

    const result = await prisma.saleOrderPayment.updateMany({
      where: {
        organizationId: pending.organizationId,
        methodId: pending.methodId,
      },
      data: { methodId: method.id },
    });
    resolved += result.count;
  }

  return { resolved, unresolved };
}

async function main(): Promise<void> {
  const context = await NestFactory.createApplicationContext(
    BackfillScriptModule,
    { logger: ['error', 'warn', 'log'] },
  );

  try {
    const prisma = context.get(PrismaService);
    const { resolved, unresolved } =
      await backfillSaleOrderPaymentMethodIds(prisma);

    console.log(
      `[backfill] concluído — ${resolved} pagamento(s) resolvido(s) para o UUID real da forma de pagamento` +
        (unresolved > 0
          ? `; ${unresolved} organização/id combinação(ões) sem forma de sistema correspondente (permanecem como estão).`
          : '.'),
    );
  } finally {
    await context.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
