import { randomUUID } from 'crypto';
import type { FiscalDocumentRepository } from '../domain/repositories/fiscal-document.repository.interface';
import { FiscalDocument } from '../domain/entities/fiscal-document.entity';
import { FiscalDocumentItem } from '../domain/entities/fiscal-document-item.entity';

/// Contrato compartilhado entre as implementações de `FiscalDocumentRepository`
/// (Prisma e in-memory). Existe porque o fake guardava a entidade recebida por
/// referência e, com isso, satisfazia trivialmente qualquer expectativa de
/// round-trip — foi assim que a ausência de escrita de `items` no Prisma
/// (D2) sobreviveu a 145 testes verdes. Rodar as mesmas asserções contra as
/// duas implementações impede que a divergência volte.

export type ContractContext = {
  repository: FiscalDocumentRepository;
  /// `companyId` precisa existir de verdade no Postgres (FK); no fake é livre.
  companyId: string;
  /// Chamado ao final de cada caso para o teste de integração limpar as linhas.
  onDocumentCreated?: (documentId: string) => void;
};

export function buildFiscalDocumentWithItems(
  companyId: string,
  itemCount: number,
): FiscalDocument {
  const now = new Date();
  const documentId = randomUUID();

  const document = FiscalDocument.with(
    {
      companyId,
      customerId: null,
      documentType: 'NFE',
      provider: 'SEFAZ_BA_NFE',
      environment: 'HOMOLOGATION',
      status: 'SIGNED',
      sourceSystem: 'contract-test',
      externalReference: `REF-${documentId}`,
      idempotencyKey: `KEY-${documentId}`,
      series: '1',
      number: '1',
      rpsSeries: null,
      rpsNumber: null,
      accessKey: null,
      verificationCode: null,
      protocol: null,
      totalAmount: 100 * itemCount,
      xmlObjectKey: null,
      errorCode: null,
      errorMessage: null,
      issuedAt: now,
      authorizedAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    documentId,
  );

  return document.withItems(
    Array.from({ length: itemCount }, (_, index) =>
      FiscalDocumentItem.with(
        {
          fiscalDocumentId: documentId,
          description: `ITEM ${index + 1}`,
          quantity: 2,
          unitValue: 50,
          totalValue: 100,
          itemType: 'PRODUCT',
          ncm: '22021000',
          cfop: '5102',
          cst: null,
          csosn: '102',
          serviceCode: null,
          taxJson: null,
        },
        randomUUID(),
      ),
    ),
  );
}

export function runFiscalDocumentRepositoryContract(
  buildContext: () => ContractContext | Promise<ContractContext>,
): void {
  it('persists the document items and reads them back (D2)', async () => {
    const ctx = await buildContext();
    const document = buildFiscalDocumentWithItems(ctx.companyId, 2);
    ctx.onDocumentCreated?.(document.id);

    await ctx.repository.save(document);
    const reloaded = await ctx.repository.findById(document.id);

    expect(reloaded).not.toBeNull();
    expect(reloaded!.items).toHaveLength(2);
    expect(reloaded!.items.map((item) => item.description).sort()).toEqual([
      'ITEM 1',
      'ITEM 2',
    ]);
    expect(reloaded!.items[0].totalValue).toBe(100);
  });

  /// O fluxo de emissão salva o mesmo documento duas vezes (SIGNED antes de
  /// transmitir, depois AUTHORIZED) — o segundo save não pode apagar nem
  /// duplicar os itens gravados pelo primeiro.
  it('keeps the items intact across a second save of the same document (D2/D3)', async () => {
    const ctx = await buildContext();
    const document = buildFiscalDocumentWithItems(ctx.companyId, 3);
    ctx.onDocumentCreated?.(document.id);
    await ctx.repository.save(document);

    const authorized = FiscalDocument.with(
      { ...document.props, status: 'AUTHORIZED', protocol: 'protocolo-123' },
      document.id,
    ).withItems(document.items);
    await ctx.repository.save(authorized);

    const reloaded = await ctx.repository.findById(document.id);

    expect(reloaded!.status).toBe('AUTHORIZED');
    expect(reloaded!.items).toHaveLength(3);
  });

  it('finds the document by its idempotency key (FR-013)', async () => {
    const ctx = await buildContext();
    const document = buildFiscalDocumentWithItems(ctx.companyId, 1);
    ctx.onDocumentCreated?.(document.id);
    await ctx.repository.save(document);

    const found = await ctx.repository.findByIdempotency({
      companyId: ctx.companyId,
      sourceSystem: document.sourceSystem,
      externalReference: document.externalReference,
      documentType: 'NFE',
      idempotencyKey: document.idempotencyKey,
    });

    expect(found?.id).toBe(document.id);
  });

  /// `search` (spec `009-facilita-nfe-screen`, FR-005) — casa contra
  /// `number`/`series`, resolvido no repositório (Constitution Princípio II:
  /// nunca no cliente). Cobre as duas implementações para não repetir D2/D3.
  it('filters by search on number/series, case-insensitive (FR-005)', async () => {
    const ctx = await buildContext();
    const target = buildFiscalDocumentWithItems(ctx.companyId, 1);
    ctx.onDocumentCreated?.(target.id);
    await ctx.repository.save(
      FiscalDocument.with(
        { ...target.props, number: 'UNIQUE-NUM-123', series: 'S1' },
        target.id,
      ).withItems(target.items),
    );

    const other = buildFiscalDocumentWithItems(ctx.companyId, 1);
    ctx.onDocumentCreated?.(other.id);
    await ctx.repository.save(
      FiscalDocument.with(
        { ...other.props, number: 'OTHER-999', series: 'S2' },
        other.id,
      ).withItems(other.items),
    );

    const found = await ctx.repository.findAll({
      companyId: ctx.companyId,
      skip: 0,
      take: 10,
      search: 'unique-num',
    });
    const total = await ctx.repository.count({
      companyId: ctx.companyId,
      search: 'unique-num',
    });

    expect(found.map((doc) => doc.id)).toContain(target.id);
    expect(found.map((doc) => doc.id)).not.toContain(other.id);
    expect(total).toBeGreaterThanOrEqual(1);
  });
}
