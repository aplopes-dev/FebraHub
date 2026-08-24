import { inspect } from 'util';
import { randomUUID } from 'crypto';
import { SetCscUseCase } from './set-csc.use-case';
import { InMemoryCompanyRepository } from '../../../tests/in-memory-company.repository';
import { Company } from '../../../domain/entities/company.entity';
import { CompanyNotFoundError } from '../../../domain/errors/company-not-found.error';
import { readCompanyCsc } from '../../../infrastructure/csc/company-csc.reader';
import { CompanyCscNotConfiguredError } from '../../../domain/errors/company-csc-not-configured.error';
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

describe('SetCscUseCase', () => {
  let repository: InMemoryCompanyRepository;
  let useCase: SetCscUseCase;
  let company: Company;

  beforeEach(async () => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = TEST_KEY;
    repository = new InMemoryCompanyRepository();
    useCase = new SetCscUseCase(repository, new AllowAllCompanyAccessPolicy());
    company = buildCompany();
    await repository.save(company);
  });

  it('grava o token CIFRADO, nunca em claro', async () => {
    await useCase.execute({
      companyId: company.id,
      user: USER,
      cscId: CSC_ID,
      cscToken: CSC_TOKEN,
    });

    const saved = await repository.findById(company.id);

    // ⚠️ A asserção central desta suíte. Não basta "existe um campo": o valor
    // gravado tem de ser DIFERENTE do texto claro. Um `encryptSecret` que
    // devolvesse a entrada intacta passaria por qualquer teste de presença.
    expect(saved?.cscTokenEncrypted).toBeTruthy();
    expect(saved?.cscTokenEncrypted).not.toBe(CSC_TOKEN);
    expect(saved?.cscTokenEncrypted).not.toContain(CSC_TOKEN);
  });

  it('a leitura devolve o valor claro', async () => {
    await useCase.execute({
      companyId: company.id,
      user: USER,
      cscId: CSC_ID,
      cscToken: CSC_TOKEN,
    });

    const saved = await repository.findById(company.id);
    expect(readCompanyCsc(saved!)).toEqual({
      cscId: CSC_ID,
      cscToken: CSC_TOKEN,
    });
  });

  it('o token nao aparece ao serializar a entidade inteira', async () => {
    await useCase.execute({
      companyId: company.id,
      user: USER,
      cscId: CSC_ID,
      cscToken: CSC_TOKEN,
    });
    const saved = await repository.findById(company.id);

    // `Entity.props` é público, então um `logger.info({ company })` descuidado
    // serializa TUDO. Isso é seguro só porque a entidade nunca chega a segurar
    // o texto claro — é propriedade estrutural, e este teste a trava.
    expect(JSON.stringify(saved)).not.toContain(CSC_TOKEN);
    // `inspect` com profundidade total é o que pino/console fazem de fato ao
    // receber o objeto — `String(obj)` daria "[object Object]" e passaria
    // mesmo com o token dentro.
    expect(inspect(saved, { depth: null })).not.toContain(CSC_TOKEN);
  });

  it('o token nao aparece na mensagem de erro quando o Emitente nao existe', async () => {
    const ausente = randomUUID();

    await expect(
      useCase.execute({
        companyId: ausente,
        user: USER,
        cscId: CSC_ID,
        cscToken: CSC_TOKEN,
      }),
    ).rejects.toBeInstanceOf(CompanyNotFoundError);

    try {
      await useCase.execute({
        companyId: ausente,
        user: USER,
        cscId: CSC_ID,
        cscToken: CSC_TOKEN,
      });
    } catch (error: unknown) {
      const dump = `${String(error)}${JSON.stringify(error)}`;
      expect(dump).not.toContain(CSC_TOKEN);
    }
  });

  it('substituir o CSC sobrescreve o anterior por inteiro', async () => {
    await useCase.execute({
      companyId: company.id,
      user: USER,
      cscId: CSC_ID,
      cscToken: CSC_TOKEN,
    });
    await useCase.execute({
      companyId: company.id,
      user: USER,
      cscId: '000002',
      cscToken: 'NOVO-TOKEN-APOS-ROTACAO',
    });

    // Rotação de CSC é operação real: a SEFAZ permite dois códigos ativos e o
    // contribuinte troca. Deixar o id antigo com o token novo produziria hash
    // válido conferido contra o código errado — cupom autorizado e
    // inconsultável, de novo.
    const saved = await repository.findById(company.id);
    expect(readCompanyCsc(saved!)).toEqual({
      cscId: '000002',
      cscToken: 'NOVO-TOKEN-APOS-ROTACAO',
    });
  });

  it('recusa a leitura quando o Emitente nao tem CSC', () => {
    expect(() => readCompanyCsc(company)).toThrow(CompanyCscNotConfiguredError);
  });

  it('recusa id ou token em branco em vez de gravar CSC inutil', async () => {
    // Gravar string vazia produziria um Emitente que se declara apto a emitir
    // cupom e gera QR Code que a SEFAZ não confere.
    await expect(
      useCase.execute({
        companyId: company.id,
        user: USER,
        cscId: '',
        cscToken: CSC_TOKEN,
      }),
    ).rejects.toBeInstanceOf(CompanyCscNotConfiguredError);

    await expect(
      useCase.execute({
        companyId: company.id,
        user: USER,
        cscId: CSC_ID,
        cscToken: '  ',
      }),
    ).rejects.toBeInstanceOf(CompanyCscNotConfiguredError);
  });

  /// ⚠️ Achado da revisão de T066, e **defeito da própria entrega**.
  ///
  /// A rota tinha `@RequirePermission('fiscal.companies.manage')` e mais nada.
  /// Essa permissão diz que o usuário pode gerenciar *algum* Emitente — não
  /// **este**. Sem a política, um usuário legítimo podia gravar CSC em empresa
  /// alheia, e as duas consequências são graves:
  ///
  /// - sobrescrever o CSC de outro contribuinte quebra a emissão de cupom dele
  ///   **em silêncio** (os QR Codes passam a ser calculados com o código
  ///   errado, e só falham quando um consumidor tenta consultar);
  /// - gravar um CSC **conhecido** permite forjar QR Code que a consulta
  ///   pública da SEFAZ aceita para os cupons daquela empresa.
  describe('⚠️ autorizacao por Emitente', () => {
    class DenyAll extends CompanyAccessPolicy {
      canActFor(): Promise<boolean> {
        return Promise.resolve(false);
      }
    }

    it('recusa gravar CSC em Emitente que o usuario nao pode operar', async () => {
      const negado = new SetCscUseCase(repository, new DenyAll());

      await expect(
        negado.execute({
          companyId: company.id,
          user: USER,
          cscId: CSC_ID,
          cscToken: CSC_TOKEN,
        }),
      ).rejects.toBeInstanceOf(CompanyNotFoundError);
    });

    it('recusa com NotFound, nao Forbidden', async () => {
      // Um 403 confirmaria que o Emitente existe, e a existência de
      // contribuinte alheio já é informação.
      const negado = new SetCscUseCase(repository, new DenyAll());

      try {
        await negado.execute({
          companyId: company.id,
          user: USER,
          cscId: CSC_ID,
          cscToken: CSC_TOKEN,
        });
        fail('deveria ter lançado');
      } catch (error: unknown) {
        expect((error as CompanyNotFoundError).name).toContain('NotFound');
      }
    });

    it('a recusa acontece ANTES de qualquer escrita', async () => {
      const negado = new SetCscUseCase(repository, new DenyAll());

      await expect(
        negado.execute({
          companyId: company.id,
          user: USER,
          cscId: CSC_ID,
          cscToken: CSC_TOKEN,
        }),
      ).rejects.toThrow();

      const saved = await repository.findById(company.id);
      expect(saved?.cscTokenEncrypted).toBeNull();
    });
  });
});
