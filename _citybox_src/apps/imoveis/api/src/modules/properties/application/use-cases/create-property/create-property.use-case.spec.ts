import { CreatePropertyUseCase } from './create-property.use-case';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';

const STORE = 'store-1';

const validInput = {
  storeId: STORE,
  name: 'Residencial Aurora',
  city: 'Ilhéus',
  state: 'BA',
  type: 'apartment' as const,
  units: 24,
  cost: 450_000,
  status: 'available' as const,
  listingType: 'sale' as const,
  negotiable: true,
  bedrooms: 3,
  floors: 1,
  sizeSqm: 85,
  yearBuilt: 2022,
  address: 'Rua das Palmeiras, 100',
  country: 'Brasil',
  zipCode: '45650-000',
  mapCoordinate: '-14.7886, -39.0348',
  typeCode: 'Tipo A',
};

describe('CreatePropertyUseCase', () => {
  it('cria imóvel sem mídia (fotos e documentos via upload multipart)', async () => {
    const repo = new InMemoryPropertyRepository();
    const useCase = new CreatePropertyUseCase(repo);

    const result = await useCase.execute(validInput);

    expect(result.name).toBe('Residencial Aurora');
    expect(result.status).toBe('available');
    expect(result.photos).toHaveLength(0);
    expect(result.documents).toHaveLength(0);
    expect(result.views).toBe(0);

    const stored = await repo.findById(STORE, result.id);
    expect(stored).not.toBeNull();
  });
});
