import { VerticalMembersRoute } from './vertical-members.route';
import { InMemoryStoreRepository } from '../../../../tests/in-memory-store.repository';
import {
  FakeVerticalMemberProvisioning,
  buildVerticalMember,
} from '../../../../tests/fake-vertical-member-provisioning';
import { Store } from '../../../../domain/entities/store.entity';
import { StoreNotFoundError } from '../../../../domain/errors/store-not-found.error';
import { VerticalNotSupportedError } from '../../../../domain/errors/vertical-provisioning.error';
import type { VerticalMember } from '../../../../domain/providers/vertical-member-provisioning.provider';

const MISSING_STORE_ID = '00000000-0000-4000-8000-000000000001';

async function seedClinicStore(repo: InMemoryStoreRepository): Promise<Store> {
  return repo.save(
    Store.create({
      vertical: 'Clínica',
      tradeName: 'Clínica Vida',
      slug: 'clinica-vida',
      timezone: 'America/Bahia',
      personType: 'PJ',
      responsibleName: 'Ana Nascimento',
      billingEmail: 'ana@clinica.test',
    }),
  );
}

function buildRoute(members: VerticalMember[]) {
  const storeRepo = new InMemoryStoreRepository();
  const provisioning = new FakeVerticalMemberProvisioning({
    supportedVerticals: ['Clínica'],
    members,
  });
  return {
    storeRepo,
    provisioning,
    route: new VerticalMembersRoute(storeRepo, provisioning),
  };
}

describe('VerticalMembersRoute — GET vertical-team/owner', () => {
  // Decisão de produto: pelo admin gerencia-se **só** o responsável da organização;
  // colaborador é cadastrado dentro do app da vertical. Por isso a rota devolve um
  // membro, e não a equipe — listar quem o admin não gerencia sugeriria que ele gerencia.
  it('returns the responsible member as the vertical knows them', async () => {
    const owner = buildVerticalMember({
      id: 'owner-1',
      username: 'nascimento',
      organizationRole: 'OWNER',
      organizationRoleLabel: 'Responsável',
      isOrganizationOwner: true,
    });
    const collaborator = buildVerticalMember({
      id: 'member-2',
      username: 'marcia.andrade',
    });
    const { route, storeRepo, provisioning } = buildRoute([
      collaborator,
      owner,
    ]);
    const store = await seedClinicStore(storeRepo);

    const result = await route.owner(store.id);

    expect(provisioning.findOwnerCalls).toEqual([
      { storeId: store.id, vertical: 'Clínica' },
    ]);
    expect(result.owner).toMatchObject({
      id: 'owner-1',
      username: 'nascimento',
      firstName: 'Ana',
      lastName: 'Nascimento',
      email: 'ana@clinica.test',
      status: 'active',
      organizationRole: 'OWNER',
      isOrganizationOwner: true,
    });
  });

  // `hasPassword` decide o rótulo do botão na tela ("Gerar senha" x "Resetar senha"). Se
  // não atravessasse a rota, o operador não saberia se o responsável já consegue entrar.
  it('carries hasPassword so the screen can tell a fresh owner from an active one', async () => {
    const { route, storeRepo } = buildRoute([
      buildVerticalMember({
        organizationRole: 'OWNER',
        isOrganizationOwner: true,
        hasPassword: false,
      }),
    ]);
    const store = await seedClinicStore(storeRepo);

    const result = await route.owner(store.id);

    expect(result.owner?.hasPassword).toBe(false);
  });

  // `null` explícito, e não exceção: loja cujo `store.created` chegou sem
  // `responsibleName` realmente não tem responsável — e isso é diferente de falha ao
  // consultar a vertical, que a tela precisa relatar com outra mensagem.
  it('returns null when the vertical has no responsible member yet', async () => {
    const { route, storeRepo } = buildRoute([
      buildVerticalMember({ id: 'member-2', username: 'marcia.andrade' }),
    ]);
    const store = await seedClinicStore(storeRepo);

    await expect(route.owner(store.id)).resolves.toEqual({ owner: null });
  });

  it('rejects a store whose vertical exposes no member API', async () => {
    const storeRepo = new InMemoryStoreRepository();
    // Nenhuma vertical suportada: é o estado das lojas de Comércio hoje.
    const route = new VerticalMembersRoute(
      storeRepo,
      new FakeVerticalMemberProvisioning({ supportedVerticals: [] }),
    );
    const store = await seedClinicStore(storeRepo);

    await expect(route.owner(store.id)).rejects.toBeInstanceOf(
      VerticalNotSupportedError,
    );
  });

  it('rejects an unknown store before talking to the vertical', async () => {
    const { route, provisioning } = buildRoute([]);

    await expect(route.owner(MISSING_STORE_ID)).rejects.toBeInstanceOf(
      StoreNotFoundError,
    );
    expect(provisioning.findOwnerCalls).toHaveLength(0);
  });
});
