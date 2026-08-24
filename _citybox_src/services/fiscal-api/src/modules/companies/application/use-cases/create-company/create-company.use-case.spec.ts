import { CreateCompanyUseCase } from './create-company.use-case';
import { InMemoryCompanyRepository } from '../../../tests/in-memory-company.repository';
import { CompanyAlreadyExistsForStoreError } from '../../../domain/errors/store-already-has-company.error';
import { CompanyAlreadyExistsForCnpjError } from '../../../domain/errors/cnpj-already-registered.error';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type { CreateCompanyDto } from '../../dtos/company.dto';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

function baseDto(overrides: Partial<CreateCompanyDto> = {}): CreateCompanyDto {
  return {
    storeId: STORE_ID,
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
    ...overrides,
  };
}

describe('CreateCompanyUseCase', () => {
  let repo: InMemoryCompanyRepository;
  let useCase: CreateCompanyUseCase;

  beforeEach(() => {
    repo = new InMemoryCompanyRepository();
    useCase = new CreateCompanyUseCase(repo);
  });

  it('creates a Company defaulting to HOMOLOGATION and active=true', async () => {
    const company = await useCase.execute(baseDto());

    expect(company.storeId).toBe(STORE_ID);
    expect(company.defaultEnvironment).toBe('HOMOLOGATION');
    expect(company.active).toBe(true);
  });

  it('rejects a second Company for the same storeId (1 Loja : 1 Emitente)', async () => {
    await useCase.execute(baseDto());

    await expect(
      useCase.execute(baseDto({ cnpj: '11444777000161' })),
    ).rejects.toBeInstanceOf(CompanyAlreadyExistsForStoreError);
  });

  it('rejects a CNPJ with an invalid check digit', async () => {
    await expect(
      useCase.execute(baseDto({ cnpj: '11111111111111' })),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects an invalid IBGE city code', async () => {
    await expect(
      useCase.execute(baseDto({ cityCodeIbge: '123' })),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  /// O CNPJ é único no banco. Sem checagem no caso de uso, a violação estoura
  /// como `500 Internal server error` — que não diz nada a quem integra e
  /// parece falha da API, não do dado enviado.
  it('refuses a CNPJ already registered, with a readable error instead of a 500', async () => {
    await useCase.execute(baseDto());

    await expect(
      useCase.execute(
        baseDto({ storeId: '22222222-2222-4222-8222-222222222222' }),
      ),
    ).rejects.toBeInstanceOf(CompanyAlreadyExistsForCnpjError);
  });

  /// Um CNPJ diferente em outra loja é cadastro legítimo — a checagem não pode
  /// bloquear o caso normal de múltiplos emitentes na plataforma.
  it('allows a different CNPJ in another store', async () => {
    await useCase.execute(baseDto());

    const outra = await useCase.execute(
      baseDto({
        storeId: '33333333-3333-4333-8333-333333333333',
        cnpj: '11444777000161',
      }),
    );

    expect(outra.cnpj).toBe('11444777000161');
  });
});
