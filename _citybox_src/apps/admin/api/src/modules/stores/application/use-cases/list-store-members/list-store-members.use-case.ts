import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import { getRoleCatalogItem } from '../../../domain/catalog/store-role.catalog';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import {
  deriveStoreMemberStatus,
  type StoreMemberLifecycleStatus,
} from '../../utils/store-member-status';

export interface ListStoreMembersDto {
  storeId: string;
}

export type StoreMemberView = {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
  roleLabel: string;
  permissions: string[];
  hasPassword: boolean;
  status: StoreMemberLifecycleStatus;
  disabledAt: string | null;
  provisionalExpiresAt: string | null;
};

@Injectable()
export class ListStoreMembersUseCase implements IUseCase<
  ListStoreMembersDto,
  StoreMemberView[]
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
  ) {}

  async execute({ storeId }: ListStoreMembersDto): Promise<StoreMemberView[]> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new StoreNotFoundError(ListStoreMembersUseCase.name, storeId);
    }

    const members = await this.storeDetailRepository.listMembers(storeId);

    return members.map((member) => ({
      id: member.id,
      username: member.username,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      role: member.role,
      roleLabel:
        getRoleCatalogItem(store.vertical, member.role)?.label ?? member.role,
      permissions: member.permissions,
      hasPassword: member.hasPassword,
      status: deriveStoreMemberStatus(member),
      disabledAt: member.disabledAt?.toISOString() ?? null,
      provisionalExpiresAt: member.provisionalExpiresAt?.toISOString() ?? null,
    }));
  }
}
