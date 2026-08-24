import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { KeycloakAdminService } from '../../../../../shared/infra/keycloak/keycloak-admin.service';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { StoreMemberNotFoundError } from '../../../domain/errors/store-member-not-found.error';
import { generateProvisionalPassword } from '../../utils/generate-provisional-password';

export type ResetStoreMemberPasswordDto = {
  storeId: string;
  memberId: string;
  actor: string;
};

export type ResetStoreMemberPasswordResult = {
  username: string;
  temporaryPassword: string;
};

@Injectable()
export class ResetStoreMemberPasswordUseCase implements IUseCase<
  ResetStoreMemberPasswordDto,
  ResetStoreMemberPasswordResult
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
    private readonly keycloakAdmin: KeycloakAdminService,
  ) {}

  async execute(
    dto: ResetStoreMemberPasswordDto,
  ): Promise<ResetStoreMemberPasswordResult> {
    const store = await this.storeRepository.findById(dto.storeId);
    if (!store) {
      throw new StoreNotFoundError(
        ResetStoreMemberPasswordUseCase.name,
        dto.storeId,
      );
    }

    const member = await this.storeDetailRepository.findMemberById(
      dto.storeId,
      dto.memberId,
    );
    if (!member) {
      throw new StoreMemberNotFoundError(
        ResetStoreMemberPasswordUseCase.name,
        dto.memberId,
      );
    }

    const temporaryPassword = generateProvisionalPassword();
    await this.keycloakAdmin.updateUserProfile(member.keycloakSub, {
      firstName: member.firstName,
      lastName: member.lastName,
    });
    await this.keycloakAdmin.setProvisionalPassword(
      member.keycloakSub,
      temporaryPassword,
    );
    await this.storeDetailRepository.markMemberHasPassword(
      dto.storeId,
      dto.memberId,
    );

    const action = member.hasPassword
      ? `Redefiniu senha provisória de ${member.firstName} ${member.lastName}`
      : `Gerou senha provisória de ${member.firstName} ${member.lastName}`;

    await this.storeDetailRepository.recordAuditEvent({
      storeId: dto.storeId,
      severity: 'info',
      actor: dto.actor,
      module: 'Usuários',
      action,
    });

    return {
      username: member.username,
      temporaryPassword,
    };
  }
}
