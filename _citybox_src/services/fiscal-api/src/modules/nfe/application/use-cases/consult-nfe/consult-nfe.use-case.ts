import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import type { ConsultNfeDto } from '../../dtos/nfe.dto';

/// Reconsulta o status de uma NF-e junto ao provider quando o documento
/// ainda está em processamento (SYNC_REQUIRED) — caso contrário retorna o
/// estado já persistido sem nova chamada externa (US1 Acceptance Scenario 3).
@Injectable()
export class ConsultNfeUseCase implements IUseCase<
  ConsultNfeDto,
  FiscalDocument
> {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly providerFactory: FiscalProviderFactory,
  ) {}

  async execute(dto: ConsultNfeDto): Promise<FiscalDocument> {
    const document = await this.fiscalDocumentRepository.findById(
      dto.fiscalDocumentId,
    );
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        ConsultNfeUseCase.name,
        dto.fiscalDocumentId,
      );
    }

    if (document.status !== 'SYNC_REQUIRED') {
      return document;
    }

    const provider = this.providerFactory.getProvider(document.provider);
    const result = await provider.consult({
      fiscalDocumentId: document.id,
      protocol: document.protocol ?? undefined,
      accessKey: document.accessKey ?? undefined,
    });

    const updated = FiscalDocument.with(
      {
        ...document.props,
        status: (result.status as FiscalDocument['status']) ?? document.status,
        protocol: result.protocol ?? document.protocol,
        errorMessage: result.errorMessage ?? document.errorMessage,
      },
      document.id,
    ).withItems(document.items);

    return this.fiscalDocumentRepository.save(updated);
  }
}
