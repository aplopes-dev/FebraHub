import { randomUUID } from 'crypto';
import { ClearCscUseCase } from './clear-csc.use-case';
import { SetCscUseCase } from '../set-csc/set-csc.use-case';
import { InMemoryCompanyRepository } from '../../../tests/in-memory-company.repository';
import { Company } from '../../../domain/entities/company.entity';
import { CompanyNotFoundError } from '../../../domain/errors/company-not-found.error';
import {
  AllowAllCompanyAccessPolicy,
  CompanyAccessPolicy,
} from '../../../../../shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';

const USER: AuthenticatedUser = { sub: 'test-sub', roles: [] };

/// Chave de teste: 32 bytes em base64, exigida por `cert-encryption`.
const TEST_KEY = Buffer.alloc(32, 7).toString('base64');

const CSC_TOKEN = 'AB1C2D3E-4F56-7890-ABCD-EF1234567890';
const CSC_ID = '000001';

function buildCompany(): Company {
  return Company.create({
    storeId: randomUUID(),
    cnpj: '11444777000161',
    legalName: 'EMPRESA DE TESTE LTDA',
    tradeName: null,
    stateRegistration: '123456789',
    municipalRegistration: null,
    taxRegime: 'SIMPLES_NACIONAL',
    cityCodeIbge: '2913606',
    uf: 'BA',
    address: {
      street: 'Rua Teste',
      number: '1',
      complement: null,
      district: 'Centro',
      city: 'Ilheus',
      zipCode: '45650000',
    },
  });
}

describe('ClearCscUseCase (spec erp/024, Parte B)', () => {
  let repository: InMemoryCompanyRepository;
  let setCsc: SetCscUseCase;
  let clearCsc: ClearCscUseCase;
  let company: Company;

  beforeEach(async () => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = TEST_KEY;
    repository = new InMemoryCompanyRepository();
    const policy = new AllowAllCompanyAccessPolicy();
    setCsc = new SetCscUseCase(repository, policy);
    clearCsc = new ClearCscUseCase(repository, policy);
    company = buildCompany();
    await repository.save(company);
  });

  it('zera os dois campos e hasCsc volta a false', async () => {
    await setCsc.execute({
      companyId: company.id,
      user: USER,
      cscId: CSC_ID,
      cscToken: CSC_TOKEN,
    });

    await clearCsc.execute({ companyId: company.id, user: USER });

    const saved = await repository.findById(company.id);
    expect(saved?.hasCsc()).toBe(false);
    expect(saved?.cscId).toBeNull();
    expect(saved?.cscTokenEncrypted).toBeNull();
  });

  it('é idempotente — chamar sobre um Emitente sem CSC não lança e não altera nada', async () => {
    await expect(
      clearCsc.execute({ companyId: company.id, user: USER }),
    ).resolves.toBeDefined();

    const saved = await repository.findById(company.id);
    expect(saved?.hasCsc()).toBe(false);
  });

  it('lança NotFound para id inexistente', async () => {
    await expect(
      clearCsc.execute({ companyId: randomUUID(), user: USER }),
    ).rejects.toBeInstanceOf(CompanyNotFoundError);
  });

  describe('⚠️ autorização por Emitente', () => {
    class DenyAll extends CompanyAccessPolicy {
      canActFor(): Promise<boolean> {
        return Promise.resolve(false);
      }
    }

    it('recusa remover o CSC de Emitente que o usuário não pode operar, com NotFound (não Forbidden)', async () => {
      await setCsc.execute({
        companyId: company.id,
        user: USER,
        cscId: CSC_ID,
        cscToken: CSC_TOKEN,
      });
      const negado = new ClearCscUseCase(repository, new DenyAll());

      await expect(
        negado.execute({ companyId: company.id, user: USER }),
      ).rejects.toBeInstanceOf(CompanyNotFoundError);

      // A recusa acontece antes de qualquer escrita — o CSC continua lá.
      const saved = await repository.findById(company.id);
      expect(saved?.hasCsc()).toBe(true);
    });
  });
});
