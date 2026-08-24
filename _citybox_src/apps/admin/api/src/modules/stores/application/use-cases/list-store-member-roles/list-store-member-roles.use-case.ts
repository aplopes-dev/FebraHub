import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { getRoleCatalogForVertical } from '../../../domain/catalog/store-role.catalog';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';

export interface ListStoreMemberRolesDto {
  storeId: string;
}

@Injectable()
export class ListStoreMemberRolesUseCase implements IUseCase<
  ListStoreMemberRolesDto,
  { roleKey: string; label: string }[]
> {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute({ storeId }: ListStoreMemberRolesDto) {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new StoreNotFoundError(ListStoreMemberRolesUseCase.name, storeId);
    }

    return getRoleCatalogForVertical(store.vertical);
  }
}
