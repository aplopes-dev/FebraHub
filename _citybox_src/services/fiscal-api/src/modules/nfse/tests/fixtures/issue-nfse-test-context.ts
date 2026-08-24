import { randomUUID } from 'crypto';
import { IssueNfseUseCase } from '../../application/use-cases/issue-nfse/issue-nfse.use-case';
import { CancelNfseUseCase } from '../../application/use-cases/cancel-nfse/cancel-nfse.use-case';
import { InMemoryCompanyRepository } from '../../../companies/tests/in-memory-company.repository';
import { InMemoryCertificateRepository } from '../../../certificates/tests/in-memory-certificate.repository';
import { InMemoryCustomerRepository } from '../../../fiscal-documents/tests/in-memory-customer.repository';
import { InMemoryFiscalDocumentRepository } from '../../../fiscal-documents/tests/in-memory-fiscal-document.repository';
import { InMemoryFiscalEventRepository } from '../../../fiscal-documents/tests/in-memory-fiscal-event.repository';
import { InMemoryFiscalSequenceRepository } from '../../../fiscal-documents/tests/in-memory-fiscal-sequence.repository';
import { InMemoryProviderRequestRepository } from '../../../fiscal-documents/tests/in-memory-provider-request.repository';
import { InMemoryObjectStorage } from '../../../../shared/infra/storage/in-memory-object-storage';
import { FiscalProviderFactory } from '../../../providers/provider-factory';
import { FakeFiscalProvider } from '../../../nfe/tests/fake-fiscal-provider';
import {
  Company,
  type CompanyProps,
} from '../../../companies/domain/entities/company.entity';
import { Certificate } from '../../../certificates/domain/entities/certificate.entity';
import { buildSelfSignedCertificateFixture } from '../../../../shared/infra/fiscal-signature/tests/fixtures/self-signed-certificate';
import {
  encryptBinary,
  encryptSecret,
} from '../../../../shared/infra/fiscal-signature/cert-encryption';
import type { IssueNfseDto } from '../../application/dtos/nfse.dto';
import { InMemoryMunicipalParametersRepository } from '../in-memory-municipal-parameters.repository';
import { MunicipalParameters } from '../../domain/entities/municipal-parameters.entity';
import { MunicipalParametersService } from '../../application/services/municipal-parameters.service';
import { SubstituteNfseUseCase } from '../../application/use-cases/substitute-nfse/substitute-nfse.use-case';
import { ListNfseEventsUseCase } from '../../application/use-cases/list-nfse-events/list-nfse-events.use-case';
import { SefinNacionalNfseProvider } from '../../../providers/sefin-nacional/infrastructure/sefin-nacional-nfse.provider';

/// 32 bytes em base64 — chave fixa só para testes (nunca reaproveitar fora
/// deste contexto). Valor diferente de `TEST_CERT_ENCRYPTION_KEY` de
/// issue-nfe-test-context.ts para não colidir se ambos rodarem no mesmo
/// worker Jest (cada teste seta a env var em `beforeEach`, mas por clareza).
export const TEST_CERT_ENCRYPTION_KEY = Buffer.alloc(32, 11).toString('base64');

export function buildIssueNfseTestContext() {
  process.env.FISCAL_CERT_ENCRYPTION_KEY = TEST_CERT_ENCRYPTION_KEY;

  const companyRepository = new InMemoryCompanyRepository();
  const certificateRepository = new InMemoryCertificateRepository();
  const customerRepository = new InMemoryCustomerRepository();
  const fiscalDocumentRepository = new InMemoryFiscalDocumentRepository();
  const fiscalEventRepository = new InMemoryFiscalEventRepository();
  const fiscalSequenceRepository = new InMemoryFiscalSequenceRepository();
  const providerRequestRepository = new InMemoryProviderRequestRepository();
  const objectStorage = new InMemoryObjectStorage();
  const municipalParametersRepository =
    new InMemoryMunicipalParametersRepository();
  const municipalParametersService = new MunicipalParametersService(
    municipalParametersRepository,
  );
  const providerFactory = new FiscalProviderFactory();
  const fakeProvider = new FakeFiscalProvider();
  providerFactory.register('SEFIN_NACIONAL', fakeProvider);

  const issueNfseUseCase = new IssueNfseUseCase(
    companyRepository,
    certificateRepository,
    customerRepository,
    fiscalDocumentRepository,
    fiscalSequenceRepository,
    providerRequestRepository,
    providerFactory,
    objectStorage,
  );

  // O provider real so e usado por `syncEvents`, que os testes sobrescrevem —
  // nenhuma chamada de rede acontece.
  const sefinProvider = new SefinNacionalNfseProvider(
    fiscalDocumentRepository,
    certificateRepository,
    objectStorage,
  );
  const listNfseEventsUseCase = new ListNfseEventsUseCase(
    fiscalDocumentRepository,
    fiscalEventRepository,
    sefinProvider,
  );

  const substituteNfseUseCase = new SubstituteNfseUseCase(
    companyRepository,
    certificateRepository,
    municipalParametersService,
    fiscalDocumentRepository,
    fiscalEventRepository,
    objectStorage,
    issueNfseUseCase,
  );

  const cancelNfseUseCase = new CancelNfseUseCase(
    companyRepository,
    certificateRepository,
    municipalParametersService,
    fiscalDocumentRepository,
    fiscalEventRepository,
    providerRequestRepository,
    providerFactory,
    objectStorage,
  );

  return {
    companyRepository,
    certificateRepository,
    customerRepository,
    fiscalDocumentRepository,
    fiscalEventRepository,
    fiscalSequenceRepository,
    providerRequestRepository,
    objectStorage,
    municipalParametersRepository,
    municipalParametersService,
    providerFactory,
    fakeProvider,
    issueNfseUseCase,
    cancelNfseUseCase,
    substituteNfseUseCase,
    listNfseEventsUseCase,
    sefinProvider,
  };
}

export type IssueNfseTestContext = ReturnType<typeof buildIssueNfseTestContext>;

export async function seedIlheusCompanyWithValidCertificate(
  ctx: IssueNfseTestContext,
  companyOverrides: Partial<CompanyProps> = {},
) {
  const company = Company.create({
    storeId: randomUUID(),
    cnpj: '11222333000181',
    legalName: 'Empresa Teste Ilhéus LTDA',
    tradeName: null,
    stateRegistration: '123456789',
    municipalRegistration: '654321',
    taxRegime: 'SIMPLES_NACIONAL',
    cityCodeIbge: '2913606',
    // Ilheus aderiu ao Padrao Nacional — o default da entidade e `false`, e
    // sem isto toda emissao no teste bateria na guarda de FR-020.
    nationalNfseEnabled: true,
    uf: 'BA',
    address: {
      street: 'Rua Teste',
      number: '100',
      complement: null,
      district: 'Centro',
      city: 'Ilhéus',
      zipCode: '45650-000',
    },
    ...companyOverrides,
  });
  await ctx.companyRepository.save(company);

  // Parametrizacao municipal EM CACHE por padrao. Sem ela,
  // `MunicipalParametersService` cai no fallback de buscar no ambiente
  // nacional — chamada de rede REAL dentro de teste unitario, que o torna
  // lento (25s observados) e dependente da rede. Testes que precisam do
  // cenario "municipio nao publicou X" sobrescrevem chamando
  // `municipalParametersRepository.save` com o conteudo que quiserem.
  await ctx.municipalParametersRepository.save(
    MunicipalParameters.create({
      cityCodeIbge: company.cityCodeIbge,
      parameters: { prazoCancelamento: 30, prazoSubstituicao: 30 },
      fetchedAt: new Date(),
    }),
  );

  const certFixture = buildSelfSignedCertificateFixture({ cnpj: company.cnpj });
  const pfxObjectKey = `${company.id}/certificates/${randomUUID()}.pfx.enc`;
  await ctx.objectStorage.put({
    key: pfxObjectKey,
    buffer: Buffer.from(encryptBinary(certFixture.pfxBuffer), 'utf-8'),
    mimeType: 'text/plain',
  });

  const certificate = Certificate.with(
    {
      companyId: company.id,
      type: 'A1',
      name: null,
      encryptedPfxObjectKey: pfxObjectKey,
      encryptedPassword: encryptSecret(certFixture.password),
      subjectCnpj: certFixture.cnpj,
      validFrom: new Date(Date.now() - 86400000),
      validUntil: new Date(Date.now() + 365 * 86400000),
      status: 'VALID',
      createdAt: new Date(),
    },
    randomUUID(),
  );
  await ctx.certificateRepository.save(certificate);

  return { company, certificate };
}

export function baseIssueNfseDto(
  companyId: string,
  overrides: Partial<IssueNfseDto> = {},
): IssueNfseDto {
  return {
    companyId,
    sourceSystem: 'erp',
    externalReference: randomUUID(),
    idempotencyKey: randomUUID(),
    customer: {
      documentType: 'CPF',
      document: '12345678900',
      name: 'Cliente Teste',
    },
    nfse: {
      serviceDescription: 'Serviço de consultoria em tecnologia da informação',
      municipalServiceCode: '17.02',
      issRate: 5,
      issWithheld: false,
    },
    items: [
      {
        description: 'Consultoria em TI',
        quantity: 1,
        unitValue: 850,
        totalValue: 850,
        serviceCode: '17.02',
      },
    ],
    ...overrides,
  };
}
