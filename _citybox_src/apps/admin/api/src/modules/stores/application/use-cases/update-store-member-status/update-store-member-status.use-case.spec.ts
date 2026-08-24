import { Store } from '../../../domain/entities/store.entity';
import { InMemoryStoreDetailRepository } from '../../../tests/in-memory-store-detail.repository';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { UpdateStoreMemberStatusUseCase } from './update-store-member-status.use-case';

class FakeKeycloakAdmin {
  enabled = new Map<string, boolean>();

  async setUserEnabled(userId: string, enabled: boolean): Promise<void> {
    this.enabled.set(userId, enabled);
  }
}

describe('UpdateStoreMemberStatusUseCase', () => {
  it('soft-disables member and Keycloak user', async () => {
    const stores = new InMemoryStoreRepository();
    const details = new InMemoryStoreDetailRepository();
    const keycloak = new FakeKeycloakAdmin();

    const store = Store.create({
      vertical: 'Clínica',
      tradeName: 'Clínica Teste',
      slug: 'clinica-teste',
      timezone: 'America/Sao_Paulo',
      personType: null,
      responsibleName: null,
      billingEmail: null,
      ordersToday: 0,
      ordersThisMonth: 0,
      revenueTodayCents: 0,
      averageTicketCents: 0,
      averageAcceptTimeSeconds: 0,
      lastSeenAt: null,
      lastOrderAt: null,
      lastAccessAt: null,
      maintenanceMode: false,
      visibleInApp: true,
      status: 'PRODUCTION',
      trialEndsAt: null,
      sefazHomologacao: false,
      contingenciaOffline: false,
    });
    await stores.save(store);

    const member = await details.createMember({
      storeId: store.id,
      keycloakSub: 'kc-1',
      username: 'ana.silva',
      firstName: 'Ana',
      lastName: 'Silva',
      role: 'professional',
      permissions: [],
      hasPassword: true,
    });

    const useCase = new UpdateStoreMemberStatusUseCase(
      stores,
      details,
      keycloak as never,
    );

    const updated = await useCase.execute({
      storeId: store.id,
      memberId: member.id,
      status: 'inactive',
      actor: 'tester',
    });

    expect(updated.disabledAt).not.toBeNull();
    expect(keycloak.enabled.get('kc-1')).toBe(false);

    const reactivated = await useCase.execute({
      storeId: store.id,
      memberId: member.id,
      status: 'active',
      actor: 'tester',
    });
    expect(reactivated.disabledAt).toBeNull();
    expect(keycloak.enabled.get('kc-1')).toBe(true);
  });
});
