import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { KeycloakAdminService } from '../../../../../shared/infra/keycloak/keycloak-admin.service';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { StoreMemberNotFoundError } from '../../../domain/errors/store-member-not-found.error';

export type SendStoreMemberPasswordLinkDto = {
  storeId: string;
  memberId: string;
  actor: string;
};

@Injectable()
export class SendStoreMemberPasswordLinkUseCase implements IUseCase<
  SendStoreMemberPasswordLinkDto,
  void
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
    private readonly keycloakAdmin: KeycloakAdminService,
  ) {}

  async execute(dto: SendStoreMemberPasswordLinkDto): Promise<void> {
    const store = await this.storeRepository.findById(dto.storeId);
    if (!store) {
      throw new StoreNotFoundError(
        SendStoreMemberPasswordLinkUseCase.name,
        dto.storeId,
      );
    }

    const member = await this.storeDetailRepository.findMemberById(
      dto.storeId,
      dto.memberId,
    );
    if (!member) {
      throw new StoreMemberNotFoundError(
        SendStoreMemberPasswordLinkUseCase.name,
        dto.memberId,
      );
    }

    if (!member.email?.trim()) {
      throw new BadRequestException(
        'E-mail é obrigatório para enviar link de redefinição de senha',
      );
    }

    await this.keycloakAdmin.resendUserInvite(member.keycloakSub);

    await this.storeDetailRepository.recordAuditEvent({
      storeId: dto.storeId,
      severity: 'info',
      actor: dto.actor,
      module: 'Usuários',
      action: `Enviou link de redefinição de senha para ${member.firstName} ${member.lastName}`,
      details: member.email,
    });
  }
}
