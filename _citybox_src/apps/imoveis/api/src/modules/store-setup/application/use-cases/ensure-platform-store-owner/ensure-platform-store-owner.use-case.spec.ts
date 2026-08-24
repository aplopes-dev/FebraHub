import { StorePayloadIncompleteError } from '../../../domain/errors/store-payload-incomplete.error';
import { permissionsForRole } from '../../../../settings/domain/entities/team-member.entity';
import { InMemoryStoreSettingsRepository } from '../../../../settings/infrastructure/database/in-memory-store-settings.repository';
import { InMemoryTeamMemberRepository } from '../../../../settings/infrastructure/database/in-memory-team-member.repository';
import { FakeIdentityProvider } from '../../../../tenancy/tests/fake-identity.provider';
import { EnsurePlatformStoreOwnerUseCase } from './ensure-platform-store-owner.use-case';

const STORE = '0196f0a0-0000-7000-8000-000000000001';

describe('EnsurePlatformStoreOwnerUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let settings: InMemoryStoreSettingsRepository;
  let identity: FakeIdentityProvider;
  let useCase: EnsurePlatformStoreOwnerUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    settings = new InMemoryStoreSettingsRepository();
    identity = new FakeIdentityProvider();
    useCase = new EnsurePlatformStoreOwnerUseCase(members, settings, identity);
  });

  it('cria TeamMember admin sem senha e StoreSettings', async () => {
    const member = await useCase.execute({
      storeId: STORE,
      tradeName: 'Imob Ilhéus',
      responsibleName: 'Ana Helena',
      billingEmail: 'ana@imob.com',
    });

    expect(member.role).toBe('admin');
    expect(member.hasPassword).toBe(false);
    expect(member.keycloakSub).toBeTruthy();
    expect(member.username).toBe('ana@imob.com');
    expect(member.mustChangePassword).toBe(false);
    expect(member.active).toBe(true);

    const storeSettings = await settings.findByStoreId(STORE);
    expect(storeSettings?.system.companyName).toBe('Imob Ilhéus');
  });

  it('reusa membro existente pelo e-mail e promove a admin', async () => {
    await members.create(STORE, {
      agentId: 'bruno',
      name: 'Bruno Costa',
      email: 'bruno@imob.com',
      phone: '',
      role: 'broker',
      initials: 'BC',
      active: true,
      permissions: permissionsForRole('broker'),
      lastAccessAt: null,
      passwordHash: null,
      temporaryPassword: null,
      mustChangePassword: true,
      keycloakSub: null,
      username: null,
      hasPassword: false,
    });

    const member = await useCase.execute({
      storeId: STORE,
      tradeName: 'Imob',
      responsibleName: 'Bruno Costa',
      billingEmail: 'bruno@imob.com',
    });

    expect(member.agentId).toBe('bruno');
    expect(member.role).toBe('admin');
    expect(member.username).toBe('bruno@imob.com');

    // O membro tem de ficar ligado à identidade daquele e-mail. O `sub` em si é
    // detalhe do provedor — o assert anterior cravava `mock-sub-<email>`, formato
    // do mock que a porta `IdentityProvider` substituiu.
    const provisioned = await identity.findByEmail('bruno@imob.com');
    expect(provisioned).not.toBeNull();
    expect(member.keycloakSub).toBe(provisioned?.sub);
  });

  it('falha alto quando faltam e-mail ou nome', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        tradeName: 'Imob',
        responsibleName: null,
        billingEmail: 'x@y.com',
      }),
    ).rejects.toBeInstanceOf(StorePayloadIncompleteError);

    await expect(
      useCase.execute({
        storeId: STORE,
        tradeName: 'Imob',
        responsibleName: 'Ana',
        billingEmail: '  ',
      }),
    ).rejects.toBeInstanceOf(StorePayloadIncompleteError);
  });
});
