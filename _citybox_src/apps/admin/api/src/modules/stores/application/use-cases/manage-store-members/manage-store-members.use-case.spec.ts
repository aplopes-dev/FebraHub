import { BadRequestException } from '@nestjs/common';
import {
  DeleteStoreMemberUseCase,
  UpsertStoreMemberUseCase,
} from './manage-store-members.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { InMemoryStoreDetailRepository } from '../../../tests/in-memory-store-detail.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryPlanRepository } from '../../../../plans/tests/in-memory-plan.repository';
import { seedStoreWithSubscription } from '../../../tests/seed-store-with-subscription';
import { FakeKeycloakAdminService } from '../../../tests/fake-keycloak-admin.service';
import { StoreMemberQuotaExceededError } from '../../../domain/errors/store-member-quota-exceeded.error';
import { ActiveSubscriptionRequiredError } from '../../../domain/errors/active-subscription-required.error';

const TEST_ACTOR = 'test.admin · test@citybox.local';

describe('UpsertStoreMemberUseCase', () => {
  let storeRepo: InMemoryStoreRepository;
  let detailRepo: InMemoryStoreDetailRepository;
  let keycloak: FakeKeycloakAdminService;
  let useCase: UpsertStoreMemberUseCase;
  let subscriptionRepo: InMemorySubscriptionRepository;
  let planRepo: InMemoryPlanRepository;
  let storeId: string;

  beforeEach(async () => {
    storeRepo = new InMemoryStoreRepository();
    subscriptionRepo = new InMemorySubscriptionRepository();
    planRepo = new InMemoryPlanRepository();
    detailRepo = new InMemoryStoreDetailRepository();
    keycloak = new FakeKeycloakAdminService();
    useCase = new UpsertStoreMemberUseCase(
      storeRepo,
      detailRepo,
      keycloak as never,
      subscriptionRepo,
      planRepo,
    );

    const store = await seedStoreWithSubscription(
      { storeRepo, subscriptionRepo, planRepo },
      { slug: 'maria-doces' },
    );
    storeId = store.id;
  });

  it('should create member with provisional password', async () => {
    const result = await useCase.execute({
      storeId,
      firstName: 'Ana',
      lastName: 'Silva',
      username: 'ana.silva',
      email: 'ana@loja.com',
      role: 'caixa',
      permissions: ['Abrir Caixa'],
      generateProvisionalPassword: true,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    });

    expect(result.member.firstName).toBe('Ana');
    expect(result.meta?.temporaryPassword).toBeTruthy();
    expect(result.member.hasPassword).toBe(true);
    // As asserções sobre `provisionStoreOperator` saíram com o ADR C-16: ele
    // atribuía `store_staff` + `vertical.<slug>.view`, roles que não existem
    // mais. Ver `TODO(F2)` no use case.
    expect(keycloak.getTemporaryPassword(result.member.keycloakSub)).toBe(
      result.meta?.temporaryPassword,
    );
    expect(
      keycloak.wasProvisionalAccessPrepared(result.member.keycloakSub),
    ).toBe(true);
  });

  it('should create member with invite email', async () => {
    const result = await useCase.execute({
      storeId,
      firstName: 'Bruno',
      lastName: 'Lopes',
      username: 'bruno.lopes',
      email: 'bruno@loja.com',
      role: 'gerente',
      permissions: [],
      generateProvisionalPassword: false,
      sendInviteEmail: true,
      actor: TEST_ACTOR,
    });

    expect(result.meta?.inviteEmailSent).toBe(true);
    expect(keycloak.wasInvited(result.member.keycloakSub)).toBe(true);
  });

  it('should reject both onboarding switches', async () => {
    await expect(
      useCase.execute({
        storeId,
        firstName: 'Ana',
        lastName: 'Silva',
        username: 'ana.silva2',
        role: 'caixa',
        permissions: [],
        generateProvisionalPassword: true,
        sendInviteEmail: true,
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should create member without password when both switches are off', async () => {
    const result = await useCase.execute({
      storeId,
      firstName: 'João',
      lastName: 'Pereira',
      username: 'joao.p',
      role: 'caixa',
      permissions: [],
      generateProvisionalPassword: false,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    });

    expect(result.member.hasPassword).toBe(false);
    expect(result.meta?.temporaryPassword).toBeUndefined();
  });

  // `estoquista` servia como cargo inválido enquanto a loja era `'Food'`; com a fusão
  // de Food e Varejo em `'Comércio'` ele passou a ser válido. Usa-se um cargo que não
  // existe em catálogo nenhum para o teste seguir provando o que se propõe.
  it('should reject invalid role for vertical', async () => {
    await expect(
      useCase.execute({
        storeId,
        firstName: 'Ana',
        lastName: 'Silva',
        username: 'ana.silva3',
        role: 'radiologista',
        permissions: [],
        generateProvisionalPassword: true,
        sendInviteEmail: false,
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject duplicate member in same store', async () => {
    const payload = {
      storeId,
      firstName: 'Ana',
      lastName: 'Silva',
      username: 'ana.dup',
      role: 'caixa' as const,
      permissions: [] as string[],
      generateProvisionalPassword: true,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    };
    await useCase.execute(payload);
    await expect(useCase.execute(payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should reject registering a member whose e-mail already belongs to another store', async () => {
    await useCase.execute({
      storeId,
      firstName: 'Ana',
      lastName: 'Silva',
      username: 'ana.diferente',
      email: 'ana.diferente@loja.com',
      role: 'caixa',
      permissions: [],
      generateProvisionalPassword: true,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    });

    const storeB = await seedStoreWithSubscription(
      { storeRepo, subscriptionRepo, planRepo },
      { slug: 'segunda-loja', tradeName: 'Segunda Loja' },
    );

    await expect(
      useCase.execute({
        storeId: storeB.id,
        firstName: 'Ana Clara',
        lastName: 'Silva',
        username: 'anaclara',
        email: 'ana.diferente@loja.com',
        role: 'caixa',
        permissions: [],
        generateProvisionalPassword: true,
        sendInviteEmail: false,
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should refuse to reuse the same e-mail/username in a second store — cada loja é um cliente independente', async () => {
    // Até a Fase 10, duas lojas do MESMO Cliente reaproveitavam o membro (mesmo
    // keycloakSub, `linkedExistingAccount: true`). Sem Cliente, reaproveitar cruzaria a
    // fronteira de tenant: a equipe de uma loja ficaria gerenciável a partir da outra.
    const storeA1 = await seedStoreWithSubscription(
      { storeRepo, subscriptionRepo, planRepo },
      { slug: 'maria-doces-teste' },
    );

    await useCase.execute({
      storeId: storeA1.id,
      firstName: 'João',
      lastName: 'Silva',
      username: 'joao.mesmo',
      email: 'joao.mesmo@loja.com',
      role: 'caixa',
      permissions: [],
      generateProvisionalPassword: true,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    });

    const storeA2 = await seedStoreWithSubscription(
      { storeRepo, subscriptionRepo, planRepo },
      { slug: 'maria-doces-filial', tradeName: 'Maria Doces Filial' },
    );

    await expect(
      useCase.execute({
        storeId: storeA2.id,
        firstName: 'João',
        lastName: 'Silva',
        username: 'joao.mesmo',
        email: 'joao.mesmo@loja.com',
        role: 'gerente',
        permissions: [],
        generateProvisionalPassword: true,
        sendInviteEmail: false,
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw ActiveSubscriptionRequiredError when the store has no active subscription', async () => {
    const sub = await subscriptionRepo.findActiveByStoreId(storeId);
    if (sub) {
      sub.cancel();
      await subscriptionRepo.save(sub);
    }

    await expect(
      useCase.execute({
        storeId,
        firstName: 'Ana',
        lastName: 'Silva',
        username: 'ana.no.sub',
        role: 'caixa',
        permissions: [],
        generateProvisionalPassword: true,
        sendInviteEmail: false,
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(ActiveSubscriptionRequiredError);
  });

  it('should throw StoreMemberQuotaExceededError when store member quota is exceeded', async () => {
    await useCase.execute({
      storeId,
      firstName: 'Ana',
      lastName: 'Silva',
      username: 'ana.silva.quota1',
      role: 'caixa',
      permissions: [],
      generateProvisionalPassword: true,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    });

    await useCase.execute({
      storeId,
      firstName: 'Bruno',
      lastName: 'Lopes',
      username: 'bruno.lopes.quota2',
      role: 'gerente',
      permissions: [],
      generateProvisionalPassword: true,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    });

    await expect(
      useCase.execute({
        storeId,
        firstName: 'Carlos',
        lastName: 'Mendes',
        username: 'carlos.mendes.quota3',
        role: 'caixa',
        permissions: [],
        generateProvisionalPassword: true,
        sendInviteEmail: false,
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(StoreMemberQuotaExceededError);
  });
});

describe('DeleteStoreMemberUseCase', () => {
  it('should delete member', async () => {
    const storeRepo = new InMemoryStoreRepository();
    const subscriptionRepo = new InMemorySubscriptionRepository();
    const planRepo = new InMemoryPlanRepository();
    const detailRepo = new InMemoryStoreDetailRepository();
    const keycloak = new FakeKeycloakAdminService();
    const upsert = new UpsertStoreMemberUseCase(
      storeRepo,
      detailRepo,
      keycloak as never,
      subscriptionRepo,
      planRepo,
    );
    const remove = new DeleteStoreMemberUseCase(storeRepo, detailRepo);

    const store = await seedStoreWithSubscription(
      { storeRepo, subscriptionRepo, planRepo },
      { slug: 'loja-teste', tradeName: 'Loja Teste' },
    );

    const { member } = await upsert.execute({
      storeId: store.id,
      firstName: 'João',
      lastName: 'Souza',
      username: 'joao.souza',
      role: 'caixa',
      permissions: [],
      generateProvisionalPassword: true,
      sendInviteEmail: false,
      actor: TEST_ACTOR,
    });

    await remove.execute({
      storeId: store.id,
      memberId: member.id,
      actor: TEST_ACTOR,
    });
    const found = await detailRepo.findMemberById(store.id, member.id);
    expect(found).toBeNull();
  });
});
