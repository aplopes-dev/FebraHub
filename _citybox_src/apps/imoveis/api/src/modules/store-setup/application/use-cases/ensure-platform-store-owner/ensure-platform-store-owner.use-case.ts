import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { IdentityProvider } from '../../../../tenancy/domain/providers/identity-provider.interface';
import {
  initialsFromName,
  type TeamMemberEntity,
} from '../../../../settings/domain/entities/team-member.entity';
import { StoreSettingsEntity } from '../../../../settings/domain/entities/store-settings.entity';
import { resolveImoveisPermissions } from '../../../../settings/domain/resolve-imoveis-permissions';
import { StoreSettingsRepository } from '../../../../settings/domain/repositories/store-settings.repository.interface';
import { TeamMemberRepository } from '../../../../settings/domain/repositories/team-member.repository.interface';
import {
  agentSlugFromName,
  uniqueAgentSlug,
} from '../../../../settings/application/policies/agent-slug';
import {
  splitName,
  usernameFromEmail,
} from '../../../../settings/application/policies/provisional-password';
import { StorePayloadIncompleteError } from '../../../domain/errors/store-payload-incomplete.error';

export type EnsurePlatformStoreOwnerInput = {
  storeId: string;
  tradeName: string;
  responsibleName: string | null | undefined;
  billingEmail: string | null | undefined;
};

/**
 * Garante o responsável (`TeamMember` admin) a partir do evento da plataforma.
 *
 * **Sem senha provisória** no evento — o admin gera depois via
 * `POST …/platform/stores/:id/owner/reset-password` (mesmo motivo do ERP).
 */
@Injectable()
export class EnsurePlatformStoreOwnerUseCase implements IUseCase<
  EnsurePlatformStoreOwnerInput,
  TeamMemberEntity
> {
  private readonly logger = new Logger(EnsurePlatformStoreOwnerUseCase.name);

  constructor(
    private readonly members: TeamMemberRepository,
    private readonly settings: StoreSettingsRepository,
    private readonly identity: IdentityProvider,
  ) {}

  async execute(
    input: EnsurePlatformStoreOwnerInput,
  ): Promise<TeamMemberEntity> {
    const email = input.billingEmail?.trim().toLowerCase() ?? '';
    const name = input.responsibleName?.trim() ?? '';
    const missing: string[] = [];
    if (!email) missing.push('owner.billingEmail');
    if (!name) missing.push('owner.responsibleName');
    if (missing.length > 0) {
      throw new StorePayloadIncompleteError(input.storeId, missing);
    }

    await this.ensureStoreSettings(input.storeId, input.tradeName);

    const { firstName, lastName } = splitName(name);
    const username = usernameFromEmail(email);

    const provisioned = await this.identity.createUser({
      email,
      firstName,
      lastName,
    });

    const existing = await this.members.findByEmail(input.storeId, email);
    if (existing) {
      return this.reuseExisting(existing, {
        name,
        username,
        keycloakSub: provisioned.sub,
      });
    }

    const existingMembers = await this.members.findAll(input.storeId);
    const taken = new Set(existingMembers.map((m) => m.agentId));
    const agentId = uniqueAgentSlug(agentSlugFromName(name), (candidate) =>
      taken.has(candidate),
    );

    const permissions = resolveImoveisPermissions('admin');

    const member = await this.members.create(input.storeId, {
      agentId,
      name,
      email,
      phone: '',
      role: 'admin',
      initials: initialsFromName(name),
      active: true,
      permissions,
      lastAccessAt: null,
      passwordHash: null,
      temporaryPassword: null,
      // Troca no 1º acesso fica no Keycloak via admin (CreateStore / Gerar senha).
      // Não abrir o modal "nova senha" do Imóveis para o OWNER.
      mustChangePassword: false,
      keycloakSub: provisioned.sub,
      username,
      hasPassword: false,
    });

    this.logger.log(
      `OWNER provisionado storeId=${input.storeId} agentId=${member.agentId} reused=${!provisioned.created}`,
    );
    return member;
  }

  private async reuseExisting(
    existing: TeamMemberEntity,
    patch: { name: string; username: string; keycloakSub: string },
  ): Promise<TeamMemberEntity> {
    let member = existing;

    if (
      !member.keycloakSub ||
      member.keycloakSub !== patch.keycloakSub ||
      !member.username
    ) {
      const linked = await this.members.linkKeycloakSub(member.id, {
        keycloakSub: patch.keycloakSub,
        username: patch.username,
        hasPassword: member.hasPassword,
      });
      if (linked) member = linked;
    }

    if (
      member.role !== 'admin' ||
      !member.active ||
      member.name !== patch.name
    ) {
      const updated = await this.members.update(
        member.storeId,
        member.agentId,
        {
          name: patch.name,
          email: member.email,
          phone: member.phone,
          role: 'admin',
          initials: initialsFromName(patch.name),
          active: true,
          permissions: resolveImoveisPermissions('admin'),
        },
      );
      if (updated) member = updated;
    }

    this.logger.log(
      `OWNER reutilizado storeId=${member.storeId} agentId=${member.agentId}`,
    );
    return member;
  }

  private async ensureStoreSettings(
    storeId: string,
    tradeName: string,
  ): Promise<void> {
    const existing = await this.settings.findByStoreId(storeId);
    const companyName = tradeName.trim();
    if (existing) {
      if (!existing.system.companyName && companyName) {
        await this.settings.upsert(storeId, {
          system: { ...existing.system, companyName },
          notifications: existing.notifications,
          integrations: existing.integrations,
        });
      }
      return;
    }

    const defaults = StoreSettingsEntity.default(storeId);
    await this.settings.upsert(storeId, {
      system: { ...defaults.system, companyName },
      notifications: defaults.notifications,
      integrations: defaults.integrations,
    });
  }
}
