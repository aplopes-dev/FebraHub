import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalAdditionalInfo } from '../../../domain/entities/fiscal-additional-info.entity';
import { FiscalAdditionalInfoRepository } from '../../../domain/repositories/fiscal-additional-info.repository.interface';
import type { CreateFiscalAdditionalInfoDto } from '../../dtos/fiscal-additional-info.dto';

/**
 * Cria uma informação adicional (spec erp/017). A validação (destino disponível
 * para o tipo, teto do XSD por campo) mora na entidade.
 */
@Injectable()
export class CreateFiscalAdditionalInfoUseCase implements IUseCase<
  CreateFiscalAdditionalInfoDto,
  FiscalAdditionalInfo
> {
  constructor(private readonly repository: FiscalAdditionalInfoRepository) {}

  async execute(
    input: CreateFiscalAdditionalInfoDto,
  ): Promise<FiscalAdditionalInfo> {
    // async: a validação da entidade lança síncrono; sem async isso escaparia
    // como throw em vez de Promise rejeitada.
    const info = FiscalAdditionalInfo.create({
      organizationId: input.organizationId,
      name: input.name,
      text: input.text,
      documentType: input.documentType,
      target: input.target,
    });
    return this.repository.save(info);
  }
}
