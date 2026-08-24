import { randomUUID } from 'crypto';
import { InMemoryFiscalDocumentRepository } from '../../../fiscal-documents/tests/in-memory-fiscal-document.repository';
import { InMemoryCertificateRepository } from '../../../certificates/tests/in-memory-certificate.repository';
import { InMemoryCompanyRepository } from '../../../companies/tests/in-memory-company.repository';
import { InMemoryObjectStorage } from '../../../../shared/infra/storage/in-memory-object-storage';
import { FiscalDocument } from '../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { Certificate } from '../../../certificates/domain/entities/certificate.entity';
import { Company } from '../../../companies/domain/entities/company.entity';
import { buildSelfSignedCertificateFixture } from '../../../../shared/infra/fiscal-signature/tests/fixtures/self-signed-certificate';
import {
  encryptBinary,
  encryptSecret,
} from '../../../../shared/infra/fiscal-signature/cert-encryption';
import { FiscalDocumentNotFoundError } from '../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { CertificateNotValidError } from '../../../nfe/domain/errors/certificate-not-valid.error';
import { SefazUnavailableError } from '../../../../shared/infra/fiscal-soap/errors/sefaz-unavailable.error';
import { callSefazSoapOperation } from '../../../../shared/infra/fiscal-soap/sefaz-soap-client';
import { SefazBaNfeProvider } from '../infrastructure/sefaz-ba-nfe.provider';

const TEST_KEY = Buffer.alloc(32, 9).toString('base64');

/// `jest.mock` é hoisted pelo ts-jest para antes de todos os imports acima —
/// a ordem física no arquivo não importa para o mock surtir efeito.
jest.mock('../../../../shared/infra/fiscal-soap/sefaz-soap-client', () => ({
  callSefazSoapOperation: jest.fn(),
}));

const mockedCallSefazSoapOperation =
  callSefazSoapOperation as jest.MockedFunction<typeof callSefazSoapOperation>;

const RET_ENVI_NFE_AUTHORIZED =
  '<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
  '<cStat>104</cStat><xMotivo>Lote processado</xMotivo>' +
  '<protNFe><infProt>' +
  '<chNFe>12345678901234567890123456789012345678901234</chNFe>' +
  '<nProt>129260000000001</nProt><cStat>100</cStat>' +
  '<xMotivo>Autorizado o uso da NF-e</xMotivo>' +
  '</infProt></protNFe></retEnviNFe>';

const RET_CONS_SIT_NFE_AUTHORIZED =
  '<retConsSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
  '<cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo>' +
  '<chNFe>12345678901234567890123456789012345678901234</chNFe>' +
  '<protNFe><infProt><nProt>129260000000001</nProt></infProt></protNFe>' +
  '</retConsSitNFe>';

const RET_ENV_EVENTO_AUTHORIZED =
  '<retEnvEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">' +
  '<cStat>128</cStat><xMotivo>Lote de Evento Processado</xMotivo>' +
  '<retEvento versao="1.00"><infEvento>' +
  '<cStat>135</cStat><xMotivo>Evento registrado e vinculado a NF-e</xMotivo>' +
  '<nProt>129260000000099</nProt>' +
  '</infEvento></retEvento></retEnvEvento>';

const RET_ENV_EVENTO_REJECTED =
  '<retEnvEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">' +
  '<cStat>128</cStat><xMotivo>Lote de Evento Processado</xMotivo>' +
  '<retEvento versao="1.00"><infEvento>' +
  '<cStat>573</cStat><xMotivo>Duplicidade de Evento</xMotivo>' +
  '</infEvento></retEvento></retEnvEvento>';

const RET_INUT_NFE_AUTHORIZED =
  '<retInutNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
  '<infInut><cStat>102</cStat>' +
  '<xMotivo>Inutilização de número homologado</xMotivo>' +
  '<nProt>129260000000199</nProt></infInut></retInutNFe>';

const RET_INUT_NFE_REJECTED =
  '<retInutNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">' +
  '<infInut><cStat>563</cStat>' +
  '<xMotivo>Rejeição: NF-e já existente na faixa</xMotivo></infInut></retInutNFe>';

function buildProvider() {
  const fiscalDocumentRepository = new InMemoryFiscalDocumentRepository();
  const certificateRepository = new InMemoryCertificateRepository();
  const companyRepository = new InMemoryCompanyRepository();
  const objectStorage = new InMemoryObjectStorage();
  const provider = new SefazBaNfeProvider(
    fiscalDocumentRepository,
    certificateRepository,
    companyRepository,
    objectStorage,
  );
  return {
    fiscalDocumentRepository,
    certificateRepository,
    companyRepository,
    objectStorage,
    provider,
  };
}

async function seedCompanyAndCertificate(
  ctx: ReturnType<typeof buildProvider>,
) {
  const fixture = buildSelfSignedCertificateFixture();
  const company = Company.create({
    storeId: randomUUID(),
    cnpj: fixture.cnpj,
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

  const pfxObjectKey = `${company.id}/certificates/${randomUUID()}.pfx.enc`;
  await ctx.objectStorage.put({
    key: pfxObjectKey,
    buffer: Buffer.from(encryptBinary(fixture.pfxBuffer), 'utf-8'),
    mimeType: 'text/plain',
  });
  const certificate = Certificate.with(
    {
      companyId: company.id,
      type: 'A1',
      name: null,
      encryptedPfxObjectKey: pfxObjectKey,
      encryptedPassword: encryptSecret(fixture.password),
      subjectCnpj: fixture.cnpj,
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

async function seedCompanyCertificateAndDocument(
  ctx: ReturnType<typeof buildProvider>,
) {
  const { company, certificate } = await seedCompanyAndCertificate(ctx);
  const companyId = company.id;

  const now = new Date();
  const document = FiscalDocument.with(
    {
      companyId,
      customerId: null,
      documentType: 'NFE',
      provider: 'SEFAZ_BA_NFE',
      environment: 'HOMOLOGATION',
      status: 'SIGNED',
      sourceSystem: 'erp',
      externalReference: randomUUID(),
      idempotencyKey: randomUUID(),
      series: '1',
      number: '1',
      rpsSeries: null,
      rpsNumber: null,
      accessKey: '12345678901234567890123456789012345678901234',
      verificationCode: null,
      protocol: null,
      totalAmount: 100,
      xmlObjectKey: null,
      errorCode: null,
      errorMessage: null,
      issuedAt: now,
      authorizedAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    randomUUID(),
  );
  await ctx.fiscalDocumentRepository.save(document);

  return { companyId, certificate, document };
}

describe('SefazBaNfeProvider', () => {
  beforeEach(() => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = TEST_KEY;
    mockedCallSefazSoapOperation.mockReset();
  });

  describe('issue', () => {
    it('builds the enviNFe SOAP request, sends it with the certificate key material, and maps AUTHORIZED', async () => {
      const ctx = buildProvider();
      const { document } = await seedCompanyCertificateAndDocument(ctx);
      mockedCallSefazSoapOperation.mockResolvedValue({
        responseBodyXml: RET_ENVI_NFE_AUTHORIZED,
        rawRequestXml: '<soap request/>',
        rawResponseXml: '<soap response/>',
      });

      const result = await ctx.provider.issue({
        fiscalDocumentId: document.id,
        environment: 'HOMOLOGATION',
        signedXml: Buffer.from('<NFe>...</NFe>', 'utf-8'),
      });

      expect(result.status).toBe('AUTHORIZED');
      if (result.status === 'AUTHORIZED') {
        expect(result.protocol).toBe('129260000000001');
        expect(result.accessKey).toBe(
          '12345678901234567890123456789012345678901234',
        );
        expect(result.authorizedXml?.toString('utf-8')).toContain('<nfeProc');
      }

      expect(mockedCallSefazSoapOperation).toHaveBeenCalledTimes(1);
      const callArgs = mockedCallSefazSoapOperation.mock.calls[0][0];
      expect(callArgs.operation).toBe('nfeAutorizacaoLote');
      expect(callArgs.requestBodyXml).toContain('<enviNFe');
      expect(callArgs.requestBodyXml).toContain('<indSinc>1</indSinc>');
      expect(callArgs.privateKeyPem).toContain('BEGIN RSA PRIVATE KEY');
      expect(callArgs.certificatePem).toContain('BEGIN CERTIFICATE');
      expect(callArgs.endpoint).toContain('hnfe.sefaz.ba.gov.br');
    });

    it('throws FiscalDocumentNotFoundError when the document does not exist', async () => {
      const ctx = buildProvider();

      await expect(
        ctx.provider.issue({
          fiscalDocumentId: randomUUID(),
          environment: 'HOMOLOGATION',
          signedXml: Buffer.from('<NFe/>', 'utf-8'),
        }),
      ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
      expect(mockedCallSefazSoapOperation).not.toHaveBeenCalled();
    });

    it('throws CertificateNotValidError when the company has no valid certificate', async () => {
      const ctx = buildProvider();
      const now = new Date();
      const document = FiscalDocument.with(
        {
          companyId: randomUUID(),
          customerId: null,
          documentType: 'NFE',
          provider: 'SEFAZ_BA_NFE',
          environment: 'HOMOLOGATION',
          status: 'SIGNED',
          sourceSystem: 'erp',
          externalReference: randomUUID(),
          idempotencyKey: randomUUID(),
          series: '1',
          number: '1',
          rpsSeries: null,
          rpsNumber: null,
          accessKey: null,
          verificationCode: null,
          protocol: null,
          totalAmount: 100,
          xmlObjectKey: null,
          errorCode: null,
          errorMessage: null,
          issuedAt: now,
          authorizedAt: null,
          cancelledAt: null,
          createdAt: now,
          updatedAt: now,
        },
        randomUUID(),
      );
      await ctx.fiscalDocumentRepository.save(document);

      await expect(
        ctx.provider.issue({
          fiscalDocumentId: document.id,
          environment: 'HOMOLOGATION',
          signedXml: Buffer.from('<NFe/>', 'utf-8'),
        }),
      ).rejects.toBeInstanceOf(CertificateNotValidError);
    });

    it('propagates SefazUnavailableError when the SOAP call fails', async () => {
      const ctx = buildProvider();
      const { document } = await seedCompanyCertificateAndDocument(ctx);
      mockedCallSefazSoapOperation.mockRejectedValue(
        new SefazUnavailableError(
          'test',
          'nfeAutorizacaoLote',
          new Error('boom'),
        ),
      );

      await expect(
        ctx.provider.issue({
          fiscalDocumentId: document.id,
          environment: 'HOMOLOGATION',
          signedXml: Buffer.from('<NFe/>', 'utf-8'),
        }),
      ).rejects.toBeInstanceOf(SefazUnavailableError);
    });
  });

  describe('consult', () => {
    it('builds the consSitNFe SOAP request using the document access key and maps AUTHORIZED', async () => {
      const ctx = buildProvider();
      const { document } = await seedCompanyCertificateAndDocument(ctx);
      mockedCallSefazSoapOperation.mockResolvedValue({
        responseBodyXml: RET_CONS_SIT_NFE_AUTHORIZED,
        rawRequestXml: '<soap request/>',
        rawResponseXml: '<soap response/>',
      });

      const result = await ctx.provider.consult({
        fiscalDocumentId: document.id,
      });

      expect(result.status).toBe('AUTHORIZED');
      expect(result.protocol).toBe('129260000000001');

      const callArgs = mockedCallSefazSoapOperation.mock.calls[0][0];
      expect(callArgs.operation).toBe('nfeConsultaNF');
      expect(callArgs.requestBodyXml).toContain(
        '<chNFe>12345678901234567890123456789012345678901234</chNFe>',
      );
    });

    it('returns REJECTED without calling SOAP when the document has no access key', async () => {
      const ctx = buildProvider();
      const companyId = randomUUID();
      const fixture = buildSelfSignedCertificateFixture();
      const pfxObjectKey = `${companyId}/certificates/${randomUUID()}.pfx.enc`;
      await ctx.objectStorage.put({
        key: pfxObjectKey,
        buffer: Buffer.from(encryptBinary(fixture.pfxBuffer), 'utf-8'),
        mimeType: 'text/plain',
      });
      await ctx.certificateRepository.save(
        Certificate.with(
          {
            companyId,
            type: 'A1',
            name: null,
            encryptedPfxObjectKey: pfxObjectKey,
            encryptedPassword: encryptSecret(fixture.password),
            subjectCnpj: fixture.cnpj,
            validFrom: new Date(Date.now() - 86400000),
            validUntil: new Date(Date.now() + 365 * 86400000),
            status: 'VALID',
            createdAt: new Date(),
          },
          randomUUID(),
        ),
      );
      const now = new Date();
      const document = FiscalDocument.with(
        {
          companyId,
          customerId: null,
          documentType: 'NFE',
          provider: 'SEFAZ_BA_NFE',
          environment: 'HOMOLOGATION',
          status: 'SYNC_REQUIRED',
          sourceSystem: 'erp',
          externalReference: randomUUID(),
          idempotencyKey: randomUUID(),
          series: '1',
          number: '1',
          rpsSeries: null,
          rpsNumber: null,
          accessKey: null,
          verificationCode: null,
          protocol: null,
          totalAmount: 100,
          xmlObjectKey: null,
          errorCode: null,
          errorMessage: null,
          issuedAt: now,
          authorizedAt: null,
          cancelledAt: null,
          createdAt: now,
          updatedAt: now,
        },
        randomUUID(),
      );
      await ctx.fiscalDocumentRepository.save(document);

      const result = await ctx.provider.consult({
        fiscalDocumentId: document.id,
      });

      expect(result.status).toBe('REJECTED');
      expect(mockedCallSefazSoapOperation).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('builds+signs the envEvento SOAP request and maps cStat=135 to CANCEL_AUTHORIZED', async () => {
      const ctx = buildProvider();
      const { document } = await seedCompanyCertificateAndDocument(ctx);
      mockedCallSefazSoapOperation.mockResolvedValue({
        responseBodyXml: RET_ENV_EVENTO_AUTHORIZED,
        rawRequestXml: '<soap request/>',
        rawResponseXml: '<soap response/>',
      });

      const result = await ctx.provider.cancel({
        fiscalDocumentId: document.id,
        protocol: '129260000000001',
        justification: 'Erro no preenchimento do pedido original',
      });

      expect(result.status).toBe('CANCEL_AUTHORIZED');
      if (result.status === 'CANCEL_AUTHORIZED') {
        expect(result.protocol).toBe('129260000000099');
      }

      const callArgs = mockedCallSefazSoapOperation.mock.calls[0][0];
      expect(callArgs.operation).toBe('nfeRecepcaoEvento');
      expect(callArgs.requestBodyXml).toContain('<envEvento');
      expect(callArgs.requestBodyXml).toContain('<tpEvento>110111</tpEvento>');
      expect(callArgs.requestBodyXml).toContain('<Signature');
    });

    it('maps a rejected event (cStat != 135) to CANCEL_REJECTED', async () => {
      const ctx = buildProvider();
      const { document } = await seedCompanyCertificateAndDocument(ctx);
      mockedCallSefazSoapOperation.mockResolvedValue({
        responseBodyXml: RET_ENV_EVENTO_REJECTED,
        rawRequestXml: '<soap request/>',
        rawResponseXml: '<soap response/>',
      });

      const result = await ctx.provider.cancel({
        fiscalDocumentId: document.id,
        protocol: '129260000000001',
        justification: 'Erro no preenchimento do pedido original',
      });

      expect(result.status).toBe('CANCEL_REJECTED');
      if (result.status === 'CANCEL_REJECTED') {
        expect(result.errorMessage).toContain('Duplicidade de Evento');
      }
    });

    it('throws FiscalDocumentNotFoundError when the document does not exist', async () => {
      const ctx = buildProvider();

      await expect(
        ctx.provider.cancel({
          fiscalDocumentId: randomUUID(),
          protocol: '123',
          justification: 'x'.repeat(20),
        }),
      ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
    });
  });

  describe('correctionLetter', () => {
    it('builds+signs the envEvento SOAP request and maps cStat=135 to CORRECTION_LETTER_AUTHORIZED', async () => {
      const ctx = buildProvider();
      const { document } = await seedCompanyCertificateAndDocument(ctx);
      mockedCallSefazSoapOperation.mockResolvedValue({
        responseBodyXml: RET_ENV_EVENTO_AUTHORIZED,
        rawRequestXml: '<soap request/>',
        rawResponseXml: '<soap response/>',
      });

      const result = await ctx.provider.correctionLetter({
        fiscalDocumentId: document.id,
        sequence: 1,
        correctionText: 'Corrige o número do pedido de compra informado',
      });

      expect(result.status).toBe('CORRECTION_LETTER_AUTHORIZED');
      if (result.status === 'CORRECTION_LETTER_AUTHORIZED') {
        expect(result.protocol).toBe('129260000000099');
      }

      const callArgs = mockedCallSefazSoapOperation.mock.calls[0][0];
      expect(callArgs.requestBodyXml).toContain('<tpEvento>110110</tpEvento>');
      expect(callArgs.requestBodyXml).toContain(
        'Corrige o número do pedido de compra informado',
      );
    });

    it('maps a rejected event (cStat != 135) to REJECTED', async () => {
      const ctx = buildProvider();
      const { document } = await seedCompanyCertificateAndDocument(ctx);
      mockedCallSefazSoapOperation.mockResolvedValue({
        responseBodyXml: RET_ENV_EVENTO_REJECTED,
        rawRequestXml: '<soap request/>',
        rawResponseXml: '<soap response/>',
      });

      const result = await ctx.provider.correctionLetter({
        fiscalDocumentId: document.id,
        sequence: 1,
        correctionText: 'Corrige o número do pedido de compra informado',
      });

      expect(result.status).toBe('REJECTED');
    });
  });

  describe('inutilize', () => {
    it('builds+signs the inutNFe SOAP request and maps cStat=102 to INUTILIZED', async () => {
      const ctx = buildProvider();
      const { company } = await seedCompanyAndCertificate(ctx);
      mockedCallSefazSoapOperation.mockResolvedValue({
        responseBodyXml: RET_INUT_NFE_AUTHORIZED,
        rawRequestXml: '<soap request/>',
        rawResponseXml: '<soap response/>',
      });

      const result = await ctx.provider.inutilize({
        companyId: company.id,
        environment: 'HOMOLOGATION',
        series: '1',
        numberStart: '100',
        numberEnd: '110',
        model: '55',
        justification: 'Faixa reservada e não utilizada no período',
      });

      expect(result.status).toBe('INUTILIZED');
      if (result.status === 'INUTILIZED') {
        expect(result.protocol).toBe('129260000000199');
      }

      const callArgs = mockedCallSefazSoapOperation.mock.calls[0][0];
      expect(callArgs.operation).toBe('nfeInutilizacaoNF');
      expect(callArgs.requestBodyXml).toContain('<inutNFe');
      expect(callArgs.requestBodyXml).toContain('<nNFIni>100</nNFIni>');
      expect(callArgs.requestBodyXml).toContain('<nNFFin>110</nNFFin>');
      expect(callArgs.requestBodyXml).toContain('<Signature');
    });

    it('maps a rejected inutilization (cStat != 102) to REJECTED', async () => {
      const ctx = buildProvider();
      const { company } = await seedCompanyAndCertificate(ctx);
      mockedCallSefazSoapOperation.mockResolvedValue({
        responseBodyXml: RET_INUT_NFE_REJECTED,
        rawRequestXml: '<soap request/>',
        rawResponseXml: '<soap response/>',
      });

      const result = await ctx.provider.inutilize({
        companyId: company.id,
        environment: 'HOMOLOGATION',
        series: '1',
        numberStart: '100',
        numberEnd: '110',
        model: '55',
        justification: 'Faixa reservada e não utilizada no período',
      });

      expect(result.status).toBe('REJECTED');
    });

    it('throws CompanyNotFoundError when the company does not exist', async () => {
      const ctx = buildProvider();

      await expect(
        ctx.provider.inutilize({
          companyId: randomUUID(),
          environment: 'HOMOLOGATION',
          series: '1',
          numberStart: '100',
          numberEnd: '110',
          model: '55',
          justification: 'Faixa reservada e não utilizada no período',
        }),
      ).rejects.toThrow();
    });
  });
});
