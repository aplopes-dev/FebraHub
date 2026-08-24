import { permissionsForRole } from '../../../../settings/domain/entities/team-member.entity';
import { PropertyNotFoundError } from '../../../../properties/domain/errors/property-not-found.error';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryTeamMemberRepository } from '../../../../settings/infrastructure/database/in-memory-team-member.repository';
import { GetPublicListingUseCase } from './get-public-listing.use-case';

const STORE = 'dev-store-imoveis';

describe('GetPublicListingUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let properties: InMemoryPropertyRepository;
  let useCase: GetPublicListingUseCase;
  let listingId: string;

  beforeEach(async () => {
    members = new InMemoryTeamMemberRepository();
    properties = new InMemoryPropertyRepository();
    useCase = new GetPublicListingUseCase(members, properties);

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

    const mine = await properties.create({
      storeId: STORE,
      name: 'Meu imóvel',
      type: 'apartment',
      status: 'available',
      listingType: 'sale',
      agentId: 'ana-helena',
    });
    listingId = mine.id;

    await properties.create({
      storeId: STORE,
      name: 'Imóvel do Bruno',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      agentId: 'bruno-costa',
    });
  });

  it('retorna imóvel available no catálogo do corretor', async () => {
    const property = await useCase.execute({
      storeId: STORE,
      listingId,
      agentSlug: 'ana-helena',
    });

    expect(property.name).toBe('Meu imóvel');
  });

  it('retorna imóvel available da loja sem agentSlug (link curto)', async () => {
    const property = await useCase.execute({
      storeId: STORE,
      listingId,
    });

    expect(property.name).toBe('Meu imóvel');
    expect(property.agentId).toBe('ana-helena');
  });

  it('rejeita available de outro corretor da mesma loja', async () => {
    const other = await properties.findMany(STORE, {
      page: 1,
      perPage: 10,
      agentId: 'bruno-costa',
      status: ['available'],
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        listingId: other.items[0].id,
        agentSlug: 'ana-helena',
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });

  it('rejeita imóvel reservado', async () => {
    const reserved = await properties.create({
      storeId: STORE,
      name: 'Reservado',
      type: 'house',
      status: 'reserved',
      listingType: 'sale',
      agentId: 'ana-helena',
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        listingId: reserved.id,
        agentSlug: 'ana-helena',
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });

  it('rejeita imóvel esgotado (sold-out)', async () => {
    const sold = await properties.create({
      storeId: STORE,
      name: 'Vendido',
      type: 'land',
      status: 'sold-out',
      listingType: 'sale',
      agentId: 'ana-helena',
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        listingId: sold.id,
        agentSlug: 'ana-helena',
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });

  it('rejeita imóvel ocupado', async () => {
    const occupied = await properties.create({
      storeId: STORE,
      name: 'Alugado',
      type: 'land',
      status: 'occupied',
      listingType: 'rent',
      agentId: 'ana-helena',
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        listingId: occupied.id,
        agentSlug: 'ana-helena',
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });
});
