import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PatientAnamnesisRepository } from '../../../../patients/patient-anamneses/domain/repositories/patient-anamnesis.repository.interface';
import { PatientContractEmissionRepository } from '../../../../patients/patient-contract-emissions/domain/repositories/patient-contract-emission.repository.interface';
import { TreatmentEvolutionRepository } from '../../../../patients/treatment-evolutions/domain/repositories/treatment-evolution.repository.interface';
import {
  ElectronicSignature,
  type ElectronicSigner,
  type ElectronicSignerStatus,
} from '../../../domain/entities/electronic-signature.entity';
import { ElectronicSignatureRepository } from '../../../domain/repositories/electronic-signature.repository.interface';
import { ZapSignClient } from '../../../domain/zapsign/zapsign-client.interface';
import { buildSignatureObjectKey } from '../../utils/signature-helpers';
import { buildEvolutionConfirmationHash } from '../request-evolution-batch-signature/request-evolution-batch-signature.use-case';

export type ZapSignWebhookDto = {
  eventType: string;
  documentToken?: string;
  documentStatus?: string;
  signedFileUrl?: string | null;
  signers?: Array<{
    token?: string;
    status?: string;
    signUrl?: string;
    signedAt?: string | null;
  }>;
};

@Injectable()
export class HandleZapSignWebhookUseCase
  implements IUseCase<ZapSignWebhookDto, void>
{
  private readonly logger = new Logger(HandleZapSignWebhookUseCase.name);

  constructor(
    private readonly signatureRepository: ElectronicSignatureRepository,
    private readonly anamnesisRepository: PatientAnamnesisRepository,
    private readonly contractRepository: PatientContractEmissionRepository,
    private readonly evolutionRepository: TreatmentEvolutionRepository,
    private readonly zapSignClient: ZapSignClient,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: ZapSignWebhookDto): Promise<void> {
    const token = dto.documentToken?.trim();
    if (!token) {
      this.logger.warn('Webhook ZapSign sem document token — ignorado');
      return;
    }

    const signature =
      await this.signatureRepository.findByZapsignToken(token);
    if (!signature) {
      this.logger.warn(
        `Webhook ZapSign para token desconhecido — ignorado`,
      );
      return;
    }

    if (signature.status === 'cancelled') {
      return;
    }

    // Já assinado: ainda reconcilia o documento alvo (contrato/anamnese/…),
    // para corrigir casos em que o status da ElectronicSignature avançou
    // sem gravar patient/responsibleSignatureStatus no contrato.
    if (signature.status === 'signed') {
      await this.markDocumentsSigned(signature);
      return;
    }

    const event = dto.eventType;

    if (event === 'doc_refused') {
      await this.signatureRepository.save(signature.withStatus('refused'));
      await this.revertDocumentStatuses(signature);
      return;
    }

    if (event === 'doc_expired') {
      await this.signatureRepository.save(signature.withStatus('expired'));
      await this.revertDocumentStatuses(signature);
      return;
    }

    if (event === 'doc_deleted') {
      await this.signatureRepository.save(signature.withCancelled());
      await this.revertDocumentStatuses(signature);
      return;
    }

    if (event !== 'doc_signed') {
      return;
    }

    const updatedSigners = this.mergeSignerStatuses(
      signature.signers,
      dto.signers ?? [],
    );
    let current = signature.withUpdatedSigners(updatedSigners);

    if (signature.kind === 'contract' && signature.targetId) {
      await this.syncContractPartialStatuses(current);
    }

    const docStatus = (dto.documentStatus ?? '').toLowerCase();
    const allSigned =
      docStatus === 'signed' ||
      current.signers.every((s) => s.status === 'signed');

    if (!allSigned) {
      await this.signatureRepository.save(current);
      return;
    }

    // Persiste status dos signatários antes do download do PDF — se o download
    // falhar (URL temporária/S3), a UI ainda reflete a assinatura concluída.
    current = current.withAllSignersCompleted();
    await this.signatureRepository.save(current);
    await this.markDocumentsSigned(current);

    let signedFileUrl = dto.signedFileUrl ?? null;
    if (!signedFileUrl) {
      try {
        const detail = await this.zapSignClient.getDocument(token);
        signedFileUrl = detail.signedFile;
      } catch (error) {
        this.logger.warn(
          `Documento ${signature.id} assinado, mas falha ao obter signed_file: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return;
      }
    }

    if (!signedFileUrl) {
      this.logger.warn(
        `Documento ${signature.id} signed sem signed_file — aguardando`,
      );
      return;
    }

    try {
      const pdfBuffer =
        await this.zapSignClient.downloadSignedPdf(signedFileUrl);
      const signedKey = buildSignatureObjectKey({
        storeId: current.storeId,
        patientId: current.patientId,
        signatureId: current.id,
        kind: 'signed',
      });
      await this.storage.put({
        key: signedKey,
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
      });

      current = current.withSigned(signedKey);
      await this.signatureRepository.save(current);
    } catch (error) {
      this.logger.warn(
        `Documento ${signature.id} assinado, PDF não armazenado: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private mergeSignerStatuses(
    current: ElectronicSigner[],
    webhookSigners: Array<{
      token?: string;
      status?: string;
      signUrl?: string;
      signedAt?: string | null;
    }>,
  ): ElectronicSigner[] {
    return current.map((signer, index) => {
      const match =
        webhookSigners.find(
          (item) => item.token && item.token === signer.zapsignSignerToken,
        ) ?? webhookSigners[index];
      if (!match) return signer;
      const nextStatus = this.mapSignerStatus(match.status);
      return {
        ...signer,
        status: nextStatus,
        signUrl: match.signUrl?.trim() || signer.signUrl,
        signedAt:
          match.signedAt?.trim() ||
          (nextStatus === 'signed'
            ? (signer.signedAt ?? new Date().toISOString())
            : signer.signedAt),
      };
    });
  }

  private mapSignerStatus(status: string | undefined): ElectronicSignerStatus {
    const normalized = (status ?? '').toLowerCase();
    if (normalized === 'signed') return 'signed';
    if (normalized === 'refused') return 'refused';
    if (normalized === 'pending' || normalized === 'link-opened') return 'pending';
    return 'new';
  }

  private async syncContractPartialStatuses(
    signature: ElectronicSignature,
  ): Promise<void> {
    if (!signature.targetId) return;
    const contract = await this.contractRepository.findById(
      signature.storeId,
      signature.patientId,
      signature.targetId,
    );
    if (!contract) return;

    const patient = signature.signers.find((s) => s.role === 'patient');
    const responsible = signature.signers.find(
      (s) => s.role === 'responsible',
    );

    await this.contractRepository.save(
      contract.withSignatureStatuses({
        patientSignatureStatus:
          patient?.status === 'signed' ? 'signed' : 'pending',
        responsibleSignatureStatus:
          responsible?.status === 'signed' ? 'signed' : 'pending',
      }),
    );
  }

  /**
   * Garante que anamnese/contrato/evoluções reflitam assinatura concluída.
   * Idempotente — seguro chamar de novo no GET by-target.
   */
  async reconcileSignedDocuments(
    signature: ElectronicSignature,
  ): Promise<void> {
    if (signature.status !== 'signed') return;
    await this.markDocumentsSigned(signature);
  }

  private async markDocumentsSigned(
    signature: ElectronicSignature,
  ): Promise<void> {
    if (signature.kind === 'anamnesis' && signature.targetId) {
      const anamnesis = await this.anamnesisRepository.findById(
        signature.storeId,
        signature.patientId,
        signature.targetId,
      );
      if (anamnesis) {
        await this.anamnesisRepository.save(
          anamnesis.withSignatureStatus('signed'),
        );
      }
      return;
    }

    if (signature.kind === 'contract' && signature.targetId) {
      const contract = await this.contractRepository.findById(
        signature.storeId,
        signature.patientId,
        signature.targetId,
      );
      if (contract) {
        await this.contractRepository.save(
          contract.withSignatureStatuses({
            patientSignatureStatus: 'signed',
            responsibleSignatureStatus: 'signed',
          }),
        );
      }
      return;
    }

    if (signature.kind === 'evolution_batch' && signature.targetIds) {
      const evolutions = await this.evolutionRepository.findByIds(
        signature.storeId,
        signature.patientId,
        signature.targetIds,
      );
      const hash = buildEvolutionConfirmationHash(
        signature.id,
        signature.zapsignDocumentToken,
      );
      for (const evolution of evolutions) {
        evolution.markSignatureSigned(signature.requestedByName, hash);
        await this.evolutionRepository.save(evolution);
      }
    }
  }

  private async revertDocumentStatuses(
    signature: ElectronicSignature,
  ): Promise<void> {
    if (signature.kind === 'anamnesis' && signature.targetId) {
      const anamnesis = await this.anamnesisRepository.findById(
        signature.storeId,
        signature.patientId,
        signature.targetId,
      );
      if (anamnesis && anamnesis.signatureStatus === 'pending') {
        await this.anamnesisRepository.save(
          anamnesis.withSignatureStatus('unsigned'),
        );
      }
      return;
    }

    if (signature.kind === 'contract' && signature.targetId) {
      const contract = await this.contractRepository.findById(
        signature.storeId,
        signature.patientId,
        signature.targetId,
      );
      if (contract) {
        await this.contractRepository.save(
          contract.withSignatureStatuses({
            patientSignatureStatus: 'unsigned',
            responsibleSignatureStatus: 'unsigned',
          }),
        );
      }
      return;
    }

    if (signature.kind === 'evolution_batch' && signature.targetIds) {
      const evolutions = await this.evolutionRepository.findByIds(
        signature.storeId,
        signature.patientId,
        signature.targetIds,
      );
      for (const evolution of evolutions) {
        if (evolution.signatureStatus === 'pending') {
          evolution.clearSignatureRequest();
          await this.evolutionRepository.save(evolution);
        }
      }
    }
  }
}
