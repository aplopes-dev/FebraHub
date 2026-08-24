import { plainToInstance } from 'class-transformer';
import { UpdateCompanyUseCase } from './update-company.use-case';
import { CreateCompanyUseCase } from '../create-company/create-company.use-case';
import { InMemoryCompanyRepository } from '../../../tests/in-memory-company.repository';
import { CompanyNotFoundError } from '../../../domain/errors/company-not-found.error';
import { UpdateCompanyDto as UpdateCompanyHttpDto } from '../../../infrastructure/http/routes/update-company/update-company.dto';
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

describe('UpdateCompanyUseCase', () => {
  it('updates mutable fields and bumps updatedAt', async () => {
    const repo = new InMemoryCompanyRepository();
    const created = await new CreateCompanyUseCase(repo).execute(baseDto());
    const useCase = new UpdateCompanyUseCase(repo);

    const updated = await useCase.execute({
      companyId: created.id,
      legalName: 'Novo Nome Comercial LTDA',
      active: false,
    });

    expect(updated.legalName).toBe('Novo Nome Comercial LTDA');
    expect(updated.active).toBe(false);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
      created.updatedAt.getTime(),
    );
  });

  // spec erp/012 (Configurações Gerais): o contrato de update persiste
  // explicitamente os campos fiscais editáveis pelo lojista.
  it('persiste os campos das Configurações Gerais (regime/IE/IM/ambiente/autXML/NFS-e nacional)', async () => {
    const repo = new InMemoryCompanyRepository();
    const created = await new CreateCompanyUseCase(repo).execute(baseDto());
    const useCase = new UpdateCompanyUseCase(repo);

    const updated = await useCase.execute({
      companyId: created.id,
      taxRegime: 'LUCRO_PRESUMIDO',
      stateRegistration: '123456789',
      municipalRegistration: '987654',
      defaultEnvironment: 'PRODUCTION',
      accountingOfficeDocument: '11222333000181',
      nationalNfseEnabled: true,
    });

    expect(updated.taxRegime).toBe('LUCRO_PRESUMIDO');
    expect(updated.stateRegistration).toBe('123456789');
    expect(updated.municipalRegistration).toBe('987654');
    expect(updated.defaultEnvironment).toBe('PRODUCTION');
    expect(updated.accountingOfficeDocument).toBe('11222333000181');
    expect(updated.nationalNfseEnabled).toBe(true);

    // Recarrega do repositório: valores persistidos, não só no objeto retornado.
    const reloaded = await repo.findById(created.id);
    expect(reloaded?.accountingOfficeDocument).toBe('11222333000181');
    expect(reloaded?.nationalNfseEnabled).toBe(true);
  });

  // BUG-02 (2026-08-13): `UpdateCompanyDto` (HTTP) nasce com
  // `useDefineForClassFields` (tsconfig `target: ES2023`) — toda propriedade
  // declarada existe na instância como `undefined` mesmo ausente do corpo.
  // `plainToInstance` reproduz exatamente o que o `ValidationPipe` faz antes
  // do controller chamar o use case — os testes acima (objeto literal) não
  // pegam esse bug porque um literal só tem as chaves que alguém escreveu.
  it('PATCH parcial via DTO HTTP não apaga os campos não enviados (regressão)', async () => {
    const repo = new InMemoryCompanyRepository();
    const created = await new CreateCompanyUseCase(repo).execute(baseDto());
    const useCase = new UpdateCompanyUseCase(repo);

    // Corpo real de um PATCH que só manda 2 campos.
    const dto = plainToInstance(UpdateCompanyHttpDto, {
      taxRegime: 'LUCRO_PRESUMIDO',
      stateRegistration: '123456789',
    });

    // Mesma normalização de `address` que a rota faz antes de repassar.
    const updated = await useCase.execute({
      companyId: created.id,
      ...dto,
      address: dto.address
        ? { ...dto.address, complement: dto.address.complement ?? null }
        : undefined,
    });

    expect(updated.taxRegime).toBe('LUCRO_PRESUMIDO');
    expect(updated.stateRegistration).toBe('123456789');
    // Os campos que o PATCH não mandou continuam intactos — não viram undefined.
    expect(updated.legalName).toBe(baseDto().legalName);
    expect(updated.address).toEqual(baseDto().address);
    expect(updated.active).toBe(true);
  });

  it('enviar um campo anulável explicitamente como null LIMPA o campo', async () => {
    const repo = new InMemoryCompanyRepository();
    const created = await new CreateCompanyUseCase(repo).execute(baseDto());
    const withTradeName = await new UpdateCompanyUseCase(repo).execute({
      companyId: created.id,
      tradeName: 'Nome Fantasia Anterior',
    });
    expect(withTradeName.tradeName).toBe('Nome Fantasia Anterior');

    const dto = plainToInstance(UpdateCompanyHttpDto, { tradeName: null });
    const cleared = await new UpdateCompanyUseCase(repo).execute({
      companyId: created.id,
      ...dto,
      address: dto.address
        ? { ...dto.address, complement: dto.address.complement ?? null }
        : undefined,
    });

    expect(cleared.tradeName).toBeNull();
  });

  it('throws CompanyNotFoundError for an unknown companyId', async () => {
    const repo = new InMemoryCompanyRepository();
    const useCase = new UpdateCompanyUseCase(repo);

    await expect(
      useCase.execute({
        companyId: '00000000-0000-4000-8000-000000000000',
        legalName: 'x',
      }),
    ).rejects.toBeInstanceOf(CompanyNotFoundError);
  });
});
