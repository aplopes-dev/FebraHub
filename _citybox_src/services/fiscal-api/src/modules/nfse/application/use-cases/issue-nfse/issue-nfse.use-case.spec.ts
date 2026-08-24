import { randomUUID } from 'crypto';
import {
  baseIssueNfseDto,
  buildIssueNfseTestContext,
  seedIlheusCompanyWithValidCertificate,
} from '../../../tests/fixtures/issue-nfse-test-context';
import { Company } from '../../../../companies/domain/entities/company.entity';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { CertificateNotValidError } from '../../../../nfe/domain/errors/certificate-not-valid.error';
import { MunicipalityNotSupportedError } from '../../../domain/errors/municipality-not-supported.error';
import { NFSE_DPS_XSD_PATH } from '../../../infrastructure/xml/nfse-xsd-path';
import { validateXmlAgainstXsd } from '../../../../../shared/infra/fiscal-xml/xsd-validator';

/// Cobre US2 Acceptance Scenarios 1-2 + FR-002/FR-008/FR-009/FR-013/SC-002/
/// SC-004 — mesma nota de escopo de issue-nfe.use-case.spec.ts (testes no
/// nível de caso de uso, não HTTP/supertest).
describe('IssueNfseUseCase', () => {
  it('issues an AUTHORIZED NFS-e for a valid Ilhéus/BA request, storing the DPS XML (Acceptance Scenario 1, SC-002)', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);

    const document = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    expect(document.status).toBe('AUTHORIZED');
    expect(document.documentType).toBe('NFSE');
    expect(document.provider).toBe('SEFIN_NACIONAL');
    expect(document.protocol).toBe('fake-protocol-123');
    expect(document.accessKey).toMatch(/^DPS[0-9]{42}$/);
    expect(document.xmlObjectKey).not.toBeNull();
    expect(ctx.fakeProvider.issueCallCount).toBe(1);

    const stored = await ctx.objectStorage.get(document.xmlObjectKey!);
    const result = validateXmlAgainstXsd(stored.buffer, NFSE_DPS_XSD_PATH);
    expect(result.valid).toBe(true);
  });

  it('rejects (before calling the provider) a request for a municipality other than Ilhéus/BA (Acceptance Scenario 2)', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx, {
      cityCodeIbge: '3550308', // São Paulo/SP
      nationalNfseEnabled: false,
    });

    await expect(
      ctx.issueNfseUseCase.execute(baseIssueNfseDto(company.id)),
    ).rejects.toBeInstanceOf(MunicipalityNotSupportedError);
    expect(ctx.fakeProvider.issueCallCount).toBe(0);
  });

  /// FR-020: a adesão ao Padrão Nacional é fato cadastral do município, não
  /// constante de código. Um município novo aderir não pode exigir deploy, e um
  /// município aderente sair não pode depender de alguém lembrar de editar uma
  /// lista. As duas direções abaixo são o que prova a guarda ser orientada a
  /// dado — só a primeira passaria com a lista hardcoded.
  it('allows a company outside Ilhéus once its municipality is flagged as adhering', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx, {
      cityCodeIbge: '3550308', // São Paulo/SP, aderente ao Padrão Nacional
      nationalNfseEnabled: true,
    });

    const document = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    expect(document.status).toBe('AUTHORIZED');
    expect(ctx.fakeProvider.issueCallCount).toBe(1);
  });

  it('refuses a company in Ilhéus that is not flagged as adhering', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx, {
      cityCodeIbge: '2913606',
      nationalNfseEnabled: false,
    });

    await expect(
      ctx.issueNfseUseCase.execute(baseIssueNfseDto(company.id)),
    ).rejects.toBeInstanceOf(MunicipalityNotSupportedError);
    expect(ctx.fakeProvider.issueCallCount).toBe(0);
  });

  it('rejects (before calling the provider) a request with an item missing totalValue consistency (SC-004)', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);

    const dto = baseIssueNfseDto(company.id, {
      items: [
        {
          description: 'Consultoria em TI',
          quantity: 2,
          unitValue: 100,
          totalValue: 999, // não confere com quantity * unitValue
          serviceCode: '17.02',
        },
      ],
    });

    await expect(ctx.issueNfseUseCase.execute(dto)).rejects.toBeInstanceOf(
      ValidatorDomainError,
    );
    expect(ctx.fakeProvider.issueCallCount).toBe(0);
  });

  it('returns the same document on a repeated request with the same idempotency key, without calling the provider again (FR-013, SC-007)', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const dto = baseIssueNfseDto(company.id);

    const first = await ctx.issueNfseUseCase.execute(dto);
    const second = await ctx.issueNfseUseCase.execute(dto);

    expect(second.id).toBe(first.id);
    expect(ctx.fakeProvider.issueCallCount).toBe(1);
  });

  it('rejects emission when the company has no valid certificate (FR-008)', async () => {
    const ctx = buildIssueNfseTestContext();
    const company = Company.create({
      storeId: randomUUID(),
      cnpj: '11222333000181',
      legalName: 'Empresa Sem Certificado LTDA',
      tradeName: null,
      stateRegistration: '123456789',
      municipalRegistration: null,
      taxRegime: 'SIMPLES_NACIONAL',
      cityCodeIbge: '2913606',
      // Aderente: sem isto a guarda de FR-020 dispara primeiro e o teste
      // passaria a verificar a regra errada.
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
    });
    await ctx.companyRepository.save(company);

    await expect(
      ctx.issueNfseUseCase.execute(baseIssueNfseDto(company.id)),
    ).rejects.toBeInstanceOf(CertificateNotValidError);
    expect(ctx.fakeProvider.issueCallCount).toBe(0);
  });

  it('marks the document REJECTED with the provider error when the provider rejects the document', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    ctx.fakeProvider.issueResult = {
      status: 'REJECTED',
      errorCode: 'E001',
      errorMessage: 'Rejeitado pelo município (motivo simulado)',
    };

    const document = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    expect(document.status).toBe('REJECTED');
    expect(document.errorCode).toBe('E001');
    expect(document.xmlObjectKey).toBeNull();
  });

  /// Mesmos dois defeitos já corrigidos no NF-e, herdados aqui por simetria de
  /// implementação. Hoje não se manifestam porque o provider municipal lançava
  /// antes de qualquer releitura — passam a quebrar no instante em que um
  /// provider real recarregar o documento por id.
  it('persists the document in SIGNED before transmitting, so the provider can reload it by id', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);

    let captured: { id: string; status: string } | null = null;
    ctx.fakeProvider.onIssue = async (input) => {
      const persisted = await ctx.fiscalDocumentRepository.findById(
        input.fiscalDocumentId,
      );
      captured = persisted
        ? { id: persisted.id, status: persisted.status }
        : null;
    };

    const document = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    expect(captured).toEqual({ id: document.id, status: 'SIGNED' });
  });

  it('resumes transmission when the existing document for the idempotency key is not in a terminal state', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const dto = baseIssueNfseDto(company.id);

    ctx.fakeProvider.issueResult = { status: 'SYNC_REQUIRED' };
    const first = await ctx.issueNfseUseCase.execute(dto);
    expect(first.status).toBe('SYNC_REQUIRED');
    expect(ctx.fakeProvider.issueCallCount).toBe(1);

    // A DPS não chegou a gerar NFS-e no órgão (`E2404` na consulta real), então
    // retransmitir é o certo — não há nota para duplicar.
    ctx.fakeProvider.consultResult = {
      status: 'REJECTED',
      errorMessage: 'Não foi gerada uma NFS-e com o identificador informado',
    };
    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      protocol: 'protocolo-retomada',
      accessKey: undefined,
      authorizedXml: undefined,
    };
    const second = await ctx.issueNfseUseCase.execute(dto);

    expect(ctx.fakeProvider.issueCallCount).toBe(2);
    expect(second.id).toBe(first.id);
    expect(second.number).toBe(first.number);
    expect(second.status).toBe('AUTHORIZED');
  });

  /// T023: a retomada perigosa é a que ocorre depois de a transmissão anterior
  /// ter chegado ao órgão e a resposta ter se perdido. Retransmitir ali emite
  /// uma segunda nota — dano fiscal real, não erro de aplicação. `GET /dps/{id}`
  /// existe exatamente para desfazer essa ambiguidade antes de agir.
  it('adopts the outcome already recorded at the tax authority instead of transmitting again', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const dto = baseIssueNfseDto(company.id);

    ctx.fakeProvider.issueResult = { status: 'SYNC_REQUIRED' };
    const first = await ctx.issueNfseUseCase.execute(dto);
    expect(ctx.fakeProvider.issueCallCount).toBe(1);

    // O órgão já tinha a NFS-e autorizada — nossa resposta é que se perdeu.
    ctx.fakeProvider.consultResult = {
      status: 'AUTHORIZED',
      protocol: 'protocolo-ja-existente',
    };

    const second = await ctx.issueNfseUseCase.execute(dto);

    // A asserção que importa: nenhuma segunda transmissão.
    expect(ctx.fakeProvider.issueCallCount).toBe(1);
    expect(second.id).toBe(first.id);
    expect(second.status).toBe('AUTHORIZED');
    expect(second.protocol).toBe('protocolo-ja-existente');
  });

  /// Antes da autorização `accessKey` guarda o `Id` da DPS; **depois** tem de
  /// guardar a chave da NFS-e, que é o identificador do documento gerado.
  ///
  /// Ficava só em `protocol`, e isso quebrava duas coisas silenciosamente:
  ///  - a substituição montava o `Id` do evento `e105102` com o id da DPS, e o
  ///    Sefin recusava com `E1235` (pattern de `TSIdPedRegEvt`);
  ///  - `consult` roteia por `accessKey.startsWith('DPS')`, então nunca chegava
  ///    a consultar `/nfse/{chave}` — sempre caía em `/dps/{id}`.
  it('replaces the DPS id with the NFS-e access key once authorized', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);

    const CHAVE_NFSE = '2'.repeat(50);
    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      accessKey: CHAVE_NFSE,
      protocol: CHAVE_NFSE,
    };

    const emitida = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    expect(emitida.accessKey).toBe(CHAVE_NFSE);
    expect(emitida.accessKey?.startsWith('DPS')).toBe(false);
  });

  /// Sem chave devolvida pelo órgão, o id da DPS permanece — é melhor que
  /// `null`, porque ainda identifica o documento para `GET /dps/{id}`.
  it('keeps the DPS id when the tax authority returns no access key', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);

    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      protocol: 'protocolo-sem-chave',
    };

    const emitida = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    expect(emitida.accessKey?.startsWith('DPS')).toBe(true);
  });
});
