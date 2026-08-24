import { Injectable } from '@nestjs/common';
import { IdentityProvider } from '../../../domain/providers/identity-provider.interface';
import { isStoreRole } from '../../../domain/store-role.catalog';
import { resolveStorePermissions } from '../../../domain/resolve-store-permissions';
import {
  InvalidStoreRoleError,
  MemberUsernameTakenError,
  OrganizationNotFoundError,
  OrganizationSuspendedError,
  StoreNotFoundError,
} from '../../../domain/errors/member.errors';
import {
  MemberRepository,
  type MemberRecord,
} from '../../../domain/repositories/member.repository';
import {
  OrganizationRepository,
  StoreRepository,
} from '../../../domain/repositories/tenancy.repositories';
import {
  PROVISIONAL_PASSWORD_TTL_MS,
  generateProvisionalPassword,
} from '../../../../../shared/infra/keycloak/provisional-password';

export type CreateMemberInput = {
  storeId: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
  permissions?: string[];
};

export type CreateMemberResult = {
  member: MemberRecord;
  provisionalPassword: string;
};

@Injectable()
export class CreateMemberUseCase {
  constructor(
    private readonly members: MemberRepository,
    private readonly organizations: OrganizationRepository,
    private readonly stores: StoreRepository,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(input: CreateMemberInput): Promise<CreateMemberResult> {
    const store = await this.stores.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError(CreateMemberUseCase.name, input.storeId);
    }

    const organization = await this.organizations.findByStoreId(input.storeId);
    if (!organization) {
      throw new OrganizationNotFoundError(
        CreateMemberUseCase.name,
        input.storeId,
      );
    }
    if (organization.status === 'suspended') {
      throw new OrganizationSuspendedError(
        CreateMemberUseCase.name,
        input.storeId,
      );
    }

    const role = (input.role?.trim() || 'profissional').toLowerCase();
    if (!isStoreRole(role)) {
      throw new InvalidStoreRoleError(CreateMemberUseCase.name, role);
    }

    const username = input.username.trim().toLowerCase();
    if (await this.members.findByUsername(username)) {
      throw new MemberUsernameTakenError(CreateMemberUseCase.name, username);
    }

    const identity = await this.identityProvider.createUser({
      username,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email ?? null,
    });

    const provisionalPassword = generateProvisionalPassword();
    try {
      await this.identityProvider.setProvisionalPassword(
        identity.sub,
        provisionalPassword,
      );
    } catch (err) {
      // Compensação: identidade criada agora e sem senha é lixo — remove.
      // Identidade reaproveitada (`created: false`) fica, é de outra pessoa.
      if (identity.created)
        await this.identityProvider.deleteUser(identity.sub);
      throw err;
    }

    const permissions = resolveStorePermissions(role, input.permissions);

    const phone =
      typeof input.phone === 'string' ? input.phone.trim() || null : null;

    const member = await this.members.create({
      organizationId: organization.id,
      keycloakSub: identity.sub,
      username,
      email: input.email ?? null,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone,
      hasPassword: false,
      // OWNER da organização só via store-setup / promote — nunca pelo convite.
      organizationRole: 'COLLABORATOR',
      stores: [
        {
          storeId: input.storeId,
          role,
          permissions,
        },
      ],
    });

    await this.members.markProvisionalPassword(
      member.id,
      new Date(Date.now() + PROVISIONAL_PASSWORD_TTL_MS),
    );

    const refreshed = await this.members.findById(member.id);
    return {
      member: refreshed ?? member,
      provisionalPassword,
    };
  }
}
