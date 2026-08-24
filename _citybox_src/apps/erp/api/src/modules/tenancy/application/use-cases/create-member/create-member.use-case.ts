import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { generateProvisionalPassword } from '../../../../../shared/infra/keycloak/provisional-password';
import type { MembershipRoleValue } from '../../../../../shared/infra/tenancy/tenant-context';
import { SYSTEM_PROFILE_ADMINISTRADOR } from '../../../../../shared/infra/http/permissions/fine-to-coarse';
import { Membership } from '../../../domain/entities/membership.entity';
import { User } from '../../../domain/entities/user.entity';
import { IdentityProvider } from '../../../domain/providers/identity-provider.interface';
import { BranchRepository } from '../../../domain/repositories/branch.repository.interface';
import { MembershipRepository } from '../../../domain/repositories/membership.repository.interface';
import { PermissionProfileRepository } from '../../../domain/repositories/permission-profile.repository.interface';
import { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { BranchNotFoundError } from '../../../domain/errors/branch-not-found.error';
import { MemberEmailTakenError } from '../../../domain/errors/member-email-taken.error';
import { MembershipNotFoundError } from '../../../domain/errors/membership-not-found.error';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import type {
  CreateMemberDto,
  CreateMemberResult,
} from '../../dtos/member.dto';

/**
 * Cadastra uma pessoa na organização: identidade no Keycloak, vínculo e papel
 * no ERP, e uma senha de primeiro acesso devolvida uma única vez.
 *
 * A identidade nasce antes do vínculo porque o `sub` do Keycloak é a chave que
 * amarra os dois. Se a gravação local falhar depois disso, a identidade recém
 * criada é desfeita — sem isso, sobraria uma conta órfã que bloquearia a
 * próxima tentativa com o mesmo e-mail.
 *
 * O papel estrutural (OWNER/ADMIN/MEMBER) é derivado do perfil: perfil
 * `administrador` vira ADMIN (nunca OWNER via create); nos demais, usa
 * `input.role` ou MEMBER.
 */
@Injectable()
export class CreateMemberUseCase implements IUseCase<
  CreateMemberDto,
  CreateMemberResult
> {
  private readonly logger = new Logger(CreateMemberUseCase.name);

  constructor(
    private readonly identityProvider: IdentityProvider,
    private readonly userRepository: UserRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly branchRepository: BranchRepository,
    private readonly permissionProfileRepository: PermissionProfileRepository,
  ) {}

  async execute(input: CreateMemberDto): Promise<CreateMemberResult> {
    const email = input.email.trim().toLowerCase();
    const profile = await this.resolveProfile(
      input.organizationId,
      input.permissionProfileId,
    );
    const role = this.deriveRole(profile.systemKey, input.role);
    const branchIds = await this.validateBranches(
      input.organizationId,
      role === 'MEMBER' ? (input.branchIds ?? []) : [],
    );

    await this.assertNotAlreadyMember(input.organizationId, email);

    const identity = await this.identityProvider.createUser({
      email,
      firstName: input.firstName,
      lastName: input.lastName,
    });
    const provisionalPassword = generateProvisionalPassword();
    let createdUserId: string | null = null;

    try {
      await this.identityProvider.setProvisionalPassword(
        identity.sub,
        provisionalPassword,
      );

      const { user, created } = await this.upsertLocalUser({
        sub: identity.sub,
        email,
        name: [input.firstName.trim(), input.lastName.trim()]
          .filter((part) => part.length > 0)
          .join(' '),
      });
      if (created) createdUserId = user.id;

      const membership = await this.membershipRepository.save(
        Membership.create({
          organizationId: input.organizationId,
          userId: user.id,
          role,
          permissionProfileId: profile.id,
          active: true,
          isSeller: input.isSeller ?? true,
        }),
      );

      if (branchIds.length > 0) {
        await this.membershipRepository.replaceBranchAccess(
          input.organizationId,
          membership.id,
          branchIds,
        );
      }

      const detail = await this.membershipRepository.findById(
        input.organizationId,
        membership.id,
      );
      if (!detail) throw new MembershipNotFoundError(membership.id);

      return {
        detail,
        provisionalPassword,
        linkedExistingAccount: !identity.created,
      };
    } catch (error) {
      await this.rollback(identity, createdUserId, email);
      throw error;
    }
  }

  private deriveRole(
    systemKey: string | null,
    inputRole: MembershipRoleValue | undefined,
  ): MembershipRoleValue {
    if (systemKey === SYSTEM_PROFILE_ADMINISTRADOR) return 'ADMIN';
    return inputRole ?? 'MEMBER';
  }

  private async resolveProfile(organizationId: string, profileId: string) {
    const profile = await this.permissionProfileRepository.findById(
      organizationId,
      profileId,
    );
    if (!profile || profile.deletedAt) {
      throw new PermissionProfileNotFoundError(profileId);
    }
    return profile;
  }

  private async rollback(
    identity: { sub: string; created: boolean },
    createdUserId: string | null,
    email: string,
  ): Promise<void> {
    if (createdUserId) {
      try {
        await this.userRepository.delete(createdUserId);
      } catch (rollbackError) {
        this.logger.error(
          `Falha ao desfazer o usuário local ${createdUserId} (${email}) após erro no cadastro do membro`,
          rollbackError instanceof Error ? rollbackError.stack : undefined,
        );
      }
    }

    if (!identity.created) return;
    try {
      await this.identityProvider.deleteUser(identity.sub);
    } catch (rollbackError) {
      this.logger.error(
        `Falha ao desfazer a identidade ${identity.sub} (${email}) no Keycloak após erro no cadastro do membro`,
        rollbackError instanceof Error ? rollbackError.stack : undefined,
      );
    }
  }

  private async assertNotAlreadyMember(
    organizationId: string,
    email: string,
  ): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (!existingUser) return;

    const membership = await this.membershipRepository.findByUser(
      organizationId,
      existingUser.id,
    );
    if (membership) throw new MemberEmailTakenError(email);
  }

  private async upsertLocalUser(input: {
    sub: string;
    email: string;
    name: string;
  }): Promise<{ user: User; created: boolean }> {
    const existing = await this.userRepository.findByKeycloakSub(input.sub);
    if (existing) return { user: existing, created: false };

    const user = await this.userRepository.save(
      User.create({
        keycloakSub: input.sub,
        email: input.email,
        name: input.name || null,
      }),
    );
    return { user, created: true };
  }

  private async validateBranches(
    organizationId: string,
    branchIds: string[],
  ): Promise<string[]> {
    const unique = [...new Set(branchIds.filter(Boolean))];
    for (const branchId of unique) {
      const branch = await this.branchRepository.findById(
        organizationId,
        branchId,
      );
      if (!branch || branch.deletedAt) throw new BranchNotFoundError(branchId);
    }
    return unique;
  }
}
