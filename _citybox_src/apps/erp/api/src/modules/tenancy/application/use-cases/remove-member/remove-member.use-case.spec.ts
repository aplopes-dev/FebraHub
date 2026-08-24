import { RemoveMemberUseCase } from './remove-member.use-case';
import { LastOwnerForbiddenError } from '../../../domain/errors/last-owner-forbidden.error';
import { MembershipNotFoundError } from '../../../domain/errors/membership-not-found.error';
import {
  makeRepositories,
  MEMBERSHIP_ID,
  ORGANIZATION_ID,
  OWNER_MEMBERSHIP_ID,
} from '../../../tests/tenancy-test-factory';

describe('RemoveMemberUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedOwner();
    await repos.seedMember({ membership: { role: 'MEMBER' } });
    const useCase = new RemoveMemberUseCase(repos.membershipRepository);
    return { ...repos, useCase };
  }

  it('remove o vínculo do membro com a organização', async () => {
    const { useCase, membershipRepository, userRepository } = await setup();

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
    });

    const detail = await membershipRepository.findById(
      ORGANIZATION_ID,
      MEMBERSHIP_ID,
    );
    expect(detail).toBeNull();
    // A pessoa continua existindo: pode ser membro de outra organização.
    expect(userRepository.users.size).toBe(2);
  });

  it('rejeita remover o último responsável ativo', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        membershipId: OWNER_MEMBERSHIP_ID,
      }),
    ).rejects.toBeInstanceOf(LastOwnerForbiddenError);
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
