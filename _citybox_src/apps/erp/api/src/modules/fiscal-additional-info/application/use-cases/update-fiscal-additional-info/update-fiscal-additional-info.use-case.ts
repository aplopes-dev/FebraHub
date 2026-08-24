import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { FiscalAdditionalInfo } from '../../../domain/entities/fiscal-additional-info.entity';
import { FiscalAdditionalInfoNotFoundError } from '../../../domain/errors/fiscal-additional-info-not-found.error';
import { FiscalAdditionalInfoRepository } from '../../../domain/repositories/fiscal-additional-info.repository.interface';
import type { UpdateFiscalAdditionalInfoDto } from '../../dtos/fiscal-additional-info.dto';

/** Edita nome, texto e destino. O `documentType` é imutável (ver entidade). */
@Injectable()
export class UpdateFiscalAdditionalInfoUseCase implements IUseCase<
  UpdateFiscalAdditionalInfoDto,
  FiscalAdditionalInfo
> {
  constructor(private readonly repository: FiscalAdditionalInfoRepository) {}

  async execute(
    input: UpdateFiscalAdditionalInfoDto,
  ): Promise<FiscalAdditionalInfo> {
    const existing = await this.repository.findById(
      input.organizationId,
      input.id,
    );
    if (!existing) {
      throw new FiscalAdditionalInfoNotFoundError(input.id);
    }
    const updated = existing.update({
      name: input.name,
      text: input.text,
      target: input.target,
    });
    return this.repository.save(updated);
  }
}
