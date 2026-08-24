import { ListCompaniesUseCase } from './list-companies.use-case';
import { CreateCompanyUseCase } from '../create-company/create-company.use-case';
import { InMemoryCompanyRepository } from '../../../tests/in-memory-company.repository';
import type { CreateCompanyDto } from '../../dtos/company.dto';

function dto(overrides: Partial<CreateCompanyDto>): CreateCompanyDto {
  return {
    storeId: overrides.storeId ?? '11111111-1111-4111-8111-111111111111',
    cnpj: overrides.cnpj ?? '11222333000181',
    legalName: overrides.legalName ?? 'Empresa LTDA',
    taxRegime: 'SIMPLES_NACIONAL',
    cityCodeIbge: '2913606',
    uf: 'BA',
    address: {
      street: 'Rua A',
      number: '1',
      complement: null,
      district: 'Centro',
      city: 'Ilhéus',
      zipCode: '45650-000',
    },
    ...overrides,
  };
}

describe('ListCompaniesUseCase', () => {
  it('paginates results and reports totalPages', async () => {
    const repo = new InMemoryCompanyRepository();
    const create = new CreateCompanyUseCase(repo);
    await create.execute(
      dto({
        storeId: '11111111-1111-4111-8111-111111111111',
        cnpj: '11222333000181',
      }),
    );
    await create.execute(
      dto({
        storeId: '22222222-2222-4222-8222-222222222222',
        cnpj: '11444777000161',
      }),
    );

    const useCase = new ListCompaniesUseCase(repo);
    const result = await useCase.execute({ page: 1, perPage: 1 });

    expect(result.companies).toHaveLength(1);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it('filters by cnpj', async () => {
    const repo = new InMemoryCompanyRepository();
    const create = new CreateCompanyUseCase(repo);
    await create.execute(
      dto({
        storeId: '11111111-1111-4111-8111-111111111111',
        cnpj: '11222333000181',
      }),
    );
    await create.execute(
      dto({
        storeId: '22222222-2222-4222-8222-222222222222',
        cnpj: '11444777000161',
      }),
    );

    const useCase = new ListCompaniesUseCase(repo);
    const result = await useCase.execute({ cnpj: '11222333000181' });

    expect(result.companies).toHaveLength(1);
    expect(result.companies[0].cnpj).toBe('11222333000181');
  });
});
