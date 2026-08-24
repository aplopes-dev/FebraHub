import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { KeycloakAdminService } from '../../../../../shared/infra/keycloak/keycloak-admin.service';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import {
  StoreDetailRepository,
  type StoreMemberRow,
} from '../../../domain/repositories/store-detail.repository.interface';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { StoreMemberNotFoundError } from '../../../domain/errors/store-member-not-found.error';

export type UpdateStoreMemberStatusDto = {
  storeId: string;
  memberId: string;
  status: 'active' | 'inactive';
  actor: string;
};

@Injectable()
export class UpdateStoreMemberStatusUseCase implements IUseCase<
  UpdateStoreMemberStatusDto,
  StoreMemberRow
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
    private readonly keycloakAdmin: KeycloakAdminService,
  ) {}

  async execute(dto: UpdateStoreMemberStatusDto): Promise<StoreMemberRow> {
    const store = await this.storeRepository.findById(dto.storeId);
    if (!store) {
      throw new StoreNotFoundError(
        UpdateStoreMemberStatusUseCase.name,
        dto.storeId,
      );
    }

    const member = await this.storeDetailRepository.findMemberById(
      dto.storeId,
      dto.memberId,
    );
    if (!member) {
      throw new StoreMemberNotFoundError(
        UpdateStoreMemberStatusUseCase.name,
        dto.memberId,
      );
    }

    const disabledAt = dto.status === 'inactive' ? new Date() : null;
    await this.keycloakAdmin.setUserEnabled(
      member.keycloakSub,
      dto.status === 'active',
    );
    const updated = await this.storeDetailRepository.setMemberDisabled(
      dto.storeId,
      dto.memberId,
      disabledAt,
    );

    await this.storeDetailRepository.recordAuditEvent({
      storeId: dto.storeId,
      severity: dto.status === 'inactive' ? 'aviso' : 'info',
      actor: dto.actor,
      module: 'Usuários',
      action:
        dto.status === 'inactive'
          ? `Desativou ${member.firstName} ${member.lastName}`
          : `Reativou ${member.firstName} ${member.lastName}`,
    });

    return updated;
  }
}
