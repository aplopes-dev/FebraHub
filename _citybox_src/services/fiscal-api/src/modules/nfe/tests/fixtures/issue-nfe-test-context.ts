import { randomUUID } from 'crypto';
import { IssueNfeUseCase } from '../../application/use-cases/issue-nfe/issue-nfe.use-case';
import { ConsultNfeUseCase } from '../../application/use-cases/consult-nfe/consult-nfe.use-case';
import { GetNfeXmlUseCase } from '../../application/use-cases/get-nfe-xml/get-nfe-xml.use-case';
import { CancelNfeUseCase } from '../../application/use-cases/cancel-nfe/cancel-nfe.use-case';
import { CorrectionLetterNfeUseCase } from '../../application/use-cases/correction-letter-nfe/correction-letter-nfe.use-case';
import { InutilizeNfeUseCase } from '../../application/use-cases/inutilize-nfe/inutilize-nfe.use-case';
import { InMemoryCompanyRepository } from '../../../companies/tests/in-memory-company.repository';
import { InMemoryCertificateRepository } from '../../../certificates/tests/in-memory-certificate.repository';
import { InMemoryCustomerRepository } from '../../../fiscal-documents/tests/in-memory-customer.repository';
import { InMemoryFiscalDocumentRepository } from '../../../fiscal-documents/tests/in-memory-fiscal-document.repository';
import { InMemoryFiscalEventRepository } from '../../../fiscal-documents/tests/in-memory-fiscal-event.repository';
import { InMemoryFiscalSequenceRepository } from '../../../fiscal-documents/tests/in-memory-fiscal-sequence.repository';
import { InMemoryProviderRequestRepository } from '../../../fiscal-documents/tests/in-memory-provider-request.repository';
import { InMemoryObjectStorage } from '../../../../shared/infra/storage/in-memory-object-storage';
import { FiscalProviderFactory } from '../../../providers/provider-factory';
import { FakeFiscalProvider } from '../fake-fiscal-provider';
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
import type { IssueNfeDto } from '../../application/dtos/nfe.dto';

/// 32 bytes em base64 — chave fixa só para testes (nunca reaproveitar fora
/// deste contexto).
export const TEST_CERT_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

export function buildIssueNfeTestContext() {
  process.env.FISCAL_CERT_ENCRYPTION_KEY = TEST_CERT_ENCRYPTION_KEY;

  const companyRepository = new InMemoryCompanyRepository();
  const certificateRepository = new InMemoryCertificateRepository();
  const customerRepository = new InMemoryCustomerRepository();
  const fiscalDocumentRepository = new InMemoryFiscalDocumentRepository();
  const fiscalEventRepository = new InMemoryFiscalEventRepository();
  const fiscalSequenceRepository = new InMemoryFiscalSequenceRepository();
  const providerRequestRepository = new InMemoryProviderRequestRepository();
  const objectStorage = new InMemoryObjectStorage();
  const providerFactory = new FiscalProviderFactory();
  const fakeProvider = new FakeFiscalProvider();
  providerFactory.register('SEFAZ_BA_NFE', fakeProvider);

  const issueNfeUseCase = new IssueNfeUseCase(
    companyRepository,
    certificateRepository,
    customerRepository,
    fiscalDocumentRepository,
    fiscalSequenceRepository,
    providerRequestRepository,
    providerFactory,
    objectStorage,
  );
  const consultNfeUseCase = new ConsultNfeUseCase(
    fiscalDocumentRepository,
    providerFactory,
  );
  const getNfeXmlUseCase = new GetNfeXmlUseCase(
    fiscalDocumentRepository,
    objectStorage,
  );
  const cancelNfeUseCase = new CancelNfeUseCase(
    fiscalDocumentRepository,
    fiscalEventRepository,
    providerRequestRepository,
    providerFactory,
    objectStorage,
  );
  const correctionLetterNfeUseCase = new CorrectionLetterNfeUseCase(
    fiscalDocumentRepository,
    fiscalEventRepository,
    providerRequestRepository,
    providerFactory,
    objectStorage,
  );
  const inutilizeNfeUseCase = new InutilizeNfeUseCase(
    companyRepository,
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
    providerFactory,
    fakeProvider,
    issueNfeUseCase,
    consultNfeUseCase,
    getNfeXmlUseCase,
    cancelNfeUseCase,
    correctionLetterNfeUseCase,
    inutilizeNfeUseCase,
  };
}

export type IssueNfeTestContext = ReturnType<typeof buildIssueNfeTestContext>;

export async function seedCompanyWithValidCertificate(
  ctx: IssueNfeTestContext,
  companyOverrides: Partial<CompanyProps> = {},
) {
  const company = Company.create({
    storeId: randomUUID(),
    cnpj: '11222333000181',
    legalName: 'Empresa Teste LTDA',
    tradeName: null,
    stateRegistration: '123456789',
    municipalRegistration: null,
    taxRegime: 'SIMPLES_NACIONAL',
    cityCodeIbge: '2913606',
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

export function baseIssueNfeDto(
  companyId: string,
  overrides: Partial<IssueNfeDto> = {},
): IssueNfeDto {
  return {
    companyId,
    sourceSystem: 'erp',
    externalReference: randomUUID(),
    idempotencyKey: randomUUID(),
    operationNature: 'Venda de mercadoria',
    operationType: '1',
    finalConsumer: true,
    presenceIndicator: '1',
    paymentMethodCode: '01',
    customer: {
      documentType: 'CPF',
      document: '12345678900',
      name: 'Cliente Teste',
      address: {
        street: 'Rua Cliente',
        number: '1',
        district: 'Centro',
        cityCodeIbge: '2913606',
        city: 'Ilhéus',
        uf: 'BA',
        zipCode: '45650-000',
      },
    },
    items: [
      {
        description: 'Produto Teste',
        ncm: '61091000',
        cfop: '5102',
        quantity: 1,
        unitValue: 100,
        totalValue: 100,
        csosn: '102',
      },
    ],
    ...overrides,
  };
}
