import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalAdditionalInfoNotFoundError } from '../../../domain/errors/fiscal-additional-info-not-found.error';
import { FiscalAdditionalInfoRepository } from '../../../domain/repositories/fiscal-additional-info.repository.interface';

type Input = { organizationId: string; id: string };

@Injectable()
export class DeleteFiscalAdditionalInfoUseCase implements IUseCase<
  Input,
  void
> {
  constructor(private readonly repository: FiscalAdditionalInfoRepository) {}

  async execute(input: Input): Promise<void> {
    const existing = await this.repository.findById(
      input.organizationId,
      input.id,
    );
    if (!existing) {
      throw new FiscalAdditionalInfoNotFoundError(input.id);
    }
    await this.repository.delete(input.organizationId, input.id);
  }
}
