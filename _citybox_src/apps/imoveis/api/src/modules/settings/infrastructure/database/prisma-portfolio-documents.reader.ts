import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type {
  PortfolioLeadDocumentRow,
  PortfolioPropertyDocumentRow,
} from '../../application/policies/portfolio-document-mirrors';

/**
 * Lê documentos de leads/imóveis do corretor (carteira primária) para
 * espelhar na aba Documentos do perfil — sem copiar para agent_folder_documents.
 */
@Injectable()
export class PrismaPortfolioDocumentsReader {
  constructor(private readonly prisma: PrismaService) {}

  async listLeadDocuments(
    storeId: string,
    agentId: string,
  ): Promise<PortfolioLeadDocumentRow[]> {
    const rows = await this.prisma.leadDocument.findMany({
      where: {
        lead: {
          storeId,
          agentId,
        },
      },
      include: {
        lead: { select: { id: true, name: true } },
      },
      orderBy: { addedAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      leadId: row.leadId,
      leadName: row.lead.name,
      name: row.name,
      sizeLabel: row.sizeLabel,
      kind: row.kind === 'contract' ? 'contract' : 'other',
      addedAt: row.addedAt,
      objectKey: row.objectKey ?? null,
      mimeType: row.mimeType ?? null,
    }));
  }

  async listPropertyDocuments(
    storeId: string,
    agentId: string,
  ): Promise<PortfolioPropertyDocumentRow[]> {
    const rows = await this.prisma.propertyDocument.findMany({
      where: {
        property: {
          storeId,
          agentId,
        },
      },
      include: {
        property: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      propertyId: row.propertyId,
      propertyName: row.property.name,
      name: row.name,
      sizeLabel: row.sizeLabel,
      objectKey: row.objectKey,
      mimeType: row.mimeType,
      createdAt: row.createdAt,
    }));
  }
}
