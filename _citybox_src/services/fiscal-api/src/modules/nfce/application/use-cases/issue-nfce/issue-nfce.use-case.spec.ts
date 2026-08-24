import {
  buildIssueNfceTestContext,
  baseIssueNfceDto,
  seedCompanyReadyForNfce,
  type IssueNfceTestContext,
} from '../../../tests/fixtures/issue-nfce-test-context';
import { CompanyCscNotConfiguredError } from '../../../../companies/domain/errors/company-csc-not-configured.error';
import { ConsumerIdentificationRequiredError } from '../../../domain/errors/consumer-identification-required.error';
import { InvalidNfcePaymentError } from '../../../domain/errors/invalid-nfce-payment.error';
import { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import { SeriesInactiveError } from '../../../../fiscal-sequences/domain/errors/series-inactive.error';
import { randomUUID } from 'crypto';

describe('IssueNfceUseCase (US1)', () => {
  let ctx: IssueNfceTestContext;

  beforeEach(() => {
    ctx = buildIssueNfceTestContext();
  });

  async function currentNumberFor(
    companyId: string,
    documentType: 'NFCE' | 'NFE' = 'NFCE',
  ): Promise<bigint> {
    const sequence = await ctx.fiscalSequenceRepository.findByKey({
      companyId,
      documentType,
      series: '1',
      environment: 'HOMOLOGATION',
    });
    return sequence?.currentNumber ?? 0n;
  }

  describe('emissao', () => {
    it('autoriza uma venda comum', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);

      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id),
      );

      expect(document.status).toBe('AUTHORIZED');
      expect(document.documentType).toBe('NFCE');
      expect(document.accessKey).toHaveLength(44);
    }, 30_000);

    it('recusa emissão em série DESATIVADA com erro específico (spec erp/011, SC-005)', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);

      // Série NFC-e já existente e desativada para a chave usada na emissão.
      await ctx.fiscalSequenceRepository.save(
        FiscalSequence.with(
          {
            companyId: company.id,
            documentType: 'NFCE',
            series: '1',
            currentNumber: 10n,
            environment: 'HOMOLOGATION',
            active: false,
          },
          randomUUID(),
        ),
      );

      // Falha em reserveNextNumber, ANTES de qualquer transmissão à SEFAZ.
      await expect(
        ctx.issueNfceUseCase.execute(baseIssueNfceDto(company.id)),
      ).rejects.toBeInstanceOf(SeriesInactiveError);
    }, 30_000);

    it('⚠️ autoriza venda SEM consumidor identificado', async () => {
      // O caso comum no balcão, e o que mais facilmente se implementa errado
      // por copiar a NF-e, que sempre exigiu destinatário.
      const { company } = await seedCompanyReadyForNfce(ctx);

      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id, { consumer: undefined }),
      );

      expect(document.status).toBe('AUTHORIZED');
      expect(document.customerId).toBeNull();
    }, 30_000);

    it('a chave de acesso declara modelo 65 e emissao normal', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);

      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id),
      );

      const key = document.accessKey!;
      expect(key.slice(20, 22)).toBe('65'); // mod
      expect(key[34]).toBe('1'); // tpEmis
    }, 30_000);

    it('grava o XML transmitido COM o qrCode em infNFeSupl', async () => {
      // ⚠️ A asserção que a spec destaca: o QR Code precisa estar no XML, não
      // só no PDF. Um cupom autorizado sem ele é inconsultável, e nada na
      // resposta denuncia.
      const { company } = await seedCompanyReadyForNfce(ctx);

      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id),
      );

      const stored = await ctx.objectStorage.get(document.xmlObjectKey!);
      const xml = stored.buffer.toString('utf-8');

      expect(xml).toContain('<infNFeSupl>');
      expect(xml).toMatch(/<qrCode>.*\?p=.*<\/qrCode>/);
      expect(xml).toContain('<urlChave>');
    }, 30_000);

    it('o CSC nao aparece no XML transmitido', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);

      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id),
      );
      const stored = await ctx.objectStorage.get(document.xmlObjectKey!);

      expect(stored.buffer.toString('utf-8')).not.toContain(
        'CSC-DE-TESTE-NAO-E-SEGREDO-REAL',
      );
    }, 30_000);

    it('recusa venda sem itens', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);

      await expect(
        ctx.issueNfceUseCase.execute(
          baseIssueNfceDto(company.id, { items: [] }),
        ),
      ).rejects.toThrow();
    }, 30_000);
  });

  /// ⚠️⚠️ T024 — o bloco mais importante desta suíte.
  ///
  /// Numeração fiscal é sequencial e finita. Um número reservado e não usado
  /// vira salto que exige **inutilização junto à SEFAZ** — procedimento
  /// administrativo, não `DELETE`. Esta base já deixou **sete documentos
  /// órfãos** por verificar o ambiente depois de reservar, uma única vez.
  ///
  /// Cada teste aqui prova que uma recusa específica acontece ANTES da
  /// reserva. Acrescentou validação nova ao caso de uso? Acrescente o teste
  /// correspondente aqui — senão a próxima regressão só aparece em produção,
  /// como buraco na numeração.
  describe('⚠️ nenhuma recusa avanca a numeracao (FR-006)', () => {
    it('CSC ausente: recusa sem reservar numero', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx, {
        withCsc: false,
      });
      const antes = await currentNumberFor(company.id);

      await expect(
        ctx.issueNfceUseCase.execute(baseIssueNfceDto(company.id)),
      ).rejects.toBeInstanceOf(CompanyCscNotConfiguredError);

      expect(await currentNumberFor(company.id)).toBe(antes);
    }, 30_000);

    it('limite de valor excedido: recusa sem reservar numero', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);
      const antes = await currentNumberFor(company.id);

      await expect(
        ctx.issueNfceUseCase.execute(
          baseIssueNfceDto(company.id, {
            consumer: undefined,
            items: [
              {
                description: 'Produto Caro',
                ncm: '61091000',
                cfop: '5102',
                quantity: 1,
                unitValue: 999_999,
                totalValue: 999_999,
                csosn: '102',
              },
            ],
            payments: [{ method: '01', amount: 999_999 }],
          }),
        ),
      ).rejects.toBeInstanceOf(ConsumerIdentificationRequiredError);

      expect(await currentNumberFor(company.id)).toBe(antes);
    }, 30_000);

    it('pagamento incoerente: recusa sem reservar numero', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);
      const antes = await currentNumberFor(company.id);

      await expect(
        ctx.issueNfceUseCase.execute(
          baseIssueNfceDto(company.id, {
            payments: [{ method: '03', amount: 10 }], // total é 100
          }),
        ),
      ).rejects.toBeInstanceOf(InvalidNfcePaymentError);

      expect(await currentNumberFor(company.id)).toBe(antes);
    }, 30_000);

    it('producao nao habilitada: recusa sem reservar numero', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);
      // O dublê já recusa PRODUCTION por padrão (`refuseProduction`), de
      // propósito: ele espelha o provider real, que não tem endpoint de
      // produção configurado. Um fake permissivo esconderia exatamente o
      // defeito que este teste procura.
      expect(ctx.fakeProvider.refuseProduction).toBe(true);

      const sequence = await ctx.fiscalSequenceRepository.findByKey({
        companyId: company.id,
        documentType: 'NFCE',
        series: '1',
        environment: 'PRODUCTION',
      });
      const antes = sequence?.currentNumber ?? 0n;

      await expect(
        ctx.issueNfceUseCase.execute(
          baseIssueNfceDto(company.id, { environment: 'PRODUCTION' }),
        ),
      ).rejects.toThrow();

      const depois = await ctx.fiscalSequenceRepository.findByKey({
        companyId: company.id,
        documentType: 'NFCE',
        series: '1',
        environment: 'PRODUCTION',
      });
      expect(depois?.currentNumber ?? 0n).toBe(antes);
    }, 30_000);

    it('venda sem itens: recusa sem reservar numero', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);
      const antes = await currentNumberFor(company.id);

      await expect(
        ctx.issueNfceUseCase.execute(
          baseIssueNfceDto(company.id, { items: [] }),
        ),
      ).rejects.toThrow();

      expect(await currentNumberFor(company.id)).toBe(antes);
    }, 30_000);
  });

  describe('numeracao isolada da NF-e (FR-002)', () => {
    it('emitir cupom NAO avanca a numeracao de NF-e', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);

      await ctx.issueNfceUseCase.execute(baseIssueNfceDto(company.id));
      await ctx.issueNfceUseCase.execute(baseIssueNfceDto(company.id));

      // Sequências distintas por `documentType`. Se o caso de uso reservasse
      // com 'NFE', cupom e nota disputariam a mesma numeração — conflito na
      // SEFAZ, descoberto tarde e caro de desfazer.
      expect(await currentNumberFor(company.id, 'NFCE')).toBe(2n);
      expect(await currentNumberFor(company.id, 'NFE')).toBe(0n);
    }, 30_000);
  });

  describe('idempotencia', () => {
    it('repetir a mesma venda devolve o mesmo documento, sem novo numero', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);
      const dto = baseIssueNfceDto(company.id);

      const primeiro = await ctx.issueNfceUseCase.execute(dto);
      const segundo = await ctx.issueNfceUseCase.execute(dto);

      expect(segundo.id).toBe(primeiro.id);
      expect(await currentNumberFor(company.id)).toBe(1n);
    }, 30_000);
  });
  /// ⚠️ US3 / FR-010 — a venda tem de FECHAR com a SEFAZ fora do ar.
  describe('⚠️ contingencia', () => {
    it('a venda CONCLUI quando a SEFAZ esta inalcancavel', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);
      ctx.fakeProvider.serviceStatus = 'throw';

      // Não lança: o caixa precisa fechar a venda e entregar o cupom.
      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id),
      );

      expect(document.accessKey).toHaveLength(44);
    }, 30_000);

    it('a chave declara tpEmis=9', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);
      ctx.fakeProvider.serviceStatus = 'throw';

      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id),
      );

      // O tipo de emissão ocupa o dígito 35. Se a chave persistida ainda
      // dissesse `1`, ela apontaria para um documento que nunca existirá na
      // SEFAZ.
      expect(document.accessKey![34]).toBe('9');
    }, 30_000);

    it('enfileira para transmissao posterior', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);
      ctx.fakeProvider.serviceStatus = 'throw';

      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id),
      );

      const fila = ctx.contingencyQueue.all();
      expect(fila).toHaveLength(1);
      expect(fila[0].fiscalDocumentId).toBe(document.id);
      expect(fila[0].status).toBe('PENDING');
    }, 30_000);

    it('NAO marca como autorizado — nao ha protocolo', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);
      ctx.fakeProvider.serviceStatus = 'throw';

      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id),
      );

      // O cupom existe e foi entregue, mas o fisco ainda não o recebeu.
      // `AUTHORIZED` aqui seria mentira, e a mentira só apareceria na
      // conciliação.
      expect(document.status).toBe('SIGNED');
      expect(document.protocol).toBeNull();
    }, 30_000);

    it('guarda o XML DE CONTINGENCIA, nao o da emissao normal', async () => {
      const { company } = await seedCompanyReadyForNfce(ctx);
      ctx.fakeProvider.serviceStatus = 'throw';

      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id),
      );

      const stored = await ctx.objectStorage.get(
        `${company.id}/nfce/signed/${document.id}.xml`,
      );
      const xml = stored.buffer.toString('utf-8');

      // É este XML que o dreno retransmite e do qual sai o papel com a faixa.
      // Guardar o da emissão normal transmitiria depois um documento que
      // contradiz o que o consumidor levou.
      expect(xml).toContain('<tpEmis>9</tpEmis>');
      expect(xml).toContain(document.accessKey!);
    }, 30_000);

    it('⚠️ SEFAZ que RESPONDE nao dispara contingencia', async () => {
      // A distinção central: resposta negativa não é ausência de resposta.
      // Ver `domain/contingency/contingency-decision.ts`.
      const { company } = await seedCompanyReadyForNfce(ctx);
      ctx.fakeProvider.serviceStatus = true;

      const document = await ctx.issueNfceUseCase.execute(
        baseIssueNfceDto(company.id),
      );

      expect(document.status).toBe('AUTHORIZED');
      expect(document.accessKey![34]).toBe('1');
      expect(ctx.contingencyQueue.all()).toHaveLength(0);
    }, 30_000);
  });
});
