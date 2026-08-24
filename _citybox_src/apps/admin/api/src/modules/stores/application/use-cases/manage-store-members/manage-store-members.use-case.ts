import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { KeycloakAdminService } from '../../../../../shared/infra/keycloak/keycloak-admin.service';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import type { StoreMemberRow } from '../../../domain/repositories/store-detail.repository.interface';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { StoreMemberNotFoundError } from '../../../domain/errors/store-member-not-found.error';
import { StoreMemberQuotaExceededError } from '../../../domain/errors/store-member-quota-exceeded.error';
import { ActiveSubscriptionRequiredError } from '../../../domain/errors/active-subscription-required.error';
import { SubscriptionRepository } from '../../../../subscriptions/domain/repositories/subscription.repository.interface';
import { PlanRepository } from '../../../../plans/domain/repositories/plan.repository.interface';
import { isValidRoleForVertical } from '../../../domain/catalog/store-role.catalog';
import type {
  DeleteStoreMemberDto,
  UpsertStoreMemberDto,
} from '../../dtos/store-detail.dto';
import { generateProvisionalPassword } from '../../utils/generate-provisional-password';
import { validateStoreMemberOnboarding } from '../../utils/validate-store-member-onboarding';
import { provisionalExpiresAtFromNow } from '../../utils/store-member-status';

const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export type UpsertStoreMemberResult = {
  member: StoreMemberRow;
  meta?: {
    temporaryPassword?: string;
    inviteEmailSent?: boolean;
    linkedExistingAccount?: boolean;
  };
};

@Injectable()
export class UpsertStoreMemberUseCase implements IUseCase<
  UpsertStoreMemberDto,
  UpsertStoreMemberResult
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
    private readonly keycloakAdmin: KeycloakAdminService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
  ) {}

  async execute(dto: UpsertStoreMemberDto): Promise<UpsertStoreMemberResult> {
    const store = await this.storeRepository.findById(dto.storeId);
    if (!store) {
      throw new StoreNotFoundError(UpsertStoreMemberUseCase.name, dto.storeId);
    }

    if (!isValidRoleForVertical(store.vertical, dto.role)) {
      throw new BadRequestException(
        'Cargo inválido para a vertical desta loja',
      );
    }

    if (dto.memberId) {
      const member = await this.updateExistingMember(dto);
      return { member };
    }

    const email = dto.email?.trim().toLowerCase() || undefined;
    const username = dto.username.trim().toLowerCase();

    // Identidade já existente na plataforma. Até a Fase 10 um membro podia ser
    // reaproveitado entre lojas do mesmo Cliente; sem Cliente, cada loja é um cliente
    // independente e reaproveitar cruzaria a fronteira de tenant — a equipe de uma loja
    // ficaria visível/gerenciável a partir de outra.
    const existing =
      await this.storeDetailRepository.findMemberByEmailOrUsername(
        email,
        username,
      );
    if (existing) {
      const alreadyInThisStore =
        await this.storeDetailRepository.findMemberByStoreAndSub(
          dto.storeId,
          existing.keycloakSub,
        );
      if (alreadyInThisStore) {
        throw new BadRequestException('Este usuário já faz parte desta loja');
      }
      throw new BadRequestException(
        'Este e-mail já está associado a outro cliente',
      );
    }

    const subscription = await this.subscriptionRepository.findActiveByStoreId(
      store.id,
    );
    if (!subscription) {
      throw new ActiveSubscriptionRequiredError(
        UpsertStoreMemberUseCase.name,
        store.id,
      );
    }

    const plan = await this.planRepository.findById(subscription.planId!);
    if (!plan) {
      throw new ActiveSubscriptionRequiredError(
        UpsertStoreMemberUseCase.name,
        store.id,
      );
    }

    const currentMembers = await this.storeDetailRepository.listMembers(
      dto.storeId,
    );
    const activeSeatCount = currentMembers.filter(
      (member) => !member.disabledAt,
    ).length;
    if (activeSeatCount >= plan.maxUsers) {
      throw new StoreMemberQuotaExceededError(
        UpsertStoreMemberUseCase.name,
        plan.maxUsers,
      );
    }

    return this.createMember(dto, store.vertical);
  }

  private async updateExistingMember(
    dto: UpsertStoreMemberDto,
  ): Promise<StoreMemberRow> {
    const existing = await this.storeDetailRepository.findMemberById(
      dto.storeId,
      dto.memberId!,
    );
    if (!existing) {
      throw new StoreMemberNotFoundError(
        UpsertStoreMemberUseCase.name,
        dto.memberId!,
      );
    }

    const member = await this.storeDetailRepository.updateMember(
      dto.storeId,
      dto.memberId!,
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        permissions: dto.permissions,
      },
    );

    // Atualização de e-mail ficou fora daqui: este caminho serve verticais que NÃO
    // gerenciam a própria equipe, e hoje nenhuma se encaixa. A funcionalidade vive no
    // `ManageMemberUseCase` da clinica-api, que é onde o membro de fato existe.
    await this.keycloakAdmin.updateUserProfile(existing.keycloakSub, {
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.storeDetailRepository.recordAuditEvent({
      storeId: dto.storeId,
      severity: 'info',
      actor: dto.actor,
      module: 'Usuários',
      action: `Atualizou usuário ${member.firstName} ${member.lastName}`,
    });

    return member;
  }

  private async createMember(
    dto: UpsertStoreMemberDto,
    vertical: string,
  ): Promise<UpsertStoreMemberResult> {
    validateStoreMemberOnboarding(dto);

    const username = dto.username.trim().toLowerCase();
    const email = dto.email?.trim().toLowerCase() || undefined;

    if (!username) {
      throw new BadRequestException('Username é obrigatório');
    }

    if (!USERNAME_PATTERN.test(username)) {
      throw new BadRequestException(
        'Username não pode conter espaços nem caracteres especiais',
      );
    }

    const generatePassword = dto.generateProvisionalPassword ?? false;
    const sendInvite = dto.sendInviteEmail ?? false;

    const kcExisting = await this.keycloakAdmin.findUserByEmailOrUsername(
      email,
      username,
    );
    let keycloakSub: string;
    let linkedExistingAccount = false;
    let createdInKeycloak = false;

    if (kcExisting?.sub) {
      keycloakSub = kcExisting.sub;
      linkedExistingAccount = true;
    } else {
      const created = await this.keycloakAdmin.createStoreBackofficeUser({
        username,
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        emailVerified: generatePassword,
      });
      keycloakSub = created.sub;
      createdInKeycloak = created.created;
      linkedExistingAccount = !created.created;
    }

    const duplicate = await this.storeDetailRepository.findMemberByStoreAndSub(
      dto.storeId,
      keycloakSub,
    );
    if (duplicate) {
      throw new BadRequestException('Este usuário já faz parte desta loja');
    }

    // TODO(F2): via M2M. O `provisionStoreOperator` saiu daqui com o ADR C-16 —
    // ele atribuía `store_staff` + `vertical.<slug>.view`, roles que não existem
    // mais, e escrevia no Keycloak de outro sistema. Membro de vertical passa a
    // ser criado pela própria vertical, via `admin-m2m` (fase F2 do plano). Até
    // lá este caminho cria a identidade no realm `citybox-admin`, que **não** é
    // onde o lojista vive — não use em produção.
    void vertical;

    let temporaryPassword: string | undefined;
    let inviteEmailSent: boolean | undefined;

    if (generatePassword) {
      await this.keycloakAdmin.updateUserProfile(keycloakSub, {
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
      temporaryPassword = generateProvisionalPassword();
      await this.keycloakAdmin.setProvisionalPassword(
        keycloakSub,
        temporaryPassword,
      );
    } else if (sendInvite) {
      inviteEmailSent = await this.keycloakAdmin.sendInviteEmail(keycloakSub);
    }

    const member = await this.storeDetailRepository.createMember({
      storeId: dto.storeId,
      keycloakSub,
      username,
      email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      permissions: dto.permissions,
      hasPassword: generatePassword,
      provisionalExpiresAt: generatePassword
        ? null
        : provisionalExpiresAtFromNow(),
    });

    await this.storeDetailRepository.recordAuditEvent({
      storeId: dto.storeId,
      severity: 'info',
      actor: dto.actor,
      module: 'Usuários',
      action: `Adicionou usuário ${member.firstName} ${member.lastName}`,
      details: generatePassword
        ? 'Acesso com senha provisória'
        : sendInvite
          ? 'Convite por e-mail'
          : 'Acesso sem senha — gerar depois pelo painel',
    });

    return {
      member,
      meta: {
        ...(temporaryPassword ? { temporaryPassword } : {}),
        ...(inviteEmailSent !== undefined ? { inviteEmailSent } : {}),
        linkedExistingAccount: linkedExistingAccount || !createdInKeycloak,
      },
    };
  }
}

@Injectable()
export class DeleteStoreMemberUseCase implements IUseCase<
  DeleteStoreMemberDto,
  void
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
  ) {}

  async execute(dto: DeleteStoreMemberDto): Promise<void> {
    const store = await this.storeRepository.findById(dto.storeId);
    if (!store) {
      throw new StoreNotFoundError(DeleteStoreMemberUseCase.name, dto.storeId);
    }

    const member = await this.storeDetailRepository.findMemberById(
      dto.storeId,
      dto.memberId,
    );
    if (!member) {
      throw new StoreMemberNotFoundError(
        DeleteStoreMemberUseCase.name,
        dto.memberId,
      );
    }

    await this.storeDetailRepository.deleteMember(dto.storeId, dto.memberId);

    await this.storeDetailRepository.recordAuditEvent({
      storeId: dto.storeId,
      severity: 'aviso',
      actor: dto.actor,
      module: 'Usuários',
      action: `Revogou acesso de ${member.firstName} ${member.lastName}`,
    });
  }
}
