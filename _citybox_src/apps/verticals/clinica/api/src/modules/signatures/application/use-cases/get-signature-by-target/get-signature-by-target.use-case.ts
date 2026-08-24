import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  ElectronicSignature,
  type ElectronicSignatureKind,
} from '../../../domain/entities/electronic-signature.entity';
import { ElectronicSignatureRepository } from '../../../domain/repositories/electronic-signature.repository.interface';
import { ElectronicSignatureNotFoundError } from '../../../domain/errors/electronic-signature-not-found.error';
import { ZapSignClient } from '../../../domain/zapsign/zapsign-client.interface';
import { HandleZapSignWebhookUseCase } from '../handle-zapsign-webhook/handle-zapsign-webhook.use-case';

export type GetSignatureByTargetDto = {
  storeId: string;
  patientId: string;
  kind: ElectronicSignatureKind;
  targetId: string;
  /**
   * Quando true, consulta a ZapSign e reconcilia status (pode levar segundos).
   * Default false: devolve o estado persistido imediatamente (UI não bloqueia).
   */
  sync?: boolean;
};

@Injectable()
export class GetSignatureByTargetUseCase
  implements IUseCase<GetSignatureByTargetDto, ElectronicSignature>
{
  private readonly logger = new Logger(GetSignatureByTargetUseCase.name);

  constructor(
    private readonly signatureRepository: ElectronicSignatureRepository,
    private readonly zapSignClient: ZapSignClient,
    private readonly handleZapSignWebhook: HandleZapSignWebhookUseCase,
  ) {}

  async execute(dto: GetSignatureByTargetDto): Promise<ElectronicSignature> {
    const signature = await this.signatureRepository.findLatestByTarget(
      dto.storeId,
      dto.kind,
      dto.targetId,
    );

    if (!signature || signature.patientId !== dto.patientId) {
      throw new ElectronicSignatureNotFoundError(
        this.constructor.name,
        dto.targetId,
      );
    }

    if (signature.status === 'signed') {
      // Reconcile local (DB) — não bloqueia a resposta se falhar.
      void this.handleZapSignWebhook
        .reconcileSignedDocuments(signature)
        .catch((error) => {
          this.logger.warn(
            `Falha ao reconciliar documentos assinados ${signature.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        });
      return signature;
    }

    if (signature.status !== 'pending' || !dto.sync) {
      return signature;
    }

    try {
      const detail = await this.zapSignClient.getDocument(
        signature.zapsignDocumentToken,
      );
      const hasProgress =
        detail.status.toLowerCase() === 'signed' ||
        Boolean(detail.signedFile) ||
        detail.signers.some(
          (signer) =>
            signer.status.toLowerCase() === 'signed' || Boolean(signer.signedAt),
        );
      if (!hasProgress) {
        return signature;
      }

      await this.handleZapSignWebhook.execute({
        eventType: 'doc_signed',
        documentToken: detail.token,
        documentStatus: detail.status,
        signedFileUrl: detail.signedFile,
        signers: detail.signers.map((signer) => ({
          token: signer.token,
          status: signer.status,
          signUrl: signer.signUrl,
          signedAt: signer.signedAt,
        })),
      });

      const refreshed = await this.signatureRepository.findLatestByTarget(
        dto.storeId,
        dto.kind,
        dto.targetId,
      );
      const next =
        refreshed && refreshed.patientId === dto.patientId
          ? refreshed
          : signature;
      if (next.status === 'signed') {
        void this.handleZapSignWebhook
          .reconcileSignedDocuments(next)
          .catch((error) => {
            this.logger.warn(
              `Falha ao reconciliar documentos assinados ${next.id}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          });
      }
      return next;
    } catch (error) {
      this.logger.warn(
        `Falha ao sincronizar assinatura ${signature.id} com ZapSign: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return signature;
    }
  }
}
