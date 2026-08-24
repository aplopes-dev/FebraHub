import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../../companies/domain/repositories/company.repository.interface';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalEventRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-event.repository.interface';
import { ProviderRequestRepository } from '../../../../fiscal-documents/domain/repositories/provider-request.repository.interface';
import { FiscalEvent } from '../../../../fiscal-documents/domain/entities/fiscal-event.entity';
import { ProviderRequest } from '../../../../fiscal-documents/domain/entities/provider-request.entity';
import { NfeInutilizationInvalidRangeError } from '../../../domain/errors/nfe-inutilization-invalid-range.error';
import { NfeInutilizationRangeOverlapError } from '../../../domain/errors/nfe-inutilization-range-overlap.error';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { archiveProviderExchange } from '../../../../fiscal-documents/application/archive-provider-exchange';
import { DOCUMENT_KIND_BY_TYPE } from '../../../../fiscal-documents/application/document-kind';
import type { FiscalDocumentType } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';

/// Modelo fiscal por tipo de documento. `Record` total pelo mesmo motivo de
/// `DOCUMENT_KIND_BY_TYPE`: tipo novo sem entrada é erro de compilação.
///
/// NFS-e não tem modelo neste sentido (é documento municipal, não do
/// SINIEF) e nem tem inutilização implementada; o valor existe só para manter
/// o `Record` total e nunca é alcançado.
const FISCAL_MODEL_BY_TYPE: Record<FiscalDocumentType, '55' | '65'> = {
  NFE: '55',
  NFCE: '65',
  NFSE: '55',
};
import type { InutilizeNfeDto } from '../../dtos/nfe.dto';

/// Limite de segurança para a busca de sobreposição (FR-006, edge case
/// "faixa já usada") — não é uma expectativa real de volume (o piloto de
/// Ilhéus opera em escala pequena por emitente/série), é um teto para nunca
/// virar uma query verdadeiramente ilimitada (regra "no unbounded queries").
const MAX_OVERLAP_LOOKUP = 5000;

/// Inutilização de faixa de numeração de NF-e não utilizada (US4 cenário 4,
/// FR-006, contracts/nfe-api.md `POST /nfe/inutilize`). Diferente de
/// cancelamento/CC-e, não parte de um `FiscalDocument` — a faixa nunca foi
/// emitida, então `FiscalEvent` carrega `companyId`/`series`/faixa
/// diretamente (T065, ver migration `..._fiscal_event_inutilization_fields`).
@Injectable()
export class InutilizeNfeUseCase implements IUseCase<
  InutilizeNfeDto,
  FiscalEvent
> {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly fiscalEventRepository: FiscalEventRepository,
    private readonly providerRequestRepository: ProviderRequestRepository,
    private readonly providerFactory: FiscalProviderFactory,
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(dto: InutilizeNfeDto): Promise<FiscalEvent> {
    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) {
      throw new CompanyNotFoundError(InutilizeNfeUseCase.name, dto.companyId);
    }

    if (
      !Number.isInteger(dto.numberStart) ||
      !Number.isInteger(dto.numberEnd) ||
      dto.numberStart <= 0 ||
      dto.numberEnd <= 0 ||
      dto.numberStart > dto.numberEnd
    ) {
      throw new NfeInutilizationInvalidRangeError(
        InutilizeNfeUseCase.name,
        dto.numberStart,
        dto.numberEnd,
      );
    }

    // ⚠️ O tipo decide TRÊS coisas, e errar qualquer uma é caro: contra qual
    // numeração checar sobreposição, qual `mod` vai no XML enviado ao fisco, e
    // onde o rastro é arquivado. Antes era `'NFE'` fixo nos três.
    const documentType = dto.documentType ?? 'NFE';

    const overlapping = await this.findOverlappingNumbers(
      company.id,
      documentType,
      dto.series,
      dto.numberStart,
      dto.numberEnd,
    );
    if (overlapping.length > 0) {
      throw new NfeInutilizationRangeOverlapError(
        InutilizeNfeUseCase.name,
        overlapping,
      );
    }

    const provider = this.providerFactory.getProvider('SEFAZ_BA_NFE');
    const result = await provider.inutilize({
      companyId: company.id,
      environment: company.defaultEnvironment,
      series: dto.series,
      numberStart: String(dto.numberStart),
      numberEnd: String(dto.numberEnd),
      justification: dto.justification,
      model: FISCAL_MODEL_BY_TYPE[documentType],
    });

    const now = new Date();

    // Inutilizacao nao tem FiscalDocument — o numero nunca virou nota. A faixa
    // identifica o arquivo no lugar do id, e e unica por serie na empresa.
    const archived = await archiveProviderExchange(this.objectStorage, {
      companyId: company.id,
      documentId: `serie-${dto.series}-${dto.numberStart}-${dto.numberEnd}`,
      documentKind: DOCUMENT_KIND_BY_TYPE[documentType],
      operation: 'INUTILIZE',
      exchange: result,
    });

    await this.providerRequestRepository.save(
      ProviderRequest.with(
        {
          fiscalDocumentId: null,
          provider: 'SEFAZ_BA_NFE',
          operation: 'INUTILIZE',
          requestXmlObjectKey: archived.requestXmlObjectKey,
          responseXmlObjectKey: archived.responseXmlObjectKey,
          requestPayload: null,
          responsePayload: {
            status: result.status,
            protocol: result.protocol ?? null,
          },
          status: result.status === 'INUTILIZED' ? 'SUCCESS' : 'ERROR',
          errorMessage: result.errorMessage ?? null,
          createdAt: now,
        },
        randomUUID(),
      ),
    );

    return this.fiscalEventRepository.save(
      FiscalEvent.with(
        {
          fiscalDocumentId: null,
          eventType: 'INUTILIZATION',
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
          companyId: company.id,
          series: dto.series,
          numberRangeStart: BigInt(dto.numberStart),
          numberRangeEnd: BigInt(dto.numberEnd),
        },
        randomUUID(),
      ),
    );
  }

  /// Números "já autorizados" (edge case do spec.md) = documentos que
  /// chegaram a `authorizedAt` não-nulo em algum momento, independente do
  /// status atual (ex.: já cancelado continua tendo "usado" aquele número).
  private async findOverlappingNumbers(
    companyId: string,
    documentType: FiscalDocumentType,
    series: string,
    numberStart: number,
    numberEnd: number,
  ): Promise<string[]> {
    const documents = await this.fiscalDocumentRepository.findAll({
      companyId,
      documentType,
      series,
      skip: 0,
      take: MAX_OVERLAP_LOOKUP,
    });
    return documents
      .filter((doc) => doc.authorizedAt !== null && doc.number !== null)
      .map((doc) => doc.number as string)
      .filter((numberValue) => {
        const parsed = Number(numberValue);
        return (
          Number.isFinite(parsed) &&
          parsed >= numberStart &&
          parsed <= numberEnd
        );
      });
  }
}
