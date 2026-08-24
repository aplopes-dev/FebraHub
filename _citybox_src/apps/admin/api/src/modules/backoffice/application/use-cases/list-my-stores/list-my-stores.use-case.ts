import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BackofficeStoreRepository } from '../../../infrastructure/database/backoffice-store.repository';
import type { MyStoreView } from '../../../domain/my-store.view';

@Injectable()
export class ListMyStoresUseCase implements IUseCase<string, MyStoreView[]> {
  constructor(private readonly backofficeStores: BackofficeStoreRepository) {}

  execute(keycloakSub: string): Promise<MyStoreView[]> {
    if (!keycloakSub.trim()) return Promise.resolve([]);
    return this.backofficeStores.listStoresForMember(keycloakSub.trim());
  }
}
