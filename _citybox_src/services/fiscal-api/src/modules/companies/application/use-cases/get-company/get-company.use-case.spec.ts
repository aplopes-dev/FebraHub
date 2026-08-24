import { GetCompanyUseCase } from './get-company.use-case';
import { CreateCompanyUseCase } from '../create-company/create-company.use-case';
import { InMemoryCompanyRepository } from '../../../tests/in-memory-company.repository';
import { CompanyNotFoundError } from '../../../domain/errors/company-not-found.error';
import type { CreateCompanyDto } from '../../dtos/company.dto';

function baseDto(): CreateCompanyDto {
  return {
    storeId: '11111111-1111-4111-8111-111111111111',
    cnpj: '11222333000181',
    legalName: 'Comércio de Alimentos Ilhéus LTDA',
    taxRegime: 'SIMPLES_NACIONAL',
    cityCodeIbge: '2913606',
    uf: 'BA',
    address: {
      street: 'Rua Marquês de Paranaguá',
      number: '100',
      complement: null,
      district: 'Centro',
      city: 'Ilhéus',
      zipCode: '45650-000',
    },
  };
}

describe('GetCompanyUseCase', () => {
  it('returns the Company when it exists', async () => {
    const repo = new InMemoryCompanyRepository();
    const created = await new CreateCompanyUseCase(repo).execute(baseDto());
    const useCase = new GetCompanyUseCase(repo);

    const found = await useCase.execute({ companyId: created.id });

    expect(found.id).toBe(created.id);
  });

  it('throws CompanyNotFoundError when the Company does not exist', async () => {
    const repo = new InMemoryCompanyRepository();
    const useCase = new GetCompanyUseCase(repo);

    await expect(
      useCase.execute({ companyId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(CompanyNotFoundError);
  });
});
