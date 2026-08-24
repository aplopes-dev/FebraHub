import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CertificateRepository } from '../../../domain/repositories/certificate.repository.interface';
import { Certificate } from '../../../domain/entities/certificate.entity';
import type { ListCertificatesDto } from '../../dtos/certificate.dto';

/// `GET /companies/{companyId}/certificates` — histórico + o(s) ativo(s) de
/// um Emitente (contracts/certificates-api.md).
@Injectable()
export class ListCertificatesUseCase implements IUseCase<
  ListCertificatesDto,
  Certificate[]
> {
  constructor(private readonly certificateRepository: CertificateRepository) {}

  execute(dto: ListCertificatesDto): Promise<Certificate[]> {
    return this.certificateRepository.findAllByCompanyId(dto.companyId);
  }
}
