import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ContingencyQueueRepository } from '../../../domain/contingency/contingency-queue.repository';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import type { IssueDocumentResult } from '../../../../../shared/domain/fiscal-provider.interface';

/// Quantos cupons drenar por chamada.
///
/// Limitado porque o dreno roda em laço: uma fila grande depois de uma queda
/// longa não pode monopolizar o processo nem estourar o tempo de uma execução
/// agendada. O que sobra fica para a próxima passada, na mesma ordem.
const DRAIN_BATCH = 50;

export type TransmitPendingNfceDto = { companyId: string };

export type TransmitPendingNfceResult = {
  transmitted: number;
  rejected: number;
  /// Quando o dreno parou por indisponibilidade: quantos ficaram na fila.
  remaining: number;
  /// FR-012 — cupons **já entregues ao consumidor** que a SEFAZ recusou na
  /// transmissão posterior. Devolvido para que quem chama possa alarmar; o
  /// caso de uso também registra em log de erro.
  rejectedDocumentIds: string[];
};

/// US3 / FR-010 a FR-012 — drena a fila de contingência quando a SEFAZ volta.
@Injectable()
export class TransmitPendingNfceUseCase implements IUseCase<
  TransmitPendingNfceDto,
  TransmitPendingNfceResult
> {
  private readonly logger = new Logger(TransmitPendingNfceUseCase.name);

  constructor(
    private readonly queue: ContingencyQueueRepository,
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly providerFactory: FiscalProviderFactory,
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(
    dto: TransmitPendingNfceDto,
  ): Promise<TransmitPendingNfceResult> {
    const pending = await this.queue.findPending(dto.companyId, DRAIN_BATCH);

    let transmitted = 0;
    let rejected = 0;
    const rejectedDocumentIds: string[] = [];

    for (const [index, entry] of pending.entries()) {
      const document = await this.fiscalDocumentRepository.findById(
        entry.fiscalDocumentId,
      );

      if (!document?.xmlObjectKey) {
        // Sem XML não há o que transmitir. Registrar e seguir: parar aqui
        // travaria a fila inteira por causa de uma entrada defeituosa.
        await this.queue.registerAttempt(
          entry.id,
          'documento sem XML assinado armazenado',
        );
        continue;
      }

      const outcome = await this.transmit(document);

      if (outcome === 'UNREACHABLE') {
        // ⚠️ **PARA a fila, não pula para o próximo.**
        //
        // A ordem de emissão é a razão de esta fila existir: fora de ordem, a
        // numeração chega quebrada à SEFAZ. Se o cupom `n` não passou porque o
        // órgão caiu de novo, transmitir o `n+1` inverteria a sequência — e o
        // erro só apareceria como salto de numeração, muito depois.
        return {
          transmitted,
          rejected,
          remaining: pending.length - index,
          rejectedDocumentIds,
        };
      }

      if (outcome === 'REJECTED') {
        rejected += 1;
        rejectedDocumentIds.push(document.id);
        await this.queue.markRejected(entry.id, 'rejeitado pela SEFAZ');

        // ⚠️ FR-012 — o pior caso da feature, e por isso é log de ERRO e não
        // aviso. O consumidor **já levou o papel**: existe cupom impresso, em
        // circulação, que o fisco recusou. Isso precisa de gente olhando, não
        // de uma linha perdida no log de informação.
        this.logger.error(
          `Cupom de contingência REJEITADO após entrega ao consumidor. ` +
            `Documento ${document.id}, chave ${document.accessKey ?? 'sem chave'}. ` +
            `Exige tratamento fiscal — o papel está com o cliente.`,
        );
        continue;
      }

      transmitted += 1;
      await this.queue.markTransmitted(entry.id, new Date());
    }

    return { transmitted, rejected, remaining: 0, rejectedDocumentIds };
  }

  /// Transmite e persiste o desfecho no documento.
  ///
  /// Distingue **rejeição** (o órgão respondeu) de **indisponibilidade** (não
  /// respondeu) — a mesma separação de `contingency-decision.ts`, aqui aplicada
  /// à retransmissão. Uma exceção de transporte é indisponibilidade; um
  /// `status` de rejeição é resposta.
  private async transmit(
    document: FiscalDocument,
  ): Promise<'AUTHORIZED' | 'REJECTED' | 'UNREACHABLE'> {
    const stored = await this.objectStorage.get(document.xmlObjectKey!);

    // Anotado: `let result;` sem tipo infere `any`, e o lint reprova o acesso
    // a `.status` depois — com razão, porque um campo renomeado no provider
    // passaria em silêncio.
    let result: IssueDocumentResult;
    try {
      result = await this.providerFactory.getProvider(document.provider).issue({
        fiscalDocumentId: document.id,
        environment: document.environment,
        signedXml: stored.buffer,
      });
    } catch {
      // Falha de transporte: a SEFAZ segue fora. Nada a persistir — a entrada
      // continua PENDING e o próximo ciclo tenta de novo, do mesmo ponto.
      return 'UNREACHABLE';
    }

    if (result.status === 'AUTHORIZED') {
      await this.fiscalDocumentRepository.save(
        FiscalDocument.with(
          {
            ...document.props,
            status: 'AUTHORIZED',
            protocol: result.protocol ?? null,
            authorizedAt: new Date(),
          },
          document.id,
        ).withItems(document.items),
      );
      return 'AUTHORIZED';
    }

    if (result.status === 'REJECTED') {
      await this.fiscalDocumentRepository.save(
        FiscalDocument.with(
          {
            ...document.props,
            status: 'REJECTED',
            errorCode: result.errorCode ?? null,
            errorMessage: result.errorMessage ?? null,
          },
          document.id,
        ).withItems(document.items),
      );
      return 'REJECTED';
    }

    // `SYNC_REQUIRED`: enviamos e não sabemos. Tratado como indisponibilidade
    // **para efeito de parar a fila** — mas sem reemitir nada, que é o que
    // `contingency-decision.ts` proíbe. A entrada segue PENDING e a consulta
    // resolverá.
    return 'UNREACHABLE';
  }
}
