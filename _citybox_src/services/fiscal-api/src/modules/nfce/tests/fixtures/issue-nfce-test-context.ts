import { randomUUID } from 'crypto';
import { IssueNfceUseCase } from '../../application/use-cases/issue-nfce/issue-nfce.use-case';
import { SetCscUseCase } from '../../../companies/application/use-cases/set-csc/set-csc.use-case';
import { InMemoryCompanyRepository } from '../../../companies/tests/in-memory-company.repository';
import { InMemoryCertificateRepository } from '../../../certificates/tests/in-memory-certificate.repository';
import { InMemoryFiscalDocumentRepository } from '../../../fiscal-documents/tests/in-memory-fiscal-document.repository';
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
import {
  NfceConsultationUrls,
  type NfceUrls,
} from '../../domain/consultation-urls';
import type { IssueNfceDto } from '../../application/dtos/nfce.dto';
import { AllowAllCompanyAccessPolicy } from '../../../../shared/domain/tenant/company-access.policy';
import { InMemoryContingencyQueueRepository } from '../in-memory-contingency-queue.repository';
import type { AuthenticatedUser } from '../../../../shared/infra/http/auth/authenticated-user';

export const TEST_CERT_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
export const TEST_USER: AuthenticatedUser = { sub: 'test-sub', roles: [] };
export const TEST_CSC_ID = '000001';
export const TEST_CSC_TOKEN = 'CSC-DE-TESTE-NAO-E-SEGREDO-REAL';

const TEST_URLS: NfceUrls = {
  qrCode: 'https://hnfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx',
  accessKeyLookup: 'https://hnfe.sefaz.ba.gov.br/servicos/nfce/consulta.aspx',
};

/// Dublê que **devolve** URLs, em vez de ler ambiente.
///
/// ⚠️ Note que ele não repete o comportamento do real por acaso: o real recusa
/// quando não há configuração, e há teste dedicado para essa recusa usando
/// `EnvNfceConsultationUrls`. Um dublê que sempre devolve URL, usado em toda
/// parte, esconderia justamente o caso que interessa — foi assim que um
/// vazamento de tenant sobreviveu à suíte nesta base.
class StubConsultationUrls extends NfceConsultationUrls {
  forUf(): NfceUrls {
    return TEST_URLS;
  }
}

export function buildIssueNfceTestContext() {
  process.env.FISCAL_CERT_ENCRYPTION_KEY = TEST_CERT_ENCRYPTION_KEY;

  const companyRepository = new InMemoryCompanyRepository();
  const certificateRepository = new InMemoryCertificateRepository();
  const fiscalDocumentRepository = new InMemoryFiscalDocumentRepository();
  const fiscalSequenceRepository = new InMemoryFiscalSequenceRepository();
  const providerRequestRepository = new InMemoryProviderRequestRepository();
  const objectStorage = new InMemoryObjectStorage();
  const contingencyQueue = new InMemoryContingencyQueueRepository();
  const providerFactory = new FiscalProviderFactory();
  const fakeProvider = new FakeFiscalProvider();
  providerFactory.register('SEFAZ_BA_NFE', fakeProvider);

  const issueNfceUseCase = new IssueNfceUseCase(
    companyRepository,
    certificateRepository,
    fiscalDocumentRepository,
    fiscalSequenceRepository,
    providerRequestRepository,
    providerFactory,
    objectStorage,
    new StubConsultationUrls(),
    // Política permissiva: esta suíte cobre a LÓGICA de emissão. A autorização
    // real tem suíte própria contra Postgres, que exige participação em loja —
    // misturar as duas faria cada teste de numeração depender de montar
    // `platform.store_members`.
    new AllowAllCompanyAccessPolicy(),
    contingencyQueue,
  );

  return {
    companyRepository,
    certificateRepository,
    fiscalDocumentRepository,
    fiscalSequenceRepository,
    providerRequestRepository,
    objectStorage,
    providerFactory,
    fakeProvider,
    contingencyQueue,
    issueNfceUseCase,
    setCscUseCase: new SetCscUseCase(
      companyRepository,
      new AllowAllCompanyAccessPolicy(),
    ),
  };
}

export type IssueNfceTestContext = ReturnType<typeof buildIssueNfceTestContext>;

/// Emitente pronto para emitir cupom: certificado válido **e** CSC.
///
/// Passe `withCsc: false` para exercitar a recusa por CSC ausente — é a razão
/// de o parâmetro existir.
export async function seedCompanyReadyForNfce(
  ctx: IssueNfceTestContext,
  options: { withCsc?: boolean; company?: Partial<CompanyProps> } = {},
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
    ...options.company,
  });
  await ctx.companyRepository.save(company);

  const certFixture = buildSelfSignedCertificateFixture({ cnpj: company.cnpj });
  const pfxObjectKey = `${company.id}/certificates/${randomUUID()}.pfx.enc`;
  await ctx.objectStorage.put({
    key: pfxObjectKey,
    buffer: Buffer.from(encryptBinary(certFixture.pfxBuffer), 'utf-8'),
    mimeType: 'text/plain',
  });

  await ctx.certificateRepository.save(
    Certificate.with(
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
    ),
  );

  if (options.withCsc !== false) {
    await ctx.setCscUseCase.execute({
      companyId: company.id,
      user: TEST_USER,
      cscId: TEST_CSC_ID,
      cscToken: TEST_CSC_TOKEN,
    });
  }

  // Relê: `setCsc` gravou pelo repositório, e a instância local ficaria sem o
  // CSC — o teste passaria a exercitar um objeto que o caso de uso não vê.
  const saved = await ctx.companyRepository.findById(company.id);
  return { company: saved ?? company };
}

export function baseIssueNfceDto(
  companyId: string,
  overrides: Partial<IssueNfceDto> = {},
): IssueNfceDto {
  return {
    companyId,
    user: TEST_USER,
    sourceSystem: 'pdv',
    externalReference: randomUUID(),
    idempotencyKey: randomUUID(),
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
    payments: [{ method: '01', amount: 100 }],
    ...overrides,
  };
}
