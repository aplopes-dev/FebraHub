import { permissionsForRole } from '../../../../settings/domain/entities/team-member.entity';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryTeamMemberRepository } from '../../../../settings/infrastructure/database/in-memory-team-member.repository';
import { PublicAgentNotFoundError } from '../../../domain/errors/public-agent-not-found.error';
import { ListPublicAgentListingsUseCase } from './list-public-agent-listings.use-case';

const STORE = 'dev-store-imoveis';

describe('ListPublicAgentListingsUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let properties: InMemoryPropertyRepository;
  let useCase: ListPublicAgentListingsUseCase;

  beforeEach(async () => {
    members = new InMemoryTeamMemberRepository();
    properties = new InMemoryPropertyRepository();
    useCase = new ListPublicAgentListingsUseCase(members, properties);

    await members.create(STORE, {
      agentId: 'ana-helena',
      name: 'Ana Helena',
      email: 'ana@imob.com',
      phone: '',
      role: 'broker',
      initials: 'AH',
      active: true,
      permissions: permissionsForRole('broker'),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });
    await members.create(STORE, {
      agentId: 'bruno-costa',
      name: 'Bruno Costa',
      email: 'bruno@imob.com',
      phone: '',
      role: 'broker',
      initials: 'BC',
      active: true,
      permissions: permissionsForRole('broker'),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });

    await properties.create({
      storeId: STORE,
      name: 'Apartamento Centro',
      type: 'apartment',
      status: 'available',
      listingType: 'sale',
      agentId: 'ana-helena',
      cost: 450000,
      bedrooms: 2,
      sizeSqm: 72,
      city: 'Ilhéus',
      state: 'BA',
      address: 'Centro, Ilhéus',
    });
    await properties.create({
      storeId: STORE,
      name: 'Casa Reservada',
      type: 'house',
      status: 'reserved',
      listingType: 'sale',
      agentId: 'ana-helena',
    });
    await properties.create({
      storeId: STORE,
      name: 'Apartamento Vendido',
      type: 'apartment',
      status: 'sold-out',
      listingType: 'sale',
      agentId: 'ana-helena',
    });
    await properties.create({
      storeId: STORE,
      name: 'Imóvel de Outro',
      type: 'house',
      status: 'available',
      listingType: 'rent',
      agentId: 'bruno-costa',
    });
  });

  it('lista só imóveis available do corretor do slug', async () => {
    const result = await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
      page: 1,
      perPage: 8,
    });

    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.name)).toEqual([
      'Apartamento Centro',
    ]);
    expect(result.items.every((item) => item.agentId === 'ana-helena')).toBe(
      true,
    );
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(8);
  });

  it('usa 8 itens por página quando perPage é omitido', async () => {
    const result = await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
    });

    expect(result.page).toBe(1);
    expect(result.perPage).toBe(8);
  });

  it('pagina resultados do catálogo do corretor', async () => {
    for (let i = 0; i < 3; i += 1) {
      await properties.create({
        storeId: STORE,
        name: `Imóvel ${i}`,
        type: 'apartment',
        status: 'available',
        listingType: 'sale',
        agentId: 'ana-helena',
      });
    }

    const page1 = await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
      page: 1,
      perPage: 2,
    });
    const page2 = await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
      page: 2,
      perPage: 2,
    });

    // 1 available do seed de ana + 3 criados = 4 (exclui bruno)
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(4);
    expect(page2.items).toHaveLength(2);
  });

  it('só realoca órfãos ao admin e preserva carteira de corretores da equipe', async () => {
    await members.create(STORE, {
      agentId: 'admin-citybox',
      name: 'Admin',
      email: 'admin@citybox.com',
      phone: '',
      role: 'admin',
      initials: 'AP',
      active: true,
      permissions: permissionsForRole('admin'),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });

    await properties.create({
      storeId: STORE,
      name: 'Legado mock',
      type: 'apartment',
      status: 'available',
      listingType: 'sale',
      agentId: 'mock-antigo',
    });
    await properties.create({
      storeId: STORE,
      name: 'Sem dono',
      type: 'house',
      status: 'available',
      listingType: 'rent',
      agentId: null,
    });

    const ana = await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
      page: 1,
      perPage: 50,
    });
    // seed de ana permanece (não é “roubado” pelo admin)
    expect(ana.items.map((item) => item.name)).toEqual(['Apartamento Centro']);
    expect(ana.items.every((item) => item.agentId === 'ana-helena')).toBe(true);

    const bruno = await useCase.execute({
      storeId: STORE,
      slug: 'bruno-costa',
      page: 1,
      perPage: 50,
    });
    expect(bruno.items.map((item) => item.name)).toEqual(['Imóvel de Outro']);

    const admin = await useCase.execute({
      storeId: STORE,
      slug: 'admin-citybox',
      page: 1,
      perPage: 50,
    });
    // só órfãos (mock-antigo + null) → admin
    expect(admin.total).toBe(2);
    expect(admin.items.every((item) => item.agentId === 'admin-citybox')).toBe(
      true,
    );
    expect(admin.items.map((item) => item.name).sort()).toEqual([
      'Legado mock',
      'Sem dono',
    ]);

    // imóvel criado pelo corretor permanece no corretor
    await properties.create({
      storeId: STORE,
      name: 'Carteira do Bruno',
      type: 'apartment',
      status: 'available',
      listingType: 'sale',
      agentId: 'bruno-costa',
    });
    const brunoAfter = await useCase.execute({
      storeId: STORE,
      slug: 'bruno-costa',
      page: 1,
      perPage: 50,
    });
    expect(brunoAfter.items.map((item) => item.name).sort()).toEqual([
      'Carteira do Bruno',
      'Imóvel de Outro',
    ]);

    const adminAfter = await useCase.execute({
      storeId: STORE,
      slug: 'admin-citybox',
      page: 1,
      perPage: 50,
    });
    expect(adminAfter.total).toBe(2);
  });

  it('rejeita slug inexistente', async () => {
    await expect(
      useCase.execute({ storeId: STORE, slug: 'fantasma' }),
    ).rejects.toBeInstanceOf(PublicAgentNotFoundError);
  });
});
