import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalEventRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-event.repository.interface';
import { ProviderRequestRepository } from '../../../../fiscal-documents/domain/repositories/provider-request.repository.interface';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { FiscalEvent } from '../../../../fiscal-documents/domain/entities/fiscal-event.entity';
import { ProviderRequest } from '../../../../fiscal-documents/domain/entities/provider-request.entity';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import {
  isWithinCancelDeadline,
  resolveCancelDeadline,
} from '../../../../fiscal-documents/domain/rules/nfe-cancel-deadline';
import { NfeDocumentNotAuthorizedError } from '../../../domain/errors/nfe-document-not-authorized.error';
import { NfeCancelDeadlineConflictError } from '../../../domain/errors/nfe-cancel-deadline-expired.error';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { archiveProviderExchange } from '../../../../fiscal-documents/application/archive-provider-exchange';
import { documentKindOf } from '../../../../fiscal-documents/application/document-kind';
import type { CancelNfeDto } from '../../dtos/nfe.dto';

/// Cancelamento dentro do prazo legal (US4 cenário 1 e 2, FR-004,
/// contracts/nfe-api.md `POST /nfe/{id}/cancel`). Chamada síncrona (mesma
/// decisão de FR-016 usada em `IssueNfeUseCase`) — o resultado (autorizado ou
/// rejeitado pela SEFAZ) volta na própria resposta HTTP.
///
/// ⚠️ **Serve NF-e e NFC-e, apesar do nome.** Nada aqui é específico do modelo
/// 55: o prazo vem de `resolveCancelDeadline(document.documentType, ...)` — 24h
/// para NF-e, **30 minutos** para cupom — e o transporte, de
/// `document.provider`. Duplicar o arquivo para a NFC-e criaria duas máquinas
/// de estado de cancelamento para manter em sincronia, e a divergência entre
/// elas só apareceria com uma nota presa em estado inconsistente.
///
/// O nome fica como está para não renomear um símbolo em uso; a spec 005 o
/// reusa a partir de `NfceModule`.
@Injectable()
export class CancelNfeUseCase implements IUseCase<
  CancelNfeDto,
  FiscalDocument
> {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly fiscalEventRepository: FiscalEventRepository,
    private readonly providerRequestRepository: ProviderRequestRepository,
    private readonly providerFactory: FiscalProviderFactory,
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(dto: CancelNfeDto): Promise<FiscalDocument> {
    const document = await this.fiscalDocumentRepository.findById(
      dto.fiscalDocumentId,
    );
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        CancelNfeUseCase.name,
        dto.fiscalDocumentId,
      );
    }

    if (document.status !== 'AUTHORIZED' || !document.authorizedAt) {
      throw new NfeDocumentNotAuthorizedError(
        CancelNfeUseCase.name,
        document.id,
        document.status,
        'cancel',
      );
    }

    const now = new Date();
    if (
      !isWithinCancelDeadline(document.documentType, document.authorizedAt, now)
    ) {
      throw new NfeCancelDeadlineConflictError(
        CancelNfeUseCase.name,
        document.id,
        resolveCancelDeadline(document.documentType, document.authorizedAt),
        // Sem isto a mensagem falaria em "NF-e" e ofereceria substituição a um
        // cupom, que não tem esse caminho (T044).
        document.documentType,
      );
    }

    const provider = this.providerFactory.getProvider(document.provider);
    const result = await provider.cancel({
      fiscalDocumentId: document.id,
      // Não-nulo garantido pelo guard de status AUTHORIZED acima — todo
      // documento AUTHORIZED tem protocolo de autorização.
      protocol: document.protocol ?? '',
      justification: dto.justification,
    });

    const archived = await archiveProviderExchange(this.objectStorage, {
      companyId: document.companyId,
      documentId: document.id,
      // Derivado do documento, não fixo: este caso de uso já era genérico por
      // `documentType` (prazo) e `provider` (transporte), e a NFC-e o reusa.
      // Com 'nfe' fixo, o XML de cancelamento de um cupom seria arquivado sob
      // o caminho da NF-e — rastro no lugar errado, descoberto só numa
      // auditoria.
      documentKind: documentKindOf(document),
      operation: 'CANCEL',
      exchange: result,
    });

    await this.providerRequestRepository.save(
      ProviderRequest.with(
        {
          fiscalDocumentId: document.id,
          provider: document.provider,
          operation: 'CANCEL',
          requestXmlObjectKey: archived.requestXmlObjectKey,
          responseXmlObjectKey: archived.responseXmlObjectKey,
          requestPayload: null,
          responsePayload: {
            status: result.status,
            protocol: result.protocol ?? null,
          },
          status: result.status === 'CANCEL_AUTHORIZED' ? 'SUCCESS' : 'ERROR',
          errorMessage: result.errorMessage ?? null,
          createdAt: now,
        },
        randomUUID(),
      ),
    );

    await this.fiscalEventRepository.save(
      FiscalEvent.with(
        {
          fiscalDocumentId: document.id,
          eventType: 'CANCEL',
          sequence: null,
          status: result.status,
          justification: dto.justification,
          correctionText: null,
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

    const updated = FiscalDocument.with(
      {
        ...document.props,
        // Recusa NAO cancela a nota: ela segue autorizada no orgao fiscal, e o
        // documento tem de refletir isso. Marca-la `CANCEL_REJECTED` a tornaria
        // inelegivel para nova tentativa (o guard exige `AUTHORIZED`), e uma
        // recusa TRANSITORIA — "Chave de acesso inexistente" por atraso de
        // propagacao, verificado contra a SEFAZ-BA em 2026-08-07 — viraria beco
        // sem saida permanente.
        //
        // A tentativa fica registrada no `FiscalEvent` e no `ProviderRequest`;
        // nada se perde.
        status:
          result.status === 'CANCEL_AUTHORIZED'
            ? 'CANCEL_AUTHORIZED'
            : document.status,
        protocol: result.protocol ?? document.protocol,
        cancelledAt:
          result.status === 'CANCEL_AUTHORIZED' ? now : document.cancelledAt,
        errorMessage: result.errorMessage ?? document.errorMessage,
      },
      document.id,
    ).withItems(document.items);

    return this.fiscalDocumentRepository.save(updated);
  }
}
