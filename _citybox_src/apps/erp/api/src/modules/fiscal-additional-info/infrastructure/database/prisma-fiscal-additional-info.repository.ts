import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  FiscalAdditionalInfo,
  FISCAL_DOCUMENT_TYPES,
  type AdditionalInfoTarget,
  type FiscalAdditionalInfoProps,
  type FiscalDocumentType,
} from '../../domain/entities/fiscal-additional-info.entity';
import { FiscalAdditionalInfoRepository } from '../../domain/repositories/fiscal-additional-info.repository.interface';

function isFiscalDocumentType(value: string): value is FiscalDocumentType {
  return (FISCAL_DOCUMENT_TYPES as readonly string[]).includes(value);
}

type Row = {
  id: string;
  organizationId: string;
  name: string;
  text: string;
  documentType: string;
  target: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaFiscalAdditionalInfoRepository extends FiscalAdditionalInfoRepository {
  private readonly logger = new Logger(
    PrismaFiscalAdditionalInfoRepository.name,
  );

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listByOrganization(
    organizationId: string,
    documentType?: FiscalDocumentType,
  ): Promise<FiscalAdditionalInfo[]> {
    const rows = await this.prisma.scoped.fiscalAdditionalInfo.findMany({
      where: { organizationId, ...(documentType ? { documentType } : {}) },
      // Ordem de criação = ordem de concatenação no XML (plan D1/D7). O `id` é
      // desempate: sem ele, dois registros no mesmo milissegundo (createdAt é
      // Timestamptz(3)) sairiam em ordem que o Postgres não garante estável
      // entre execuções, e o XML transmitido poderia mudar de uma emissão para
      // outra. Com o desempate a ordem é determinística.
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<FiscalAdditionalInfo | null> {
    const row = await this.prisma.scoped.fiscalAdditionalInfo.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(info: FiscalAdditionalInfo): Promise<FiscalAdditionalInfo> {
    const data = {
      name: info.name,
      text: info.text,
      documentType: info.documentType,
      target: info.target,
      updatedAt: info.updatedAt,
    };
    const row = await this.prisma.scoped.fiscalAdditionalInfo.upsert({
      where: { id: info.id },
      create: {
        id: info.id,
        organizationId: info.organizationId,
        ...data,
        createdAt: info.createdAt,
      },
      update: data,
    });
    return this.toEntity(row);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.scoped.fiscalAdditionalInfo.deleteMany({
      where: { id, organizationId },
    });
  }

  async countByDocumentType(
    organizationId: string,
  ): Promise<Record<FiscalDocumentType, number>> {
    const rows = await this.prisma.scoped.fiscalAdditionalInfo.groupBy({
      by: ['documentType'],
      where: { organizationId },
      _count: { _all: true },
    });
    const counts: Record<FiscalDocumentType, number> = {
      NFE: 0,
      NFCE: 0,
      NFSE: 0,
    };
    for (const row of rows) {
      // `documentType` é `String` cru no schema Prisma (não enum) — achado do
      // typescript-reviewer: um cast direto pra `FiscalDocumentType` deixaria
      // uma linha com valor inesperado (dado corrompido/migração futura)
      // criar uma chave fora do union em silêncio, subtraindo do `total` sem
      // erro nenhum. Valida antes de indexar; loga e ignora a linha ruim em
      // vez de derrubar a tela por causa de uma contagem.
      if (!isFiscalDocumentType(row.documentType)) {
        this.logger.warn(
          `Ignorando contagem de fiscalAdditionalInfo com documentType inesperado: "${row.documentType}" (organizationId=${organizationId})`,
        );
        continue;
      }
      counts[row.documentType] = row._count._all;
    }
    return counts;
  }

  private toEntity(row: Row): FiscalAdditionalInfo {
    const props: FiscalAdditionalInfoProps = {
      organizationId: row.organizationId,
      name: row.name,
      text: row.text,
      // Casts estreitados por FiscalAdditionalInfo.validate() no construtor.
      documentType: row.documentType as FiscalDocumentType,
      target: row.target as AdditionalInfoTarget,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return FiscalAdditionalInfo.with(props, row.id);
  }
}
