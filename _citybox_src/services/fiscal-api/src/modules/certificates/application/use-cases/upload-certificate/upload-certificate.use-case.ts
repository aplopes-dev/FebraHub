import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../../companies/domain/repositories/company.repository.interface';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import { CertificateRepository } from '../../../domain/repositories/certificate.repository.interface';
import { Certificate } from '../../../domain/entities/certificate.entity';
import { CertificateCnpjMismatchError } from '../../../domain/errors/certificate-cnpj-mismatch.error';
import { Pkcs12FileValidator } from '../../../domain/validators/pkcs12-file.validator';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { parsePkcs12 } from '../../../../../shared/infra/fiscal-signature/pkcs12-parser';
import {
  encryptBinary,
  encryptSecret,
} from '../../../../../shared/infra/fiscal-signature/cert-encryption';
import type { UploadCertificateDto } from '../../dtos/certificate.dto';

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/// FR-007/FR-008, US3 Acceptance Scenario 1/2, SC-006 — upload do certificado
/// A1: valida assinatura binária → parse PKCS#12 (senha/validade/estrutura)
/// → confere CNPJ do certificado contra o Emitente → criptografa senha +
/// `.pfx` bruto (AES-256-GCM) → grava no MinIO → persiste `Certificate`
/// (nasce sempre `VALID` — Certificate.create()). Nada é persistido se
/// qualquer validação falhar (falha fechado).
@Injectable()
export class UploadCertificateUseCase implements IUseCase<
  UploadCertificateDto,
  Certificate
> {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly certificateRepository: CertificateRepository,
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(dto: UploadCertificateDto): Promise<Certificate> {
    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) {
      throw new CompanyNotFoundError(
        UploadCertificateUseCase.name,
        dto.companyId,
      );
    }

    Pkcs12FileValidator.validate(
      dto.buffer,
      dto.filename,
      UploadCertificateUseCase.name,
    );

    // parsePkcs12 já valida estrutura PKCS#12, senha e expiração,
    // lançando Pkcs12ParseError (422) em qualquer falha — nada é
    // persistido antes desta chamada retornar com sucesso.
    const parsed = parsePkcs12(dto.buffer, dto.password);

    const certificateCnpjDigits = parsed.subjectCnpj
      ? onlyDigits(parsed.subjectCnpj)
      : null;
    const companyCnpjDigits = onlyDigits(company.cnpj);
    if (!certificateCnpjDigits || certificateCnpjDigits !== companyCnpjDigits) {
      throw new CertificateCnpjMismatchError(
        UploadCertificateUseCase.name,
        certificateCnpjDigits ?? '(não identificado)',
        companyCnpjDigits,
      );
    }

    const pfxObjectKey = `${company.id}/certificates/${randomUUID()}.pfx.enc`;
    await this.objectStorage.put({
      key: pfxObjectKey,
      buffer: Buffer.from(encryptBinary(dto.buffer), 'utf-8'),
      mimeType: 'text/plain',
    });

    const certificate = Certificate.create({
      companyId: company.id,
      type: 'A1',
      name: dto.name ?? null,
      encryptedPfxObjectKey: pfxObjectKey,
      encryptedPassword: encryptSecret(dto.password),
      subjectCnpj: certificateCnpjDigits,
      validFrom: parsed.validFrom,
      validUntil: parsed.validUntil,
    });

    return this.certificateRepository.save(certificate);
  }
}
