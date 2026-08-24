import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { PrismaSaleOrderRepository } from './prisma-sale-order.repository';
import { SaleOrder } from '../../domain/entities/sale-order.entity';
import { addDays } from '../../../finance/card-contracts/domain/services/business-day-calendar';

/**
 * Teste de integração do motor de recebíveis (Postgres real, sem mock de
 * banco — convenção do projeto). Cobre a "fiação" que os testes unitários da
 * calculadora não alcançam: contrato/método salvos no Postgres → resolvidos
 * via `resolveCardSettlement` → calculados via `calculateCardSettlement` →
 * gravados em `FinancialEntry`. A matemática de datas/valores em si já está
 * coberta exaustivamente em `card-settlement-calculator.spec.ts` e
 * `business-day-calendar.spec.ts` — aqui a preocupação é o *round-trip* real
 * (Decimal do Postgres → string → number, FKs, idempotência).
 *
 * Cenários do quickstart.md: 2.1 (débito com taxa), 2.5 (Pix), 2.9 (pedido
 * misto dinheiro+cartão), 2.10 (zero regressão em pedido só-dinheiro). Os
 * cenários 2.3/2.4/2.6 (parcelamento/progressiva) e 2.7/2.8
 * (fallback/idempotência) foram adicionados a este mesmo arquivo nas fases
 * US3/US4 (T026-T029).
 */
describe('PrismaSaleOrderRepository — motor de recebíveis (Postgres real)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaSaleOrderRepository(prisma);
  const organizationId = randomUUID();

  let productId: string;

  beforeAll(async () => {
    await prisma.$connect();

    await prisma.organization.create({
      data: {
        id: organizationId,
        personType: 'PJ',
        document: String(Date.now()).padStart(14, '0').slice(0, 14),
        legalName: 'Loja de Teste — Motor de Recebíveis',
        email: `motor-recebiveis-${randomUUID()}@example.test`,
        responsibleName: 'Responsável Teste',
      },
    });

    const category = await prisma.productCategory.create({
      data: { organizationId, name: 'Serviços (teste)' },
    });

    const product = await prisma.product.create({
      data: {
        organizationId,
        name: 'Serviço genérico (teste)',
        sku: `SRV-${randomUUID().slice(0, 8)}`,
        categoryId: category.id,
        trackStock: false,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    // `Organization` cascateia para todos os models tenant-scoped
    // (`onDelete: Cascade` em toda relação `organization` do schema) — apagar
    // a organização limpa tudo que este teste criou.
    await prisma.organization.delete({ where: { id: organizationId } });
    await prisma.$disconnect();
  });

  /**
   * Cada teste que cadastra um `CardContract` usa a sua PRÓPRIA conta
   * bancária — `resolveCardSettlement` busca por `bankAccountId` entre
   * *todos* os contratos ativos daquela conta (research.md D6), então
   * reaproveitar a mesma conta entre testes faria um contrato de um teste
   * "vazar" e ser escolhido no lugar do contrato que outro teste acabou de
   * criar (o mais antigo por `createdAt` vence).
   */
  async function createBankAccount(name: string): Promise<string> {
    const bankAccount = await prisma.bankAccount.create({
      data: { organizationId, name, openedAt: new Date() },
    });
    return bankAccount.id;
  }

  async function closeSaleOrder(
    payments: Array<{
      amountCents: number;
      methodId: string;
      bankAccountId?: string | null;
      cardPaymentType?: 'pix' | 'debit' | 'credit';
      brand?: string | null;
      installments?: number;
    }>,
    totalCents: number,
  ) {
    const number = await repository.nextNumber(organizationId);
    const saleOrder = SaleOrder.create({
      organizationId,
      number,
      customerName: 'Cliente Teste',
      createdByName: 'Operador Teste',
      status: 'closed',
      lines: [
        {
          productId,
          quantity: '1',
          unitPriceCents: totalCents,
        },
      ],
      payments,
    });

    const saved = await repository.saveWithOptionalMovement(saleOrder, null);

    const entries = await prisma.financialEntry.findMany({
      where: { organizationId, saleOrderId: saved.id },
      orderBy: [{ saleOrderPaymentId: 'asc' }, { installmentSequence: 'asc' }],
    });

    return { saleOrder: saved, entries };
  }

  it('2.1 — débito Visa 2,3% D+1 corrido: recebível líquido, não quitado, vencendo no dia seguinte', async () => {
    const scopedBankAccountId = await createBankAccount('Conta 2.1');
    const contract = await prisma.cardContract.create({
      data: {
        organizationId,
        provider: 'Stone',
        bankAccountId: scopedBankAccountId,
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'calendar_days',
        businessDaysOnly: false,
      },
    });
    await prisma.cardPaymentMethod.create({
      data: {
        organizationId,
        cardContractId: contract.id,
        type: 'debit',
        brand: 'Visa',
        rate: '2.3',
        firstPaymentDays: 1,
      },
    });

    const before = new Date();
    const { entries } = await closeSaleOrder(
      [
        {
          amountCents: 10000,
          methodId: 'pm-cartao-debito',
          bankAccountId: scopedBankAccountId,
          cardPaymentType: 'debit',
          brand: 'Visa',
        },
      ],
      10000,
    );

    expect(entries).toHaveLength(1);
    const [entry] = entries;
    expect(entry.amountCents).toBe(9770);
    expect(entry.grossAmountCents).toBe(10000);
    expect(entry.acquirerFeeCents).toBe(230);
    expect(entry.paidCents).toBe(0);
    expect(entry.status).toBe('pending');
    expect(entry.cardSettlementFallback).toBe(false);
    expect(entry.cardContractId).toBe(contract.id);
    expect(entry.installmentSequence).toBe(1);
    expect(entry.installmentCount).toBe(1);

    const expectedDueDate = addDays(before, 1, 'calendar_days');
    expect(entry.dueDate.toDateString()).toBe(expectedDueDate.toDateString());
  });

  it('2.5 — Pix com taxa 0 e prazo 0: valor cheio, vencendo no mesmo dia', async () => {
    const scopedBankAccountId = await createBankAccount('Conta 2.5');
    const contract = await prisma.cardContract.create({
      data: {
        organizationId,
        provider: 'Stone',
        bankAccountId: scopedBankAccountId,
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'calendar_days',
      },
    });
    await prisma.cardPaymentMethod.create({
      data: {
        organizationId,
        cardContractId: contract.id,
        type: 'pix',
        brand: null,
        rate: '0',
        firstPaymentDays: 0,
      },
    });

    const today = new Date();
    const { entries } = await closeSaleOrder(
      [
        {
          amountCents: 5000,
          methodId: 'pm-pix',
          bankAccountId: scopedBankAccountId,
          cardPaymentType: 'pix',
        },
      ],
      5000,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].amountCents).toBe(5000);
    expect(entries[0].acquirerFeeCents).toBe(0);
    expect(entries[0].dueDate.toDateString()).toBe(today.toDateString());
  });

  it('2.9 — pedido misto dinheiro + cartão: 2 FinancialEntry (1 agregado + 1 do motor)', async () => {
    const scopedBankAccountId = await createBankAccount('Conta 2.9');
    const contract = await prisma.cardContract.create({
      data: {
        organizationId,
        provider: 'Cielo',
        bankAccountId: scopedBankAccountId,
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'calendar_days',
      },
    });
    await prisma.cardPaymentMethod.create({
      data: {
        organizationId,
        cardContractId: contract.id,
        type: 'debit',
        brand: 'Mastercard',
        rate: '2.0',
        firstPaymentDays: 1,
      },
    });

    const { entries } = await closeSaleOrder(
      [
        { amountCents: 5000, methodId: 'pm-dinheiro' },
        {
          amountCents: 10000,
          methodId: 'pm-cartao-debito',
          bankAccountId: scopedBankAccountId,
          cardPaymentType: 'debit',
          brand: 'Mastercard',
        },
      ],
      15000,
    );

    expect(entries).toHaveLength(2);
    const aggregate = entries.find(
      (entry) => entry.saleOrderPaymentId === null,
    );
    const cardEntry = entries.find(
      (entry) => entry.saleOrderPaymentId !== null,
    );

    expect(aggregate).toBeDefined();
    expect(aggregate?.amountCents).toBe(5000);
    expect(aggregate?.paidCents).toBe(5000);
    expect(aggregate?.status).toBe('paid');
    expect(aggregate?.grossAmountCents).toBeNull();

    expect(cardEntry).toBeDefined();
    expect(cardEntry?.amountCents).toBe(9800);
    expect(cardEntry?.paidCents).toBe(0);
  });

  it('2.3 — crédito 6x com single_payment: exatamente 1 FinancialEntry com o líquido total (US3)', async () => {
    const scopedBankAccountId = await createBankAccount('Conta 2.3');
    const contract = await prisma.cardContract.create({
      data: {
        organizationId,
        provider: 'Rede',
        bankAccountId: scopedBankAccountId,
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'single_payment',
      },
    });
    await prisma.cardPaymentMethod.create({
      data: {
        organizationId,
        cardContractId: contract.id,
        type: 'credit',
        brand: 'Visa',
        rate: '5',
        firstPaymentDays: 30,
        daysBetweenInstallments: 30,
      },
    });

    const { entries } = await closeSaleOrder(
      [
        {
          amountCents: 60000,
          methodId: 'pm-cartao-credito',
          bankAccountId: scopedBankAccountId,
          cardPaymentType: 'credit',
          brand: 'Visa',
          installments: 6,
        },
      ],
      60000,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].installmentSequence).toBe(1);
    expect(entries[0].installmentCount).toBe(1);
    expect(entries[0].amountCents).toBe(57000); // 60000 - 5%
  });

  it('2.4 — crédito 6x em dias corridos: 6 FinancialEntry, soma líquida exata (US3)', async () => {
    const scopedBankAccountId = await createBankAccount('Conta 2.4');
    const contract = await prisma.cardContract.create({
      data: {
        organizationId,
        provider: 'Rede',
        bankAccountId: scopedBankAccountId,
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'calendar_days',
      },
    });
    await prisma.cardPaymentMethod.create({
      data: {
        organizationId,
        cardContractId: contract.id,
        type: 'credit',
        brand: 'Mastercard',
        rate: '5',
        firstPaymentDays: 30,
        daysBetweenInstallments: 30,
      },
    });

    const { entries } = await closeSaleOrder(
      [
        {
          amountCents: 60001, // proposital: não divide igualmente por 6
          methodId: 'pm-cartao-credito',
          bankAccountId: scopedBankAccountId,
          cardPaymentType: 'credit',
          brand: 'Mastercard',
          installments: 6,
        },
      ],
      60001,
    );

    expect(entries).toHaveLength(6);
    entries.forEach((entry, index) => {
      expect(entry.installmentSequence).toBe(index + 1);
      expect(entry.installmentCount).toBe(6);
    });

    const totalNet = entries.reduce((sum, entry) => sum + entry.amountCents, 0);
    const expectedTotalNet = 60001 - Math.round(60001 * 0.05);
    expect(totalNet).toBe(expectedTotalNet);
  });

  it('2.6 — faixa progressiva: 5 parcelas cai na faixa 4-6x, não na 1-3x (US3)', async () => {
    const scopedBankAccountId = await createBankAccount('Conta 2.6');
    const contract = await prisma.cardContract.create({
      data: {
        organizationId,
        provider: 'Getnet',
        bankAccountId: scopedBankAccountId,
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'single_payment',
      },
    });
    const method = await prisma.cardPaymentMethod.create({
      data: {
        organizationId,
        cardContractId: contract.id,
        type: 'credit',
        brand: 'Elo',
        progressiveEnabled: true,
        firstPaymentDays: 30,
        daysBetweenInstallments: 30,
      },
    });
    await prisma.cardRateTier.createMany({
      data: [
        {
          organizationId,
          cardPaymentMethodId: method.id,
          minInstallments: 1,
          maxInstallments: 3,
          rate: '3',
        },
        {
          organizationId,
          cardPaymentMethodId: method.id,
          minInstallments: 4,
          maxInstallments: 6,
          rate: '4',
        },
      ],
    });

    const { entries } = await closeSaleOrder(
      [
        {
          amountCents: 100000,
          methodId: 'pm-cartao-credito',
          bankAccountId: scopedBankAccountId,
          cardPaymentType: 'credit',
          brand: 'Elo',
          installments: 5,
        },
      ],
      100000,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].acquirerFeeCents).toBe(4000); // 4% — não 3%
    expect(entries[0].cardPaymentMethodId).toBe(method.id);
  });

  it('2.7a — sem nenhum CardContract cadastrado: fallback bruto, venda não falha (US4)', async () => {
    const freshBankAccount = await prisma.bankAccount.create({
      data: {
        organizationId,
        name: 'Conta sem contrato',
        openedAt: new Date(),
      },
    });

    const { entries } = await closeSaleOrder(
      [
        {
          amountCents: 10000,
          methodId: 'pm-cartao-credito',
          bankAccountId: freshBankAccount.id,
          cardPaymentType: 'credit',
          brand: 'Visa',
          installments: 3,
        },
      ],
      10000,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].amountCents).toBe(10000);
    expect(entries[0].paidCents).toBe(10000);
    expect(entries[0].status).toBe('paid');
    expect(entries[0].cardSettlementFallback).toBe(true);
    expect(entries[0].grossAmountCents).toBeNull();
    expect(entries[0].cardContractId).toBeNull();
  });

  it('2.7b — contrato existe mas sem método para a bandeira usada: fallback bruto (US4)', async () => {
    const scopedBankAccountId = await createBankAccount('Conta 2.7b');
    const contract = await prisma.cardContract.create({
      data: {
        organizationId,
        provider: 'Cielo',
        bankAccountId: scopedBankAccountId,
      },
    });
    await prisma.cardPaymentMethod.create({
      data: {
        organizationId,
        cardContractId: contract.id,
        type: 'credit',
        brand: 'Visa',
        rate: '3',
      },
    });

    const { entries } = await closeSaleOrder(
      [
        {
          amountCents: 7000,
          methodId: 'pm-cartao-credito',
          bankAccountId: scopedBankAccountId,
          cardPaymentType: 'credit',
          brand: 'Elo', // não cadastrado neste contrato
          installments: 1,
        },
      ],
      7000,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].cardSettlementFallback).toBe(true);
    expect(entries[0].amountCents).toBe(7000);
  });

  it('2.7c — contrato inativado (active=false, não excluído): fallback bruto (US4)', async () => {
    const freshBankAccount = await prisma.bankAccount.create({
      data: {
        organizationId,
        name: 'Conta contrato inativo',
        openedAt: new Date(),
      },
    });
    const contract = await prisma.cardContract.create({
      data: {
        organizationId,
        provider: 'Cielo',
        bankAccountId: freshBankAccount.id,
        active: false,
      },
    });
    await prisma.cardPaymentMethod.create({
      data: {
        organizationId,
        cardContractId: contract.id,
        type: 'debit',
        brand: 'Visa',
        rate: '2',
      },
    });

    const { entries } = await closeSaleOrder(
      [
        {
          amountCents: 4000,
          methodId: 'pm-cartao-debito',
          bankAccountId: freshBankAccount.id,
          cardPaymentType: 'debit',
          brand: 'Visa',
        },
      ],
      4000,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].cardSettlementFallback).toBe(true);
  });

  it('2.8 — reprocessar o mesmo fechamento não duplica recebíveis (idempotência, US4)', async () => {
    const scopedBankAccountId = await createBankAccount('Conta 2.8');
    const contract = await prisma.cardContract.create({
      data: {
        organizationId,
        provider: 'Rede',
        bankAccountId: scopedBankAccountId,
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'calendar_days',
      },
    });
    await prisma.cardPaymentMethod.create({
      data: {
        organizationId,
        cardContractId: contract.id,
        type: 'credit',
        brand: 'Visa',
        rate: '5',
        firstPaymentDays: 30,
        daysBetweenInstallments: 30,
      },
    });

    const number = await repository.nextNumber(organizationId);
    const saleOrder = SaleOrder.create({
      organizationId,
      number,
      customerName: 'Cliente Idempotência',
      createdByName: 'Operador Teste',
      status: 'closed',
      lines: [{ productId, quantity: '1', unitPriceCents: 60000 }],
      payments: [
        {
          amountCents: 60000,
          methodId: 'pm-cartao-credito',
          bankAccountId: scopedBankAccountId,
          cardPaymentType: 'credit',
          brand: 'Visa',
          installments: 6,
        },
      ],
    });

    // Fecha o pedido, depois recarrega (como `UpdateSaleOrderStatusUseCase`
    // faz via `findById` antes de reenviar) e fecha de novo — reproduz
    // fielmente o reprocessamento real, em que `payments[].id` só se mantém
    // estável porque vem do banco, não do objeto original em memória.
    const first = await repository.saveWithOptionalMovement(saleOrder, null);
    const reloaded = await repository.findById(organizationId, first.id);
    expect(reloaded).not.toBeNull();
    const second = await repository.saveWithOptionalMovement(
      reloaded!.saleOrder,
      null,
    );
    expect(second.id).toBe(first.id);

    const entries = await prisma.financialEntry.findMany({
      where: { organizationId, saleOrderId: saleOrder.id },
    });
    expect(entries).toHaveLength(6);
  });

  it('2.10 — pedido só em dinheiro: exatamente 1 FinancialEntry, formato de hoje (zero regressão)', async () => {
    const { entries } = await closeSaleOrder(
      [{ amountCents: 8000, methodId: 'pm-dinheiro' }],
      8000,
    );

    expect(entries).toHaveLength(1);
    const [entry] = entries;
    expect(entry.amountCents).toBe(8000);
    expect(entry.paidCents).toBe(8000);
    expect(entry.status).toBe('paid');
    expect(entry.saleOrderPaymentId).toBeNull();
    expect(entry.grossAmountCents).toBeNull();
    expect(entry.acquirerFeeCents).toBeNull();
    expect(entry.cardSettlementFallback).toBe(false);
  });
});
