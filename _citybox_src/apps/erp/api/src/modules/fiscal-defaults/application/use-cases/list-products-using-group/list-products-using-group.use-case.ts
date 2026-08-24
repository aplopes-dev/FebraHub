import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  FiscalGroupRepository,
  type FiscalGroupProductRef,
} from '../../../domain/repositories/fiscal-group.repository.interface';
import type { ListProductsUsingGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Produtos que usam o grupo (aba "Produtos", somente-leitura — spec erp/015). */
@Injectable()
export class ListProductsUsingGroupUseCase implements IUseCase<
  ListProductsUsingGroupDto,
  FiscalGroupProductRef[]
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  execute(input: ListProductsUsingGroupDto): Promise<FiscalGroupProductRef[]> {
    return this.repository.listProductsUsingGroup(
      input.organizationId,
      input.groupId,
    );
  }
}
