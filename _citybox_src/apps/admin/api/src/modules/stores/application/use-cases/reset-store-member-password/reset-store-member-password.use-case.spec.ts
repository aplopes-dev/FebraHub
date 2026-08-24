import { BadRequestException } from '@nestjs/common';
import { UpsertStoreMemberUseCase } from '../manage-store-members/manage-store-members.use-case';
import { ResetStoreMemberPasswordUseCase } from '../reset-store-member-password/reset-store-member-password.use-case';
import { SendStoreMemberPasswordLinkUseCase } from '../send-store-member-password-link/send-store-member-password-link.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { InMemoryStoreDetailRepository } from '../../../tests/in-memory-store-detail.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryPlanRepository } from '../../../../plans/tests/in-memory-plan.repository';
import { seedStoreWithSubscription } from '../../../tests/seed-store-with-subscription';
import { FakeKeycloakAdminService } from '../../../tests/fake-keycloak-admin.service';

const TEST_ACTOR = 'test.admin · test@citybox.local';

describe('Store member password actions', () => {
  let storeRepo: InMemoryStoreRepository;
  let detailRepo: InMemoryStoreDetailRepository;
  let subscriptionRepo: InMemorySubscriptionRepository;
  let planRepo: InMemoryPlanRepository;
  let keycloak: FakeKeycloakAdminService;
  let upsert: UpsertStoreMemberUseCase;
  let resetPassword: ResetStoreMemberPasswordUseCase;
  let sendLink: SendStoreMemberPasswordLinkUseCase;
  let storeId: string;

  beforeEach(async () => {
    storeRepo = new InMemoryStoreRepository();
    subscriptionRepo = new InMemorySubscriptionRepository();
    planRepo = new InMemoryPlanRepository();
    detailRepo = new InMemoryStoreDetailRepository();
    keycloak = new FakeKeycloakAdminService();
    upsert = new UpsertStoreMemberUseCase(
      storeRepo,
      detailRepo,
      keycloak as never,
      subscriptionRepo,
      planRepo,
    );
    resetPassword = new ResetStoreMemberPasswordUseCase(
      storeRepo,
      detailRepo,
      keycloak as never,
    );
    sendLink = new SendStoreMemberPasswordLinkUseCase(
      storeRepo,
      detailRepo,
      keycloak as never,
    );

    const store = await seedStoreWithSubscription(
      { storeRepo, subscriptionRepo, planRepo },
      { slug: 'loja-teste-pwd', tradeName: 'Loja Teste' },
    );
    storeId = store.id;
  });

  it('should generate a new provisional password', async () => {
    const { member } = await upsert.execute({
      storeId,
      firstName: 'Ana',
      lastName: 'Silva',
      username: 'ana.silva',
      role: 'caixa',
      permissions: [],
      generateProvisionalPassword: false,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    });

    expect(member.hasPassword).toBe(false);

    const firstPassword = keycloak.getTemporaryPassword(member.keycloakSub);
    expect(firstPassword).toBeUndefined();

    const result = await resetPassword.execute({
      storeId,
      memberId: member.id,
      actor: TEST_ACTOR,
    });

    expect(result.username).toBe('ana.silva');
    expect(result.temporaryPassword).toBeTruthy();
    expect(keycloak.getTemporaryPassword(member.keycloakSub)).toBe(
      result.temporaryPassword,
    );
    expect(keycloak.wasProvisionalAccessPrepared(member.keycloakSub)).toBe(
      true,
    );

    const updated = await detailRepo.findMemberById(storeId, member.id);
    expect(updated?.hasPassword).toBe(true);
  });

  it('should send password link when member has email', async () => {
    const { member } = await upsert.execute({
      storeId,
      firstName: 'Bruno',
      lastName: 'Lopes',
      username: 'bruno.lopes',
      email: 'bruno@loja.com',
      role: 'caixa',
      permissions: [],
      generateProvisionalPassword: true,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    });

    await sendLink.execute({ storeId, memberId: member.id, actor: TEST_ACTOR });

    expect(keycloak.wasPasswordLinkSent(member.keycloakSub)).toBe(true);
  });

  it('should reject password link when member has no email', async () => {
    const { member } = await upsert.execute({
      storeId,
      firstName: 'Carla',
      lastName: 'Mendes',
      username: 'carla.m',
      role: 'caixa',
      permissions: [],
      generateProvisionalPassword: true,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    });

    await expect(
      sendLink.execute({ storeId, memberId: member.id, actor: TEST_ACTOR }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
