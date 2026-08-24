import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { FiscalAdditionalInfo } from '../../../domain/entities/fiscal-additional-info.entity';
import { FiscalAdditionalInfoRepository } from '../../../domain/repositories/fiscal-additional-info.repository.interface';
import type { ListFiscalAdditionalInfosDto } from '../../dtos/fiscal-additional-info.dto';

/** Lista informações adicionais da organização (opcionalmente por tipo). */
@Injectable()
export class ListFiscalAdditionalInfosUseCase implements IUseCase<
  ListFiscalAdditionalInfosDto,
  FiscalAdditionalInfo[]
> {
  constructor(private readonly repository: FiscalAdditionalInfoRepository) {}

  execute(
    input: ListFiscalAdditionalInfosDto,
  ): Promise<FiscalAdditionalInfo[]> {
    return this.repository.listByOrganization(
      input.organizationId,
      input.documentType,
    );
  }
}
