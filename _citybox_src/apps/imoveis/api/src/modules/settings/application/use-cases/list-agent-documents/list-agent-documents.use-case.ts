import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { AgentFolderDocumentEntity } from '../../../domain/entities/agent-folder-document.entity';
import { parseDocumentFolderId } from '../../../domain/mappers/document-enum.mapper';
import { AgentFolderDocumentRepository } from '../../../domain/repositories/agent-folder-document.repository.interface';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';
import { PrismaPortfolioDocumentsReader } from '../../../infrastructure/database/prisma-portfolio-documents.reader';
import { buildLegalDocumentMirrors } from '../../policies/legal-document-mirror';
import {
  buildLeadDocumentMirrors,
  buildPropertyDocumentMirrors,
  filterByFolder,
} from '../../policies/portfolio-document-mirrors';

export type ListAgentDocumentsInput = {
  storeId: string;
  agentId: string;
  folderId?: string;
};

/**
 * Documentos da aba perfil:
 * 1. pastas manuais (`agent_folder_documents`);
 * 2. espelho dos legais do perfil;
 * 3. espelho dos documentos dos leads/imóveis da carteira do corretor.
 */
@Injectable()
export class ListAgentDocumentsUseCase implements IUseCase<
  ListAgentDocumentsInput,
  AgentFolderDocumentEntity[]
> {
  constructor(
    private readonly documents: AgentFolderDocumentRepository,
    private readonly profiles: AgentProfileRepository,
    private readonly portfolio: PrismaPortfolioDocumentsReader,
  ) {}

  async execute(
    input: ListAgentDocumentsInput,
  ): Promise<AgentFolderDocumentEntity[]> {
    const folderId = input.folderId
      ? parseDocumentFolderId(ListAgentDocumentsUseCase.name, input.folderId)
      : undefined;

    const includeClient = !folderId || folderId === 'client';
    const includeProperty = !folderId || folderId === 'property';
    const includeLegal = !folderId || folderId === 'legal';

    const stored = await this.documents.findAll(
      input.storeId,
      input.agentId,
      folderId,
    );

    const linked: AgentFolderDocumentEntity[] = [];

    if (includeClient || includeProperty) {
      const [leadRows, propertyRows] = await Promise.all([
        includeClient
          ? this.portfolio.listLeadDocuments(input.storeId, input.agentId)
          : Promise.resolve([]),
        includeProperty
          ? this.portfolio.listPropertyDocuments(input.storeId, input.agentId)
          : Promise.resolve([]),
      ]);
      if (includeClient) {
        linked.push(
          ...buildLeadDocumentMirrors(input.storeId, input.agentId, leadRows),
        );
      }
      if (includeProperty) {
        linked.push(
          ...buildPropertyDocumentMirrors(
            input.storeId,
            input.agentId,
            propertyRows,
          ),
        );
      }
    }

    let legalMirrors: AgentFolderDocumentEntity[] = [];
    if (includeLegal) {
      const profile = await this.profiles.findByAgentId(
        input.storeId,
        input.agentId,
      );
      const allStored = folderId
        ? await this.documents.findAll(input.storeId, input.agentId)
        : stored;
      legalMirrors = buildLegalDocumentMirrors(profile, allStored);
    }

    const merged = [...stored, ...legalMirrors, ...linked];
    return filterByFolder(merged, folderId).sort(
      (a, b) => b.addedAt.getTime() - a.addedAt.getTime(),
    );
  }
}
