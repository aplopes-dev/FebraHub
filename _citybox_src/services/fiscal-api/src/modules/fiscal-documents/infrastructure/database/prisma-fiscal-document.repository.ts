import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  FiscalDocumentRepository,
  type IdempotencyLookup,
  type ListFiscalDocumentsCriteria,
} from '../../domain/repositories/fiscal-document.repository.interface';
import {
  FiscalDocument,
  type FiscalDocumentProps,
  type FiscalDocumentEnvironment,
  type FiscalDocumentProvider,
  type FiscalDocumentStatus,
  type FiscalDocumentType,
} from '../../domain/entities/fiscal-document.entity';
import { FiscalDocumentItem } from '../../domain/entities/fiscal-document-item.entity';

type Decimal = { toNumber(): number };

type FiscalDocumentItemRow = {
  id: string;
  fiscalDocumentId: string;
  description: string;
  quantity: Decimal;
  unitValue: Decimal;
  totalValue: Decimal;
  itemType: string;
  ncm: string | null;
  cfop: string | null;
  cst: string | null;
  csosn: string | null;
  serviceCode: string | null;
  taxJson: unknown;
};

type FiscalDocumentRow = {
  id: string;
  companyId: string;
  customerId: string | null;
  customer?: { name: string } | null;
  documentType: string;
  provider: string;
  environment: string;
  status: string;
  sourceSystem: string;
  externalReference: string;
  idempotencyKey: string;
  series: string | null;
  number: string | null;
  rpsSeries: string | null;
  rpsNumber: string | null;
  accessKey: string | null;
  verificationCode: string | null;
  protocol: string | null;
  totalAmount: Decimal;
  xmlObjectKey: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  issuedAt: Date | null;
  authorizedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items?: FiscalDocumentItemRow[];
};

@Injectable()
export class PrismaFiscalDocumentRepository extends FiscalDocumentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<FiscalDocument | null> {
    const row = await this.prisma.fiscalDocument.findUnique({
      where: { id },
      include: { items: true, customer: { select: { name: true } } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdempotency(
    lookup: IdempotencyLookup,
  ): Promise<FiscalDocument | null> {
    const row = await this.prisma.fiscalDocument.findUnique({
      where: {
        idempotency_key: {
          companyId: lookup.companyId,
          sourceSystem: lookup.sourceSystem,
          externalReference: lookup.externalReference,
          documentType: lookup.documentType,
          idempotencyKey: lookup.idempotencyKey,
        },
      },
      include: { items: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    criteria: ListFiscalDocumentsCriteria,
  ): Promise<FiscalDocument[]> {
    const rows = await this.prisma.fiscalDocument.findMany({
      where: this.toWhere(criteria),
      skip: criteria.skip,
      take: criteria.take,
      orderBy: { createdAt: 'desc' },
      // Sem o include, `toEntity` monta a entidade sem itens e o presenter
      // serializa `items: []` — indistinguível de uma nota que realmente não
      // tem itens. A listagem é paginada (`take`), então o custo é limitado.
      // `customer` só o `name` — alimenta a coluna "Cliente" da tela Facilita
      // NFE (join de leitura, `withCustomerName`, ver domínio).
      include: { items: true, customer: { select: { name: true } } },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async count(
    criteria: Omit<ListFiscalDocumentsCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.prisma.fiscalDocument.count({ where: this.toWhere(criteria) });
  }

  async save(document: FiscalDocument): Promise<FiscalDocument> {
    const itemRows = document.items.map((item) => this.toItemRow(item));
    // O fluxo de emissão salva o mesmo documento duas vezes (SIGNED antes de
    // transmitir, depois AUTHORIZED/REJECTED). Só reescrever os itens quando a
    // entidade de fato os carrega — um save sem itens (ex.: transição de status
    // vinda de um documento recarregado) não pode apagar os já gravados.
    const hasItems = itemRows.length > 0;

    const row = await this.prisma.fiscalDocument.upsert({
      where: { id: document.id },
      create: {
        ...this.toRow(document),
        ...(hasItems ? { items: { create: itemRows } } : {}),
      },
      update: {
        ...this.toRow(document),
        ...(hasItems ? { items: { deleteMany: {}, create: itemRows } } : {}),
      },
      include: { items: true },
    });
    return this.toEntity(row);
  }

  private toItemRow(item: FiscalDocumentItem) {
    return {
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitValue: item.unitValue,
      totalValue: item.totalValue,
      itemType: item.itemType,
      ncm: item.ncm,
      cfop: item.cfop,
      cst: item.cst,
      csosn: item.csosn,
      serviceCode: item.serviceCode,
      // `Record<string, unknown>` do domínio não casa com o `InputJsonValue`
      // do Prisma (que exige valores serializáveis provados em tipo). Mesmo
      // padrão de cast já usado para `address`/`responsePayload` nos outros
      // repositórios deste módulo. `null` vira `undefined` para o Prisma
      // gravar NULL em vez de tentar o literal JSON `null`.
      taxJson: (item.taxJson ?? undefined) as
        | Prisma.InputJsonObject
        | undefined,
    };
  }

  private toRow(document: FiscalDocument) {
    return {
      id: document.id,
      companyId: document.companyId,
      customerId: document.customerId,
      documentType: document.documentType,
      provider: document.provider,
      environment: document.environment,
      status: document.status,
      sourceSystem: document.sourceSystem,
      externalReference: document.externalReference,
      idempotencyKey: document.idempotencyKey,
      series: document.series,
      number: document.number,
      rpsSeries: document.rpsSeries,
      rpsNumber: document.rpsNumber,
      accessKey: document.accessKey,
      verificationCode: document.verificationCode,
      protocol: document.protocol,
      totalAmount: document.totalAmount,
      xmlObjectKey: document.xmlObjectKey,
      errorCode: document.errorCode,
      errorMessage: document.errorMessage,
      issuedAt: document.issuedAt,
      authorizedAt: document.authorizedAt,
      cancelledAt: document.cancelledAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  private toWhere(criteria: {
    companyId: string;
    documentType?: string;
    status?: string;
    sourceSystem?: string;
    externalReference?: string;
    issuedFrom?: Date;
    issuedTo?: Date;
    series?: string;
    search?: string;
  }): Record<string, unknown> {
    return {
      companyId: criteria.companyId,
      ...(criteria.documentType ? { documentType: criteria.documentType } : {}),
      ...(criteria.status ? { status: criteria.status } : {}),
      ...(criteria.sourceSystem ? { sourceSystem: criteria.sourceSystem } : {}),
      ...(criteria.externalReference
        ? { externalReference: criteria.externalReference }
        : {}),
      ...(criteria.series ? { series: criteria.series } : {}),
      ...(criteria.issuedFrom || criteria.issuedTo
        ? {
            issuedAt: {
              ...(criteria.issuedFrom ? { gte: criteria.issuedFrom } : {}),
              ...(criteria.issuedTo ? { lte: criteria.issuedTo } : {}),
            },
          }
        : {}),
      // Busca livre (FR-005 de `009-facilita-nfe-screen`) — `OR` sobre
      // `number`/`series`, resolvido no banco (Constitution Princípio II).
      // Nome de cliente ficou fora do escopo (research.md §3 dessa spec).
      ...(criteria.search?.trim()
        ? {
            OR: [
              {
                number: {
                  contains: criteria.search.trim(),
                  mode: 'insensitive',
                },
              },
              {
                series: {
                  contains: criteria.search.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
  }

  private toEntity(row: FiscalDocumentRow): FiscalDocument {
    const props: FiscalDocumentProps = {
      companyId: row.companyId,
      customerId: row.customerId,
      documentType: row.documentType as FiscalDocumentType,
      provider: row.provider as FiscalDocumentProvider,
      environment: row.environment as FiscalDocumentEnvironment,
      status: row.status as FiscalDocumentStatus,
      sourceSystem: row.sourceSystem,
      externalReference: row.externalReference,
      idempotencyKey: row.idempotencyKey,
      series: row.series,
      number: row.number,
      rpsSeries: row.rpsSeries,
      rpsNumber: row.rpsNumber,
      accessKey: row.accessKey,
      verificationCode: row.verificationCode,
      protocol: row.protocol,
      totalAmount: row.totalAmount.toNumber(),
      xmlObjectKey: row.xmlObjectKey,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      issuedAt: row.issuedAt,
      authorizedAt: row.authorizedAt,
      cancelledAt: row.cancelledAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    const entity = FiscalDocument.with(props, row.id).withCustomerName(
      row.customer?.name ?? null,
    );
    if (row.items) {
      entity.withItems(
        row.items.map((item) =>
          FiscalDocumentItem.with(
            {
              fiscalDocumentId: item.fiscalDocumentId,
              description: item.description,
              quantity: item.quantity.toNumber(),
              unitValue: item.unitValue.toNumber(),
              totalValue: item.totalValue.toNumber(),
              itemType: item.itemType as 'PRODUCT' | 'SERVICE',
              ncm: item.ncm,
              cfop: item.cfop,
              cst: item.cst,
              csosn: item.csosn,
              serviceCode: item.serviceCode,
              taxJson: item.taxJson as Record<string, unknown> | null,
            },
            item.id,
          ),
        ),
      );
    }
    return entity;
  }
}
