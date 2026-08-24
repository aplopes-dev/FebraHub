import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ElectronicSignature } from '../../../domain/entities/electronic-signature.entity';
import { ElectronicSignatureRepository } from '../../../domain/repositories/electronic-signature.repository.interface';
import { ElectronicSignatureNotFoundError } from '../../../domain/errors/electronic-signature-not-found.error';

export type GetElectronicSignatureDto = {
  storeId: string;
  patientId: string;
  signatureId: string;
};

@Injectable()
export class GetElectronicSignatureUseCase
  implements IUseCase<GetElectronicSignatureDto, ElectronicSignature>
{
  constructor(
    private readonly signatureRepository: ElectronicSignatureRepository,
  ) {}

  async execute(dto: GetElectronicSignatureDto): Promise<ElectronicSignature> {
    const signature = await this.signatureRepository.findById(
      dto.storeId,
      dto.signatureId,
    );
    if (!signature || signature.patientId !== dto.patientId) {
      throw new ElectronicSignatureNotFoundError(
        this.constructor.name,
        dto.signatureId,
      );
    }
    return signature;
  }
}
