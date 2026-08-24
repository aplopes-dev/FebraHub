import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalEventRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-event.repository.interface';
import { ProviderRequestRepository } from '../../../../fiscal-documents/domain/repositories/provider-request.repository.interface';
import { FiscalEvent } from '../../../../fiscal-documents/domain/entities/fiscal-event.entity';
import { ProviderRequest } from '../../../../fiscal-documents/domain/entities/provider-request.entity';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { NfeDocumentNotAuthorizedError } from '../../../domain/errors/nfe-document-not-authorized.error';
import { assertCorrectionTextIsAllowed } from '../../../domain/validators/correction-text.validator';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { archiveProviderExchange } from '../../../../fiscal-documents/application/archive-provider-exchange';
import type { CorrectionLetterNfeDto } from '../../dtos/nfe.dto';

/// Carta de correção para NF-e autorizada (US4 cenário 3, FR-005,
/// contracts/nfe-api.md `POST /nfe/{id}/correction-letter`). Um documento
/// pode ter mais de uma CC-e ao longo do tempo — `sequence` é
/// `(quantidade de CC-e já registradas) + 1`.
@Injectable()
export class CorrectionLetterNfeUseCase implements IUseCase<
  CorrectionLetterNfeDto,
  FiscalEvent
> {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly fiscalEventRepository: FiscalEventRepository,
    private readonly providerRequestRepository: ProviderRequestRepository,
    private readonly providerFactory: FiscalProviderFactory,
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(dto: CorrectionLetterNfeDto): Promise<FiscalEvent> {
    const document = await this.fiscalDocumentRepository.findById(
      dto.fiscalDocumentId,
    );
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        CorrectionLetterNfeUseCase.name,
        dto.fiscalDocumentId,
      );
    }

    if (document.status !== 'AUTHORIZED') {
      throw new NfeDocumentNotAuthorizedError(
        CorrectionLetterNfeUseCase.name,
        document.id,
        document.status,
        'issue a correction letter for',
      );
    }

    assertCorrectionTextIsAllowed(
      dto.correctionText,
      CorrectionLetterNfeUseCase.name,
    );

    const previousEvents =
      await this.fiscalEventRepository.findByFiscalDocumentId(document.id);
    const sequence =
      previousEvents.filter((event) => event.eventType === 'CORRECTION_LETTER')
        .length + 1;

    const provider = this.providerFactory.getProvider(document.provider);
    const result = await provider.correctionLetter({
      fiscalDocumentId: document.id,
      sequence,
      correctionText: dto.correctionText,
    });

    const now = new Date();

    const archived = await archiveProviderExchange(this.objectStorage, {
      companyId: document.companyId,
      documentId: document.id,
      documentKind: 'nfe',
      // Sequencia no nome: uma NF-e aceita ate 20 CC-e, e sem ela a segunda
      // sobrescreveria o envelope da primeira.
      operation: `CORRECTION_LETTER-${sequence}`,
      exchange: result,
    });

    await this.providerRequestRepository.save(
      ProviderRequest.with(
        {
          fiscalDocumentId: document.id,
          provider: document.provider,
          operation: 'CORRECTION_LETTER',
          requestXmlObjectKey: archived.requestXmlObjectKey,
          responseXmlObjectKey: archived.responseXmlObjectKey,
          requestPayload: null,
          responsePayload: {
            status: result.status,
            protocol: result.protocol ?? null,
          },
          status:
            result.status === 'CORRECTION_LETTER_AUTHORIZED'
              ? 'SUCCESS'
              : 'ERROR',
          errorMessage: result.errorMessage ?? null,
          createdAt: now,
        },
        randomUUID(),
      ),
    );

    return this.fiscalEventRepository.save(
      FiscalEvent.with(
        {
          fiscalDocumentId: document.id,
          eventType: 'CORRECTION_LETTER',
          sequence,
          status: result.status,
          justification: null,
          correctionText: dto.correctionText,
          protocol: result.protocol ?? null,
          requestXmlObjectKey: archived.requestXmlObjectKey,
          responseXmlObjectKey: archived.responseXmlObjectKey,
          // Eventos de NF-e nao pertencem ao Padrao Nacional da NFS-e.
          nationalEventCode: null,
          generatorEnvironment: null,
          replacedByDocumentId: null,
          createdAt: now,
          companyId: null,
          series: null,
          numberRangeStart: null,
          numberRangeEnd: null,
        },
        randomUUID(),
      ),
    );
  }
}
