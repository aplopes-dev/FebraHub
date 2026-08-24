import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../patients/domain/errors/patient-not-found.error';
import { PatientAnamnesisRepository } from '../../../../patients/patient-anamneses/domain/repositories/patient-anamnesis.repository.interface';
import { PatientAnamnesisNotFoundError } from '../../../../patients/patient-anamneses/domain/errors/patient-anamnesis-not-found.error';
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

export type RequestAnamnesisSignatureDto = {
  storeId: string;
  patientId: string;
  anamnesisId: string;
  fileBase64: string;
  signerEmail?: string;
  requestedById: string;
  requestedByName: string;
};

@Injectable()
export class RequestAnamnesisSignatureUseCase
  implements IUseCase<RequestAnamnesisSignatureDto, ElectronicSignature>
{
  constructor(
    private readonly signatureRepository: ElectronicSignatureRepository,
    private readonly anamnesisRepository: PatientAnamnesisRepository,
    private readonly patientRepository: PatientRepository,
    private readonly zapSignClient: ZapSignClient,
    private readonly storage: ObjectStorage,
    private readonly consumeSignatureCredit: ConsumeSignatureCreditService,
  ) {}

  async execute(
    dto: RequestAnamnesisSignatureDto,
  ): Promise<ElectronicSignature> {
    const patientDetail = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patientDetail) {
      throw new PatientNotFoundError(this.constructor.name, dto.patientId);
    }

    const anamnesis = await this.anamnesisRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.anamnesisId,
    );
    if (!anamnesis) {
      throw new PatientAnamnesisNotFoundError(
        this.constructor.name,
        dto.anamnesisId,
      );
    }

    if (anamnesis.status !== 'issued') {
      throw new ElectronicSignatureDocumentNotReadyError(
        this.constructor.name,
        'A anamnese precisa estar emitida antes da assinatura',
      );
    }

    if (anamnesis.signatureStatus !== 'unsigned') {
      throw new ElectronicSignatureDocumentNotReadyError(
        this.constructor.name,
        'Esta anamnese já possui solicitação de assinatura',
      );
    }

    const pending = await this.signatureRepository.findPendingByTarget(
      dto.storeId,
      'anamnesis',
      dto.anamnesisId,
    );
    if (pending) {
      throw new ElectronicSignatureAlreadyPendingError(
        this.constructor.name,
        dto.anamnesisId,
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
        name: `Anamnese — ${anamnesis.templateName}`,
        base64Pdf: pdfBuffer.toString('base64'),
        externalId: `anamnesis:${dto.anamnesisId}`,
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
          kind: 'anamnesis',
          targetId: dto.anamnesisId,
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
      await this.anamnesisRepository.save(
        anamnesis.withSignatureStatus('pending'),
      );
      return saved;
    } catch (error) {
      await this.consumeSignatureCredit.refund(dto.storeId, 1);
      throw error;
    }
  }
}

