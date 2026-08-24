import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalEventRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-event.repository.interface';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { SefinNacionalNfseProvider } from '../../../../providers/sefin-nacional/infrastructure/sefin-nacional-nfse.provider';

export type NfseTimelineEntry = {
  nationalEventCode: string | null;
  eventType: string;
  status: string;
  protocol: string | null;
  occurredAt: Date;
  description: string | null;
  /// `LOCAL` = registrado por esta API. `REMOTE` = veio do ambiente nacional e
  /// não temos correspondente — tipicamente evento de ofício do município.
  ///
  /// A distinção é para a pessoa que lê: "o município cancelou sua nota" e
  /// "você cancelou sua nota" são fatos diferentes, e uma linha do tempo que
  /// não separa os dois é pior que inútil.
  origin: 'LOCAL' | 'REMOTE';
};

export type ListNfseEventsDto = {
  fiscalDocumentId: string;
};

/// US4/T036 — linha do tempo da nota, em ordem cronológica, fundindo o que
/// registramos com o que o ambiente nacional reporta.
@Injectable()
export class ListNfseEventsUseCase implements IUseCase<
  ListNfseEventsDto,
  NfseTimelineEntry[]
> {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly fiscalEventRepository: FiscalEventRepository,
    private readonly sefinProvider: SefinNacionalNfseProvider,
  ) {}

  async execute(dto: ListNfseEventsDto): Promise<NfseTimelineEntry[]> {
    const document = await this.fiscalDocumentRepository.findById(
      dto.fiscalDocumentId,
    );
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        ListNfseEventsUseCase.name,
        dto.fiscalDocumentId,
      );
    }

    const localEvents = await this.fiscalEventRepository.findByFiscalDocumentId(
      document.id,
    );

    const local: NfseTimelineEntry[] = localEvents.map((event) => ({
      nationalEventCode: event.nationalEventCode,
      eventType: event.eventType,
      status: event.status,
      protocol: event.protocol,
      occurredAt: event.createdAt,
      description: event.justification ?? event.correctionText,
      origin: 'LOCAL',
    }));

    // `syncEvents` nunca lança: falha de comunicação devolve lista vazia, e a
    // linha do tempo sai só com o que já temos em vez de quebrar a consulta.
    const remote = await this.sefinProvider.syncEvents(document.id);

    const known = new Set(
      localEvents
        .map((event) => event.nationalEventCode)
        .filter((code): code is string => code !== null),
    );

    const officialOnly: NfseTimelineEntry[] = remote
      // Dedup por código do evento: o que já registramos aparece uma vez, com a
      // origem LOCAL, que é a mais informativa das duas.
      .filter((event) => !known.has(event.nationalEventCode))
      .map((event) => ({
        nationalEventCode: event.nationalEventCode,
        eventType: 'REMOTE_EVENT',
        status: 'REGISTERED',
        protocol: event.protocol,
        // Sem data do órgão, ancora na autorização da nota em vez de "agora":
        // `now` faria o evento saltar para o topo a cada consulta.
        occurredAt: event.occurredAt ?? document.authorizedAt ?? new Date(0),
        // Sem descrição do órgão, fica `null`. `national-error-codes.ts` NÃO
        // serve aqui: mapeia códigos de **rejeição** (`E0116`), não de evento
        // (`e101101`) — são vocabulários distintos, e cruzá-los produziria
        // texto plausível e errado.
        description: event.description,
        origin: 'REMOTE',
      }));

    return [...local, ...officialOnly].sort(
      (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
    );
  }
}
