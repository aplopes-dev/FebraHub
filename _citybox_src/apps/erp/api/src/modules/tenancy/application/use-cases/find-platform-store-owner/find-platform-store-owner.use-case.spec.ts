import { NotFoundException } from '@nestjs/common';
import { FindPlatformStoreOwnerUseCase } from './find-platform-store-owner.use-case';
import { PlatformStoreOwnerPresenter } from '../../../infrastructure/http/routes/shared/platform-store-owner.presenter';
import {
  makeOrganization,
  makeRepositories,
} from '../../../tests/tenancy-test-factory';

const PLATFORM_STORE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('FindPlatformStoreOwnerUseCase', () => {
  it('devolve o OWNER da organização ligada ao platformStoreId', async () => {
    const repos = makeRepositories();
    const useCase = new FindPlatformStoreOwnerUseCase(
      repos.organizationRepository,
      repos.membershipRepository,
    );

    const organization = makeOrganization({
      platformStoreId: PLATFORM_STORE_ID,
    });
    await repos.organizationRepository.save(organization);
    const { user } = await repos.seedMember({
      user: { email: 'dono@loja.test', name: 'Maria Silva' },
      membership: {
        organizationId: organization.id,
        role: 'OWNER',
      },
    });

    const detail = await useCase.execute({
      platformStoreId: PLATFORM_STORE_ID,
    });
    const http = PlatformStoreOwnerPresenter.toVerticalMember(detail);

    expect(detail.user.id).toBe(user.id);
    expect(http.organizationRole).toBe('OWNER');
    expect(http.isOrganizationOwner).toBe(true);
    expect(http.email).toBe('dono@loja.test');
    expect(http.firstName).toBe('Maria');
    expect(http.lastName).toBe('Silva');
    expect(http.hasPassword).toBe(false);
  });

  it('404 quando a loja nunca foi provisionada', async () => {
    const repos = makeRepositories();
    const useCase = new FindPlatformStoreOwnerUseCase(
      repos.organizationRepository,
      repos.membershipRepository,
    );

    await expect(
      useCase.execute({ platformStoreId: PLATFORM_STORE_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
