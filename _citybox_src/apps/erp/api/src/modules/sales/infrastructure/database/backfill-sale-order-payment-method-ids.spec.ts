import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { backfillSaleOrderPaymentMethodIds } from '../../../../../scripts/backfill-sale-order-payment-method-ids';

/**
 * Teste de integração (Postgres real) do backfill de
 * `sale_order_payments.method_id` (spec erp/030, B2) — chama a função
 * exportada pelo script, não uma reimplementação da lógica.
 */
describe('backfillSaleOrderPaymentMethodIds (spec erp/030, B2)', () => {
  const prisma = new PrismaService();
  const orgAId = randomUUID();
  const orgBId = randomUUID();

  let orgADinheiroId: string;
  let orgACartaoCreditoId: string;
  let saleOrderAId: string;

  beforeAll(async () => {
    await prisma.$connect();

    await prisma.organization.createMany({
      data: [
        {
          id: orgAId,
          personType: 'PJ',
          document: String(Date.now()).padStart(14, '0').slice(0, 14),
          legalName: 'Loja de Teste A — Backfill Pagamentos',
          email: `backfill-pagamentos-a-${randomUUID()}@example.test`,
          responsibleName: 'Responsável Teste',
        },
        {
          id: orgBId,
          personType: 'PJ',
          document: String(Date.now() + 1)
            .padStart(14, '0')
            .slice(0, 14),
          legalName: 'Loja de Teste B — Backfill Pagamentos',
          email: `backfill-pagamentos-b-${randomUUID()}@example.test`,
          responsibleName: 'Responsável Teste',
        },
      ],
    });

    const orgADinheiro = await prisma.paymentMethod.create({
      data: {
        organizationId: orgAId,
        name: 'Dinheiro',
        systemKey: 'pm-dinheiro',
        fiscalCode: '01',
        isSystem: true,
      },
    });
    orgADinheiroId = orgADinheiro.id;

    const orgACartaoCredito = await prisma.paymentMethod.create({
      data: {
        organizationId: orgAId,
        name: 'Cartão de Crédito',
        systemKey: 'pm-cartao',
        fiscalCode: '03',
        isSystem: true,
      },
    });
    orgACartaoCreditoId = orgACartaoCredito.id;

    // Forma excluída (soft-delete) com o MESMO systemKey de uma forma B
    // "real" — cobre a exclusão de `deletedAt` (achado do database-review).
    await prisma.paymentMethod.create({
      data: {
        organizationId: orgBId,
        name: 'Dinheiro (excluída)',
        systemKey: 'pm-dinheiro',
        fiscalCode: '01',
        isSystem: true,
        deletedAt: new Date(),
      },
    });

    const saleOrderA = await prisma.saleOrder.create({
      data: {
        organizationId: orgAId,
        number: 1,
        customerName: 'Cliente Teste',
        createdByName: 'Teste',
        totalCents: 30000,
      },
    });
    saleOrderAId = saleOrderA.id;

    const saleOrderB = await prisma.saleOrder.create({
      data: {
        organizationId: orgBId,
        number: 1,
        customerName: 'Cliente Teste',
        createdByName: 'Teste',
        totalCents: 10000,
      },
    });

    await prisma.saleOrderPayment.createMany({
      data: [
        {
          organizationId: orgAId,
          saleOrderId: saleOrderAId,
          amountCents: 10000,
          methodId: 'pm-dinheiro',
        },
        {
          organizationId: orgAId,
          saleOrderId: saleOrderAId,
          amountCents: 10000,
          methodId: 'pm-cartao-credito',
        },
        {
          organizationId: orgAId,
          saleOrderId: saleOrderAId,
          amountCents: 5000,
          methodId: 'pm-transferencia',
        },
        {
          organizationId: orgAId,
          saleOrderId: saleOrderAId,
          amountCents: 5000,
          methodId: orgADinheiroId,
        },
        // org B só tem uma forma "pm-dinheiro" excluída — não deve resolver
        // pra ela, deve permanecer como está (não confundir com a forma
        // "pm-dinheiro" ATIVA da org A, mesmo systemKey, org diferente).
        {
          organizationId: orgBId,
          saleOrderId: saleOrderB.id,
          amountCents: 10000,
          methodId: 'pm-dinheiro',
        },
      ],
    });

    await backfillSaleOrderPaymentMethodIds(prisma);
  });

  afterAll(async () => {
    await prisma.saleOrderPayment.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.saleOrder.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.paymentMethod.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [orgAId, orgBId] } },
    });
    await prisma.$disconnect();
  });

  it('resolve pm-dinheiro para o UUID real da forma Dinheiro', async () => {
    const payment = await prisma.saleOrderPayment.findFirst({
      where: {
        organizationId: orgAId,
        saleOrderId: saleOrderAId,
        amountCents: 10000,
        methodId: orgADinheiroId,
      },
    });
    expect(payment).not.toBeNull();
  });

  it('resolve pm-cartao-credito para o UUID real via systemKey pm-cartao', async () => {
    const payment = await prisma.saleOrderPayment.findFirst({
      where: { organizationId: orgAId, methodId: orgACartaoCreditoId },
    });
    expect(payment).not.toBeNull();
  });

  it('não altera pm-transferencia (sem forma de sistema correspondente)', async () => {
    const payment = await prisma.saleOrderPayment.findFirst({
      where: { organizationId: orgAId, methodId: 'pm-transferencia' },
    });
    expect(payment).not.toBeNull();
  });

  it('não altera um pagamento que já tinha UUID real', async () => {
    const payments = await prisma.saleOrderPayment.findMany({
      where: { organizationId: orgAId, methodId: orgADinheiroId },
    });
    // Duas linhas apontam para orgADinheiroId: a original (já UUID) e a que
    // veio de 'pm-dinheiro' — nenhuma se perdeu, nenhuma duplicou.
    expect(payments).toHaveLength(2);
  });

  it('não resolve pm-dinheiro da org B para uma forma de sistema excluída, nem para a forma ativa de outra organização', async () => {
    const payment = await prisma.saleOrderPayment.findFirst({
      where: { organizationId: orgBId, methodId: 'pm-dinheiro' },
    });
    // Permanece como está: a única forma "pm-dinheiro" da org B está
    // excluída (deletedAt != null), e a forma ativa "pm-dinheiro" pertence
    // à org A — nunca deveria vazar entre organizações.
    expect(payment).not.toBeNull();
    expect(payment?.methodId).toBe('pm-dinheiro');
    expect(payment?.methodId).not.toBe(orgADinheiroId);
  });

  it('rodar de novo não muda nada (idempotente)', async () => {
    const before = await prisma.saleOrderPayment.findMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
      orderBy: { id: 'asc' },
    });

    const secondRun = await backfillSaleOrderPaymentMethodIds(prisma);

    const after = await prisma.saleOrderPayment.findMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
      orderBy: { id: 'asc' },
    });

    expect(secondRun.resolved).toBe(0);
    expect(after.map((p) => p.methodId)).toEqual(before.map((p) => p.methodId));
  });
});
