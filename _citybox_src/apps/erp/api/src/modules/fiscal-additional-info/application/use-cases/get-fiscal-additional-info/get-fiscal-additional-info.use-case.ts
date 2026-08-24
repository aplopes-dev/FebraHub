import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { FiscalAdditionalInfo } from '../../../domain/entities/fiscal-additional-info.entity';
import { FiscalAdditionalInfoNotFoundError } from '../../../domain/errors/fiscal-additional-info-not-found.error';
import { FiscalAdditionalInfoRepository } from '../../../domain/repositories/fiscal-additional-info.repository.interface';

type Input = { organizationId: string; id: string };

@Injectable()
export class GetFiscalAdditionalInfoUseCase implements IUseCase<
  Input,
  FiscalAdditionalInfo
> {
  constructor(private readonly repository: FiscalAdditionalInfoRepository) {}

  async execute(input: Input): Promise<FiscalAdditionalInfo> {
    const info = await this.repository.findById(input.organizationId, input.id);
    if (!info) {
      throw new FiscalAdditionalInfoNotFoundError(input.id);
    }
    return info;
  }
}
