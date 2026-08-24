import { ResetMemberPasswordUseCase } from './reset-member-password.use-case';
import { MembershipNotFoundError } from '../../../domain/errors/membership-not-found.error';
import {
  makeRepositories,
  MEMBERSHIP_ID,
  ORGANIZATION_ID,
} from '../../../tests/tenancy-test-factory';

describe('ResetMemberPasswordUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    const { user } = await repos.seedMember();
    const useCase = new ResetMemberPasswordUseCase(
      repos.membershipRepository,
      repos.identityProvider,
    );
    return { ...repos, useCase, user };
  }

  it('gera uma nova senha provisória e a aplica no provedor de identidade', async () => {
    const { useCase, identityProvider, user } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
    });

    expect(result.email).toBe(user.email);
    expect(result.provisionalPassword).toHaveLength(12);
    expect(identityProvider.passwords.get(user.keycloakSub)).toBe(
      result.provisionalPassword,
    );
  });

  it('retorna 404 quando o vínculo não existe', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        membershipId: 'membership-inexistente',
      }),
    ).rejects.toBeInstanceOf(MembershipNotFoundError);
  });
});
