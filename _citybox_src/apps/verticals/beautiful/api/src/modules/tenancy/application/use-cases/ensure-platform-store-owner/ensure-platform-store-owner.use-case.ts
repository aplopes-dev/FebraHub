import { Injectable, Logger } from '@nestjs/common';
import { STORE_PERMISSION_IDS } from '@citybox/beautiful-permissions';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  MemberRepository,
  type MemberRecord,
} from '../../../domain/repositories/member.repository';
import { OrganizationRepository } from '../../../domain/repositories/tenancy.repositories';
import { IdentityProvider } from '../../../domain/providers/identity-provider.interface';
import { StorePayloadIncompleteError } from '../../../domain/errors/store-payload-incomplete.error';
import { splitName, usernameFromEmail } from '../../policies/owner-identity';

/** Cargo operacional padrão do OWNER: `profissional` com o catálogo completo de permissões. */
const DEFAULT_OWNER_STORE_ROLE = 'profissional';

export type EnsurePlatformStoreOwnerInput = {
  storeId: string;
  tradeName: string;
  responsibleName: string | null | undefined;
  billingEmail: string | null | undefined;
};

/**
 * Garante Organization + Store + Member OWNER a partir do evento da plataforma.
 *
 * **Sem senha provisória** no evento — o admin gera depois via
 * `POST …/platform/stores/:id/owner/reset-password`.
 */
@Injectable()
export class EnsurePlatformStoreOwnerUseCase implements IUseCase<
  EnsurePlatformStoreOwnerInput,
  MemberRecord
> {
  private readonly logger = new Logger(EnsurePlatformStoreOwnerUseCase.name);

  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly members: MemberRepository,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(input: EnsurePlatformStoreOwnerInput): Promise<MemberRecord> {
    const email = input.billingEmail?.trim().toLowerCase() ?? '';
    const name = input.responsibleName?.trim() ?? '';
    const missing: string[] = [];
    if (!email) missing.push('owner.billingEmail');
    if (!name) missing.push('owner.responsibleName');
    if (missing.length > 0) {
      throw new StorePayloadIncompleteError(input.storeId, missing);
    }

    const { organization } = await this.organizations.ensureForPlatformStore({
      storeId: input.storeId,
      name: input.tradeName,
    });

    const { firstName, lastName } = splitName(name);
    const username = usernameFromEmail(email);

    const identity = await this.identityProvider.createUser({
      username,
      firstName,
      lastName,
      email,
    });

    const existingOwner = await this.members.findActiveOwnerByStoreId(
      input.storeId,
    );
    if (existingOwner) {
      return this.reuseExisting(existingOwner, {
        firstName,
        lastName,
        email,
        username,
        keycloakSub: identity.sub,
      });
    }

    const bySub = await this.members.findByKeycloakSub(identity.sub);
    if (bySub && bySub.organizationId === organization.id) {
      const promoted = await this.members.promoteToOwner(bySub.id, {
        firstName,
        lastName,
        email,
      });
      const linked = await this.members.linkKeycloak(bySub.id, {
        keycloakSub: identity.sub,
        username,
        hasPassword: bySub.hasPassword,
      });
      this.logger.log(
        `OWNER promovido storeId=${input.storeId} memberId=${bySub.id}`,
      );
      return linked ?? promoted ?? bySub;
    }

    if (bySub && bySub.organizationId !== organization.id) {
      this.logger.warn(
        `keycloakSub ${identity.sub} já vinculado a outra organização (${bySub.organizationId}); reusando vínculo existente`,
      );
      return bySub;
    }

    const byUsername = await this.members.findByUsername(username);
    if (byUsername && byUsername.organizationId === organization.id) {
      const linked = await this.members.linkKeycloak(byUsername.id, {
        keycloakSub: identity.sub,
        username,
        hasPassword: byUsername.hasPassword,
      });
      const promoted = await this.members.promoteToOwner(byUsername.id, {
        firstName,
        lastName,
        email,
      });
      return promoted ?? linked ?? byUsername;
    }

    const member = await this.members.create({
      organizationId: organization.id,
      keycloakSub: identity.sub,
      username,
      email,
      firstName,
      lastName,
      hasPassword: false,
      organizationRole: 'OWNER',
      stores: [
        {
          storeId: input.storeId,
          role: DEFAULT_OWNER_STORE_ROLE,
          permissions: [...STORE_PERMISSION_IDS],
        },
      ],
    });

    this.logger.log(
      `OWNER provisionado storeId=${input.storeId} memberId=${member.id} created=${identity.created}`,
    );
    return member;
  }

  private async reuseExisting(
    existing: MemberRecord,
    patch: {
      firstName: string;
      lastName: string;
      email: string;
      username: string;
      keycloakSub: string;
    },
  ): Promise<MemberRecord> {
    let member = existing;

    if (
      !member.keycloakSub ||
      member.keycloakSub !== patch.keycloakSub ||
      member.username !== patch.username
    ) {
      const linked = await this.members.linkKeycloak(member.id, {
        keycloakSub: patch.keycloakSub,
        username: patch.username,
        hasPassword: member.hasPassword,
      });
      if (linked) member = linked;
    }

    if (
      member.organizationRole !== 'OWNER' ||
      member.firstName !== patch.firstName ||
      member.lastName !== patch.lastName
    ) {
      const promoted = await this.members.promoteToOwner(member.id, {
        firstName: patch.firstName,
        lastName: patch.lastName,
        email: patch.email,
      });
      if (promoted) member = promoted;
    }

    this.logger.log(
      `OWNER reutilizado storeId=${member.memberships[0]?.storeId ?? '?'} memberId=${member.id}`,
    );
    return member;
  }
}
