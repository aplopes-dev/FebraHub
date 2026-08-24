import { randomUUID } from 'crypto';
import {
  baseIssueNfeDto,
  buildIssueNfeTestContext,
  seedCompanyWithValidCertificate,
} from '../../../tests/fixtures/issue-nfe-test-context';
import { Company } from '../../../../companies/domain/entities/company.entity';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { CertificateNotValidError } from '../../../domain/errors/certificate-not-valid.error';
import { SignedXmlNotFoundError } from '../../../domain/errors/signed-xml-not-found.error';
import { NFE_XSD_PATH } from '../../../infrastructure/xml/nfe-xsd-path';
import { validateXmlAgainstXsd } from '../../../../../shared/infra/fiscal-xml/xsd-validator';

/// Cobre US1 Acceptance Scenarios 1-3 + FR-008/FR-013/SC-001/SC-003/SC-004/SC-007.
/// Nota: são testes no nível do caso de uso (não HTTP/supertest) — as rotas
/// (issue-nfe.route.ts) são wrappers finos sem lógica adicional além da
/// validação de DTO já coberta pelo class-validator.
describe('IssueNfeUseCase', () => {
  it('issues an AUTHORIZED NF-e for a valid request, storing the XML (Acceptance Scenario 1, SC-001)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);

    const document = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    expect(document.status).toBe('AUTHORIZED');
    expect(document.protocol).toBe('fake-protocol-123');
    expect(document.accessKey).toHaveLength(44);
    expect(document.xmlObjectKey).not.toBeNull();
    expect(ctx.fakeProvider.issueCallCount).toBe(1);
  });

  it('rejects (before calling the provider) a request with an item missing totalValue consistency (Acceptance Scenario 2, SC-004)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);

    const dto = baseIssueNfeDto(company.id, {
      items: [
        {
          description: 'Produto Teste',
          ncm: '61091000',
          cfop: '5102',
          quantity: 2,
          unitValue: 100,
          totalValue: 999, // não confere com quantity * unitValue
          csosn: '102',
        },
      ],
    });

    await expect(ctx.issueNfeUseCase.execute(dto)).rejects.toBeInstanceOf(
      ValidatorDomainError,
    );
    expect(ctx.fakeProvider.issueCallCount).toBe(0);
  });

  it('returns the same document on a repeated request with the same idempotency key, without calling the provider again (FR-013, SC-007)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const dto = baseIssueNfeDto(company.id);

    const first = await ctx.issueNfeUseCase.execute(dto);
    const second = await ctx.issueNfeUseCase.execute(dto);

    expect(second.id).toBe(first.id);
    expect(ctx.fakeProvider.issueCallCount).toBe(1);
  });

  it('rejects emission when the company has no valid certificate (FR-008)', async () => {
    const ctx = buildIssueNfeTestContext();
    const company = Company.create({
      storeId: randomUUID(),
      cnpj: '11222333000181',
      legalName: 'Empresa Sem Certificado LTDA',
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
    // Nenhum certificado cadastrado para esta company — repositório fica vazio.

    await expect(
      ctx.issueNfeUseCase.execute(baseIssueNfeDto(company.id)),
    ).rejects.toBeInstanceOf(CertificateNotValidError);
    expect(ctx.fakeProvider.issueCallCount).toBe(0);
  });

  it('stores an XML that validates against the real NF-e 4.00 XSD after authorization (FR-009, SC-003)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);

    const document = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    const stored = await ctx.objectStorage.get(document.xmlObjectKey!);
    const result = validateXmlAgainstXsd(stored.buffer, NFE_XSD_PATH);
    expect(result.valid).toBe(true);
  });

  it('marks the document REJECTED with the provider error when the provider rejects the document', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    ctx.fakeProvider.issueResult = {
      status: 'REJECTED',
      errorCode: 'E001',
      errorMessage: 'Rejeitado pela SEFAZ (motivo simulado)',
    };

    const document = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    expect(document.status).toBe('REJECTED');
    expect(document.errorCode).toBe('E001');
    expect(document.xmlObjectKey).toBeNull();
  });

  /// Regressão: o caso de uso montava o FiscalDocument só em memória e passava
  /// o id para `provider.issue`, mas o SefazBaNfeProvider recarrega o documento
  /// por id (loadDocumentAndCertificate) para resolver o certificado do
  /// Emitente — em produção isso sempre estourava FiscalDocumentNotFoundError.
  /// O FakeFiscalProvider não faz essa releitura, então o defeito passava
  /// despercebido; este teste encoda o contrato explicitamente.
  it('persists the document in SIGNED before transmitting, so the provider can reload it by id', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);

    let captured: { id: string; status: string } | null = null;
    ctx.fakeProvider.onIssue = async (input) => {
      const persisted = await ctx.fiscalDocumentRepository.findById(
        input.fiscalDocumentId,
      );
      captured = persisted
        ? { id: persisted.id, status: persisted.status }
        : null;
    };

    const document = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    expect(captured).toEqual({ id: document.id, status: 'SIGNED' });
  });

  /// D3 — um documento já numerado e assinado que não completou a transmissão
  /// (falha de comunicação com a SEFAZ) fica em SIGNED, que a máquina de
  /// estados de data-model.md define como NÃO terminal. Reenviar a mesma chave
  /// de idempotência tem que retomar a transmissão, não devolver o SIGNED como
  /// resposta final — senão uma indisponibilidade momentânea do órgão fiscal
  /// queima a chave para sempre.
  it('resumes transmission when the existing document for the idempotency key is not in a terminal state (D3)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const dto = baseIssueNfeDto(company.id);

    ctx.fakeProvider.issueResult = { status: 'SYNC_REQUIRED' };
    const first = await ctx.issueNfeUseCase.execute(dto);
    expect(first.status).toBe('SYNC_REQUIRED');
    expect(ctx.fakeProvider.issueCallCount).toBe(1);

    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      protocol: 'protocolo-retomada',
      accessKey: undefined,
      authorizedXml: undefined,
    };
    const second = await ctx.issueNfeUseCase.execute(dto);

    expect(ctx.fakeProvider.issueCallCount).toBe(2);
    expect(second.id).toBe(first.id);
    expect(second.number).toBe(first.number);
    expect(second.status).toBe('AUTHORIZED');
    expect(second.protocol).toBe('protocolo-retomada');
  });

  it('refuses to resume when the signed XML is missing, instead of re-signing under the same number (D3)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const dto = baseIssueNfeDto(company.id);

    ctx.fakeProvider.issueResult = { status: 'SYNC_REQUIRED' };
    const first = await ctx.issueNfeUseCase.execute(dto);
    await ctx.objectStorage.delete(`${company.id}/nfe/signed/${first.id}.xml`);

    await expect(ctx.issueNfeUseCase.execute(dto)).rejects.toThrow(
      SignedXmlNotFoundError,
    );
    expect(ctx.fakeProvider.issueCallCount).toBe(1);
  });

  /// FR-011 exige registrar "o que foi enviado e o que foi recebido". Depois de
  /// corrigir a persistência de `ProviderRequest`, os payloads de status
  /// passaram a ser gravados — mas os envelopes SOAP brutos continuavam sendo
  /// descartados: o cliente os captura (`rawRequestXml`/`rawResponseXml`) e o
  /// provider nunca os repassava. Sem eles a auditoria sabe o desfecho, não o
  /// conteúdo da conversa com o órgão fiscal.
  it('archives the raw request and response envelopes for the audit trail (FR-011)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);

    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      protocol: 'fake-protocol-123',
      rawRequestXml: '<soap:Envelope>pedido</soap:Envelope>',
      rawResponseXml: '<soap:Envelope>resposta</soap:Envelope>',
    };

    const document = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    const requests = await ctx.providerRequestRepository.findByFiscalDocumentId(
      document.id,
    );
    expect(requests).toHaveLength(1);

    const [request] = requests;
    expect(request.requestXmlObjectKey).not.toBeNull();
    expect(request.responseXmlObjectKey).not.toBeNull();

    const storedRequest = await ctx.objectStorage.get(
      request.requestXmlObjectKey!,
    );
    const storedResponse = await ctx.objectStorage.get(
      request.responseXmlObjectKey!,
    );
    expect(storedRequest.buffer.toString('utf-8')).toContain('pedido');
    expect(storedResponse.buffer.toString('utf-8')).toContain('resposta');
  });

  it('does not retransmit when the existing document is already in a terminal state (FR-013, SC-007)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const dto = baseIssueNfeDto(company.id);

    const first = await ctx.issueNfeUseCase.execute(dto);
    expect(first.status).toBe('AUTHORIZED');

    const second = await ctx.issueNfeUseCase.execute(dto);

    expect(ctx.fakeProvider.issueCallCount).toBe(1);
    expect(second.id).toBe(first.id);
  });

  /// Isolamento de tenant (Constituição V). A chave de idempotência é escolhida
  /// pelo ERP; nada impede duas empresas de usarem "PEDIDO-0001". Se a busca
  /// ignorar a empresa, a segunda recebe o **documento fiscal da primeira** —
  /// chave de acesso, protocolo e valores de outro contribuinte.
  it('does not return another company document for the same idempotency key', async () => {
    const ctx = buildIssueNfeTestContext();
    const primeira = await seedCompanyWithValidCertificate(ctx);
    const segunda = await seedCompanyWithValidCertificate(ctx, {
      cnpj: '11444777000161',
    });

    const chave = {
      sourceSystem: 'erp',
      externalReference: 'PEDIDO-0001',
      idempotencyKey: 'mesma-chave',
    };

    const daPrimeira = await ctx.issueNfeUseCase.execute({
      ...baseIssueNfeDto(primeira.company.id),
      ...chave,
    });

    const daSegunda = await ctx.issueNfeUseCase.execute({
      ...baseIssueNfeDto(segunda.company.id),
      ...chave,
    });

    // Documentos distintos, cada um da sua empresa.
    expect(daSegunda.id).not.toBe(daPrimeira.id);
    expect(daSegunda.companyId).toBe(segunda.company.id);
    expect(daPrimeira.companyId).toBe(primeira.company.id);
  });

  /// Numeração fiscal é recurso finito e sequencial: um número reservado e não
  /// usado vira "salto" que o fisco cobra explicação (ou exige inutilização).
  ///
  /// A recusa de PRODUCTION acontecia na TRANSMISSÃO — depois de reservar o
  /// número e persistir o documento. Cada tentativa de produção mal
  /// configurada queimava um número e deixava um `SIGNED` órfão. Verificado no
  /// E2E de 2026-08-07: 7 órfãos, um por execução.
  it('does not consume a fiscal number when the environment is refused', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);

    // Emite uma nota válida para fixar o ponto de partida da numeração.
    const primeira = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    await expect(
      ctx.issueNfeUseCase.execute({
        ...baseIssueNfeDto(company.id),
        externalReference: 'PROD-01',
        idempotencyKey: 'prod-01',
        environment: 'PRODUCTION',
      }),
    ).rejects.toThrow();

    // A próxima nota de homologação continua a sequência sem salto.
    const segunda = await ctx.issueNfeUseCase.execute({
      ...baseIssueNfeDto(company.id),
      externalReference: 'HOMOLOG-02',
      idempotencyKey: 'homolog-02',
    });

    expect(Number(segunda.number)).toBe(Number(primeira.number) + 1);

    // E nenhum documento órfão ficou para trás.
    const todos = await ctx.fiscalDocumentRepository.findAll({
      companyId: company.id,
      skip: 0,
      take: 50,
    });
    expect(todos.filter((d) => d.status === 'SIGNED')).toHaveLength(0);
  });

  /// Spec erp/026, FR-002/FR-003, Acceptance Scenario 2: o contrato de entrada
  /// (`issue-nfe.dto.ts`/`NfeItemDto`) ganhou PIS/COFINS/IPI/ICMS-alíquota por
  /// item — este teste prova que, uma vez aceitos pelo DTO, esses valores
  /// realmente chegam ao XML autorizado (blocos `PIS`/`COFINS`/`IPI` reais, não
  /// o fallback zerado que a emissão manual via Swagger expôs).
  it('propagates PIS/COFINS/IPI resolved per item into the authorized XML (spec erp/026)', async () => {
    const ctx = buildIssueNfeTestContext();
    // A empresa seed padrão é SIMPLES_NACIONAL — e o builder XML sempre emite
    // PIS/COFINS como CST 49 zerado pra item com `csosn` (Preservado byte a
    // byte, comportamento pré-existente e intencional, ver `buildPisCofinsXml`
    // em `nfe-xml.builder.ts`) — PIS/COFINS resolvidos só valem pro Regime
    // Normal (CST). Por isso este teste usa Lucro Presumido + `cst`.
    const { company } = await seedCompanyWithValidCertificate(ctx, {
      taxRegime: 'LUCRO_PRESUMIDO',
    });

    const dto = baseIssueNfeDto(company.id, {
      items: [
        {
          description: 'Produto Tributado',
          ncm: '61091000',
          cfop: '5102',
          quantity: 1,
          unitValue: 100,
          totalValue: 100,
          cst: '00',
          icmsAliquota: 18,
          origem: '0',
          pis: { cst: '01', aliquota: 1.65 },
          cofins: { cst: '01', aliquota: 7.6 },
          ipi: { cst: '50', cEnq: '999', aliquota: 10 },
        },
      ],
    });

    const document = await ctx.issueNfeUseCase.execute(dto);
    expect(document.status).toBe('AUTHORIZED');

    const stored = await ctx.objectStorage.get(document.xmlObjectKey!);
    const xml = stored.buffer.toString('utf-8');

    expect(xml).toContain('<CST>01</CST>'); // PIS/COFINS tributado
    expect(xml).toContain('<pPIS>1.6500</pPIS>');
    expect(xml).toContain('<pCOFINS>7.6000</pCOFINS>');
    expect(xml).toContain('<cEnq>999</cEnq>'); // bloco IPI presente
    expect(xml).toContain('<pIPI>10.0000</pIPI>');
  });

  it('emits one detPag per payment when `payments` is provided (spec erp/029)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);

    const dto = baseIssueNfeDto(company.id, {
      payments: [
        { method: '01', amount: 60 },
        { method: '03', amount: 40 },
      ],
    });

    const document = await ctx.issueNfeUseCase.execute(dto);
    expect(document.status).toBe('AUTHORIZED');

    const stored = await ctx.objectStorage.get(document.xmlObjectKey!);
    const xml = stored.buffer.toString('utf-8');

    expect(xml).toContain('<tPag>01</tPag>');
    expect(xml).toContain('<tPag>03</tPag>');
    expect(xml).toContain('<vPag>60.00</vPag>');
    expect(xml).toContain('<vPag>40.00</vPag>');
  });

  it('falls back to the legacy single tPag when `payments` is absent (non-regression, spec erp/029)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);

    const dto = baseIssueNfeDto(company.id, { paymentMethodCode: '01' });

    const document = await ctx.issueNfeUseCase.execute(dto);
    expect(document.status).toBe('AUTHORIZED');

    const stored = await ctx.objectStorage.get(document.xmlObjectKey!);
    const xml = stored.buffer.toString('utf-8');

    expect(xml).toContain('<tPag>01</tPag>');
    // Um único detPag, não dois — não regride o caminho legado.
    expect(xml.match(/<detPag>/g)?.length).toBe(1);
  });
});
