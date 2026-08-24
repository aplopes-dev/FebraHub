import { randomUUID } from 'crypto';
import { UploadCertificateUseCase } from '../../application/use-cases/upload-certificate/upload-certificate.use-case';
import { InMemoryCompanyRepository } from '../../../companies/tests/in-memory-company.repository';
import { InMemoryCertificateRepository } from '../in-memory-certificate.repository';
import { InMemoryObjectStorage } from '../../../../shared/infra/storage/in-memory-object-storage';
import { Company } from '../../../companies/domain/entities/company.entity';

export const TEST_CERT_ENCRYPTION_KEY = Buffer.alloc(32, 13).toString('base64');

export function buildUploadCertificateTestContext() {
  process.env.FISCAL_CERT_ENCRYPTION_KEY = TEST_CERT_ENCRYPTION_KEY;

  const companyRepository = new InMemoryCompanyRepository();
  const certificateRepository = new InMemoryCertificateRepository();
  const objectStorage = new InMemoryObjectStorage();

  const uploadCertificateUseCase = new UploadCertificateUseCase(
    companyRepository,
    certificateRepository,
    objectStorage,
  );

  return {
    companyRepository,
    certificateRepository,
    objectStorage,
    uploadCertificateUseCase,
  };
}

export type UploadCertificateTestContext = ReturnType<
  typeof buildUploadCertificateTestContext
>;

export async function seedCompany(
  ctx: UploadCertificateTestContext,
  cnpj = '11222333000181',
) {
  const company = Company.create({
    storeId: randomUUID(),
    cnpj,
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
  });
  await ctx.companyRepository.save(company);
  return company;
}
