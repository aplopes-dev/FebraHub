import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { ElectronicSignature } from '../../../domain/entities/electronic-signature.entity';
import { ElectronicSignatureRepository } from '../../../domain/repositories/electronic-signature.repository.interface';
import { ZapSignClient } from '../../../domain/zapsign/zapsign-client.interface';
import { ElectronicSignatureNotFoundError } from '../../../domain/errors/electronic-signature-not-found.error';
import { ElectronicSignatureDocumentNotReadyError } from '../../../domain/errors/electronic-signature-document-not-ready.error';
import { buildSignatureObjectKey } from '../../utils/signature-helpers';

export type GetSignedPdfDto = {
  storeId: string;
  patientId: string;
  signatureId: string;
};

export type SignedPdfResult = {
  buffer: Buffer;
  mimeType: string;
  filename: string;
};

@Injectable()
export class GetSignedPdfUseCase
  implements IUseCase<GetSignedPdfDto, SignedPdfResult>
{
  private readonly logger = new Logger(GetSignedPdfUseCase.name);

  constructor(
    private readonly signatureRepository: ElectronicSignatureRepository,
    private readonly storage: ObjectStorage,
    private readonly zapSignClient: ZapSignClient,
  ) {}

  async execute(dto: GetSignedPdfDto): Promise<SignedPdfResult> {
    let signature = await this.signatureRepository.findById(
      dto.storeId,
      dto.signatureId,
    );
    if (!signature || signature.patientId !== dto.patientId) {
      throw new ElectronicSignatureNotFoundError(
        this.constructor.name,
        dto.signatureId,
      );
    }

    if (signature.status !== 'signed') {
      const original = await this.storage.get(signature.originalPdfObjectKey);
      return {
        buffer: original.buffer,
        mimeType: original.mimeType || 'application/pdf',
        filename: `contrato-${signature.id}.pdf`,
      };
    }

    if (!signature.signedPdfObjectKey) {
      signature = await this.fetchAndStoreSignedPdf(signature);
    }

    if (!signature.signedPdfObjectKey) {
      throw new ElectronicSignatureDocumentNotReadyError(
        this.constructor.name,
        'PDF assinado ainda não disponível',
      );
    }

    const object = await this.storage.get(signature.signedPdfObjectKey);
    return {
      buffer: object.buffer,
      mimeType: object.mimeType || 'application/pdf',
      filename: `contrato-assinado-${signature.id}.pdf`,
    };
  }

  private async fetchAndStoreSignedPdf(
    signature: ElectronicSignature,
  ): Promise<ElectronicSignature> {
    try {
      const detail = await this.zapSignClient.getDocument(
        signature.zapsignDocumentToken,
      );
      if (!detail.signedFile) {
        return signature;
      }
      const pdfBuffer = await this.zapSignClient.downloadSignedPdf(
        detail.signedFile,
      );
      const signedKey = buildSignatureObjectKey({
        storeId: signature.storeId,
        patientId: signature.patientId,
        signatureId: signature.id,
        kind: 'signed',
      });
      await this.storage.put({
        key: signedKey,
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
      });
      return this.signatureRepository.save(signature.withSigned(signedKey));
    } catch (error) {
      this.logger.warn(
        `Falha ao obter PDF assinado da ZapSign (${signature.id}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return signature;
    }
  }
}
