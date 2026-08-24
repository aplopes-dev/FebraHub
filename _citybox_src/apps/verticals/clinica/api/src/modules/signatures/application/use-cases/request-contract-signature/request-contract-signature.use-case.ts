import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../patients/domain/errors/patient-not-found.error';
import { PatientContractEmissionRepository } from '../../../../patients/patient-contract-emissions/domain/repositories/patient-contract-emission.repository.interface';
import { PatientContractEmissionNotFoundError } from '../../../../patients/patient-contract-emissions/domain/errors/patient-contract-emission-not-found.error';
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

export type RequestContractSignatureDto = {
  storeId: string;
  patientId: string;
  contractId: string;
  fileBase64: string;
  signerEmail?: string;
  responsible: {
    name: string;
    email?: string;
    phone?: string;
  };
  requestedById: string;
  requestedByName: string;
};

@Injectable()
export class RequestContractSignatureUseCase
  implements IUseCase<RequestContractSignatureDto, ElectronicSignature>
{
  constructor(
    private readonly signatureRepository: ElectronicSignatureRepository,
    private readonly contractRepository: PatientContractEmissionRepository,
    private readonly patientRepository: PatientRepository,
    private readonly zapSignClient: ZapSignClient,
    private readonly storage: ObjectStorage,
    private readonly consumeSignatureCredit: ConsumeSignatureCreditService,
  ) {}

  async execute(
    dto: RequestContractSignatureDto,
  ): Promise<ElectronicSignature> {
    const patientDetail = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patientDetail) {
      throw new PatientNotFoundError(this.constructor.name, dto.patientId);
    }

    const contract = await this.contractRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.contractId,
    );
    if (!contract) {
      throw new PatientContractEmissionNotFoundError(
        this.constructor.name,
        dto.contractId,
      );
    }

    if (
      contract.patientSignatureStatus !== 'unsigned' ||
      contract.responsibleSignatureStatus !== 'unsigned'
    ) {
      throw new ElectronicSignatureDocumentNotReadyError(
        this.constructor.name,
        'Este contrato já possui solicitação de assinatura',
      );
    }

    const pending = await this.signatureRepository.findPendingByTarget(
      dto.storeId,
      'contract',
      dto.contractId,
    );
    if (pending) {
      throw new ElectronicSignatureAlreadyPendingError(
        this.constructor.name,
        dto.contractId,
      );
    }

    const responsibleName = dto.responsible.name.trim();
    if (!responsibleName) {
      throw new ElectronicSignatureDocumentNotReadyError(
        this.constructor.name,
        'Informe o nome do responsável/contratada',
      );
    }

    const pdfBuffer = decodePdfBase64(dto.fileBase64);
    if (pdfBuffer.length < 5 || pdfBuffer.subarray(0, 4).toString() !== '%PDF') {
      throw new ElectronicSignatureInvalidPdfError(this.constructor.name);
    }

    await this.consumeSignatureCredit.consume(dto.storeId, 1);

    try {
      const contact = resolvePatientSignerContact(patientDetail.patient);
      const patientEmail = (dto.signerEmail?.trim() || contact.email).trim();
      const patientPhone = normalizeBrazilPhone(contact.phone);
      const responsibleEmail = (dto.responsible.email ?? '').trim();
      const responsiblePhone = normalizeBrazilPhone(dto.responsible.phone ?? '');

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
        name: `Contrato — ${contract.templateName}`,
        base64Pdf: pdfBuffer.toString('base64'),
        externalId: `contract:${dto.contractId}`,
        signatureOrderActive: true,
        signers: [
          {
            name: contact.name,
            email: patientEmail,
            phoneCountry: '55',
            phoneNumber: patientPhone,
            authMode: 'assinaturaTela',
            sendAutomaticEmail: Boolean(patientEmail),
          },
          {
            name: responsibleName,
            email: responsibleEmail,
            phoneCountry: '55',
            phoneNumber: responsiblePhone,
            authMode: 'assinaturaTela',
            sendAutomaticEmail: Boolean(responsibleEmail),
          },
        ],
      });

      const patientSigner = zapDoc.signers[0];
      const responsibleSigner = zapDoc.signers[1];

      const signature = ElectronicSignature.create(
        {
          storeId: dto.storeId,
          patientId: dto.patientId,
          kind: 'contract',
          targetId: dto.contractId,
          zapsignDocumentToken: zapDoc.token,
          originalPdfObjectKey: originalKey,
          signers: [
            {
              role: 'patient',
              name: contact.name,
              email: patientEmail,
              phone: patientPhone,
              zapsignSignerToken: patientSigner?.token ?? '',
              signUrl: patientSigner?.signUrl ?? '',
              status: 'new',
              signedAt: null,
            },
            {
              role: 'responsible',
              name: responsibleName,
              email: responsibleEmail,
              phone: responsiblePhone,
              zapsignSignerToken: responsibleSigner?.token ?? '',
              signUrl: responsibleSigner?.signUrl ?? '',
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
      await this.contractRepository.save(
        contract.withSignatureStatuses({
          patientSignatureStatus: 'pending',
          responsibleSignatureStatus: 'pending',
        }),
      );
      return saved;
    } catch (error) {
      await this.consumeSignatureCredit.refund(dto.storeId, 1);
      throw error;
    }
  }
}
