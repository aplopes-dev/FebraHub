import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { FiscalDocumentType } from '../../../domain/entities/fiscal-additional-info.entity';
import { FiscalAdditionalInfoRepository } from '../../../domain/repositories/fiscal-additional-info.repository.interface';

export type CountFiscalAdditionalInfosDto = { organizationId: string };
export type FiscalAdditionalInfoCounts = Record<FiscalDocumentType, number> & {
  total: number;
};

/** Contagem por tipo de documento (spec erp/023, N7 — card em Padrões fiscais). */
@Injectable()
export class CountFiscalAdditionalInfosUseCase implements IUseCase<
  CountFiscalAdditionalInfosDto,
  FiscalAdditionalInfoCounts
> {
  constructor(private readonly repository: FiscalAdditionalInfoRepository) {}

  async execute(
    input: CountFiscalAdditionalInfosDto,
  ): Promise<FiscalAdditionalInfoCounts> {
    const byType = await this.repository.countByDocumentType(
      input.organizationId,
    );
    const total = byType.NFE + byType.NFCE + byType.NFSE;
    return { ...byType, total };
  }
}
