import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../patients/domain/errors/patient-not-found.error';
import { TreatmentEvolutionRepository } from '../../../../patients/treatment-evolutions/domain/repositories/treatment-evolution.repository.interface';
import { ElectronicSignature } from '../../../domain/entities/electronic-signature.entity';
import { ElectronicSignatureRepository } from '../../../domain/repositories/electronic-signature.repository.interface';
import { ZapSignClient } from '../../../domain/zapsign/zapsign-client.interface';
import { ElectronicSignatureAlreadyPendingError } from '../../../domain/errors/electronic-signature-already-pending.error';
import { ElectronicSignatureDocumentNotReadyError } from '../../../domain/errors/electronic-signature-document-not-ready.error';
import { ElectronicSignatureInvalidPdfError } from '../../../domain/errors/electronic-signature-invalid-pdf.error';
import {
  buildSignatureObjectKey,
  decodePdfBase64,
  normalizeBrazilPhone,
  resolvePatientSignerContact,
} from '../../utils/signature-helpers';
import { ConsumeSignatureCreditService } from '../../../../signature-packages/application/services/consume-signature-credit.service';

export type RequestEvolutionBatchSignatureDto = {
  storeId: string;
  patientId: string;
  evolutionIds: string[];
  fileBase64: string;
  signerEmail?: string;
  requestedById: string;
  requestedByName: string;
};

@Injectable()
export class RequestEvolutionBatchSignatureUseCase
  implements IUseCase<RequestEvolutionBatchSignatureDto, ElectronicSignature>
{
  constructor(
    private readonly signatureRepository: ElectronicSignatureRepository,
    private readonly evolutionRepository: TreatmentEvolutionRepository,
    private readonly patientRepository: PatientRepository,
    private readonly zapSignClient: ZapSignClient,
    private readonly storage: ObjectStorage,
    private readonly consumeSignatureCredit: ConsumeSignatureCreditService,
  ) {}

  async execute(
    dto: RequestEvolutionBatchSignatureDto,
  ): Promise<ElectronicSignature> {
    const uniqueIds = [...new Set(dto.evolutionIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      throw new ElectronicSignatureDocumentNotReadyError(
        this.constructor.name,
        'Selecione ao menos uma evolução para assinar',
      );
    }

    const patientDetail = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patientDetail) {
      throw new PatientNotFoundError(this.constructor.name, dto.patientId);
    }

    const evolutions = await this.evolutionRepository.findByIds(
      dto.storeId,
      dto.patientId,
      uniqueIds,
    );
    if (evolutions.length !== uniqueIds.length) {
      throw new ElectronicSignatureDocumentNotReadyError(
        this.constructor.name,
        'Uma ou mais evoluções não foram encontradas',
      );
    }

    for (const evolution of evolutions) {
      if (evolution.signatureStatus !== 'unsigned') {
        throw new ElectronicSignatureDocumentNotReadyError(
          this.constructor.name,
          'Uma ou mais evoluções já possuem assinatura pendente ou concluída',
        );
      }
    }

    const pendingOverlap =
      await this.signatureRepository.findPendingOverlappingTargets(
        dto.storeId,
        dto.patientId,
        uniqueIds,
      );
    if (pendingOverlap) {
      throw new ElectronicSignatureAlreadyPendingError(
        this.constructor.name,
        uniqueIds.join(','),
      );
    }

    const pdfBuffer = decodePdfBase64(dto.fileBase64);
    if (pdfBuffer.length < 5 || pdfBuffer.subarray(0, 4).toString() !== '%PDF') {
      throw new ElectronicSignatureInvalidPdfError(this.constructor.name);
    }

    await this.consumeSignatureCredit.consume(dto.storeId, 1);

    try {
      const contact = resolvePatientSignerContact(patientDetail.patient);
      const email = (dto.signerEmail?.trim() || contact.email).trim();
      const phone = normalizeBrazilPhone(contact.phone);
      const signatureId = randomUUID();
      const originalKey = buildSignatureObjectKey({
        storeId: dto.storeId,
        patientId: dto.patientId,
        signatureId,
        kind: 'original',
      });

      await this.storage.put({
        key: originalKey,
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
      });

      const zapDoc = await this.zapSignClient.createDocument({
        name: `Evoluções — ${patientDetail.patient.name}`,
        base64Pdf: pdfBuffer.toString('base64'),
        externalId: `evolution_batch:${signatureId}`,
        signers: [
          {
            name: contact.name,
            email,
            phoneCountry: '55',
            phoneNumber: phone,
            authMode: 'assinaturaTela',
            sendAutomaticEmail: false,
          },
        ],
      });

      const signer = zapDoc.signers[0];
      const signature = ElectronicSignature.create(
        {
          storeId: dto.storeId,
          patientId: dto.patientId,
          kind: 'evolution_batch',
          targetIds: uniqueIds,
          zapsignDocumentToken: zapDoc.token,
          originalPdfObjectKey: originalKey,
          signers: [
            {
              role: 'patient',
              name: contact.name,
              email,
              phone,
              zapsignSignerToken: signer?.token ?? '',
              signUrl: signer?.signUrl ?? '',
              status: 'new',
              signedAt: null,
            },
          ],
          requestedById: dto.requestedById,
          requestedByName: dto.requestedByName,
          requestedAt: new Date(),
        },
        signatureId,
      );

      const saved = await this.signatureRepository.save(signature);

      for (const evolution of evolutions) {
        evolution.markSignaturePending(saved.id);
        await this.evolutionRepository.save(evolution);
      }

      return saved;
    } catch (error) {
      await this.consumeSignatureCredit.refund(dto.storeId, 1);
      throw error;
    }
  }
}

/** Hash estável para confirmationHash (auditoria CLIN-011 parcial). */
export function buildEvolutionConfirmationHash(
  signatureId: string,
  zapsignToken: string,
): string {
  return createHash('sha256')
    .update(`${signatureId}:${zapsignToken}`)
    .digest('hex')
    .slice(0, 64);
}
