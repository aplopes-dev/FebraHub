import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';
import { TransmitPendingNfceUseCase } from './transmit-pending-nfce.use-case';
import { InMemoryContingencyQueueRepository } from '../../../tests/in-memory-contingency-queue.repository';
import { InMemoryFiscalDocumentRepository } from '../../../../fiscal-documents/tests/in-memory-fiscal-document.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import { FakeFiscalProvider } from '../../../../nfe/tests/fake-fiscal-provider';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';

describe('TransmitPendingNfceUseCase (US3, FR-010 a FR-012)', () => {
  const companyId = randomUUID();

  let queue: InMemoryContingencyQueueRepository;
  let documents: InMemoryFiscalDocumentRepository;
  let storage: InMemoryObjectStorage;
  let provider: FakeFiscalProvider;
  let useCase: TransmitPendingNfceUseCase;

  beforeEach(() => {
    queue = new InMemoryContingencyQueueRepository();
    documents = new InMemoryFiscalDocumentRepository();
    storage = new InMemoryObjectStorage();
    provider = new FakeFiscalProvider();

    const factory = new FiscalProviderFactory();
    factory.register('SEFAZ_BA_NFE', provider);

    useCase = new TransmitPendingNfceUseCase(
      queue,
      documents,
      factory,
      storage,
    );

    // O caso de uso loga em ERRO no caminho de FR-012; silenciar mantém a
    // saída do teste legível sem esconder a asserção, que é sobre o estado.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  async function enqueueCupom(minutesAgo: number): Promise<string> {
    const id = randomUUID();
    const key = `${companyId}/nfce/xml/${id}.xml`;
    const at = new Date(Date.now() - minutesAgo * 60_000);

    await storage.put({
      key,
      buffer: Buffer.from('<nfeProc/>', 'utf-8'),
      mimeType: 'application/xml',
    });

    await documents.save(
      FiscalDocument.with(
        {
          companyId,
          customerId: null,
          documentType: 'NFCE',
          provider: 'SEFAZ_BA_NFE',
          environment: 'HOMOLOGATION',
          status: 'SIGNED',
          sourceSystem: 'pdv',
          externalReference: randomUUID(),
          idempotencyKey: randomUUID(),
          series: '1',
          number: '1',
          rpsSeries: null,
          rpsNumber: null,
          accessKey: '29260811444777000161650010000000019000000015',
          verificationCode: null,
          protocol: null,
          totalAmount: 85,
          xmlObjectKey: key,
          errorCode: null,
          errorMessage: null,
          issuedAt: at,
          authorizedAt: null,
          cancelledAt: null,
          createdAt: at,
          updatedAt: at,
        },
        id,
      ),
    );

    await queue.enqueue({
      fiscalDocumentId: id,
      companyId,
      emittedAt: at,
    });
    return id;
  }

  it('transmite os pendentes e marca a fila', async () => {
    await enqueueCupom(30);
    await enqueueCupom(20);

    const result = await useCase.execute({ companyId });

    expect(result.transmitted).toBe(2);
    expect(queue.all().every((e) => e.status === 'TRANSMITTED')).toBe(true);
  });

  it('⚠️ transmite na ORDEM DE EMISSAO', async () => {
    const primeiro = await enqueueCupom(30);
    const segundo = await enqueueCupom(20);
    const terceiro = await enqueueCupom(10);

    await useCase.execute({ companyId });

    // Fora de ordem, a numeração chega quebrada à SEFAZ — e o erro aparece
    // como salto de numeração, muito depois de a causa sumir.
    expect(provider.issuedDocumentIds).toEqual([primeiro, segundo, terceiro]);
  });

  it('⚠️ PARA a fila quando a SEFAZ cai de novo, em vez de pular adiante', async () => {
    const primeiro = await enqueueCupom(30);
    await enqueueCupom(20);
    await enqueueCupom(10);

    // O órgão responde ao primeiro e some.
    provider.failIssueAfter = 1;

    const result = await useCase.execute({ companyId });

    expect(result.transmitted).toBe(1);
    expect(result.remaining).toBe(2);
    // Só o primeiro foi transmitido: pular para o terceiro inverteria a ordem.
    expect(provider.issuedDocumentIds).toEqual([primeiro]);

    const pendentes = queue.all().filter((e) => e.status === 'PENDING');
    expect(pendentes).toHaveLength(2);
  });

  it('⚠️⚠️ nao pula o cupom que falhou para transmitir o seguinte', async () => {
    // O cenário que de fato ameaça a ordem: a SEFAZ recusa conexão no segundo
    // cupom mas atenderia o terceiro. Pular adiante transmitiria 1 e 3, com o
    // 2 pendente — numeração quebrada chegando ao fisco.
    //
    // ⚠️ Este teste existe porque uma mutação (`return` → `continue`) matou
    // apenas UM dos oito testes: com "tudo falha depois do N-ésimo", pular
    // adiante nunca chegava a transmitir fora de ordem, e a garantia ficava
    // sem prova.
    const primeiro = await enqueueCupom(30);
    await enqueueCupom(20);
    await enqueueCupom(10);

    provider.failIssueOnCalls = new Set([1]); // falha só na 2a chamada

    const result = await useCase.execute({ companyId });

    expect(provider.issuedDocumentIds).toEqual([primeiro]);
    expect(result.transmitted).toBe(1);
    expect(result.remaining).toBe(2);
  });

  it('retoma do MESMO ponto no ciclo seguinte', async () => {
    const primeiro = await enqueueCupom(30);
    const segundo = await enqueueCupom(20);

    provider.failIssueAfter = 1;
    await useCase.execute({ companyId });

    // SEFAZ volta.
    provider.failIssueAfter = undefined;
    const result = await useCase.execute({ companyId });

    expect(result.transmitted).toBe(1);
    expect(provider.issuedDocumentIds).toEqual([primeiro, segundo]);
  });

  describe('⚠️ FR-012 — rejeicao apos entrega ao consumidor', () => {
    it('sinaliza EXPLICITAMENTE, em vez de falhar em silencio', async () => {
      const id = await enqueueCupom(30);
      provider.issueResult = {
        status: 'REJECTED',
        errorCode: '539',
        errorMessage: 'Duplicidade de NF-e',
      };

      const result = await useCase.execute({ companyId });

      // O papel está com o cliente. O sistema precisa dizer isso alto.
      expect(result.rejected).toBe(1);
      expect(result.rejectedDocumentIds).toEqual([id]);
      expect(queue.all()[0].status).toBe('REJECTED');
      expect(queue.all()[0].lastError).toBeTruthy();
    });

    it('registra em log de ERRO, nao de aviso', async () => {
      const erro = jest.spyOn(Logger.prototype, 'error');
      await enqueueCupom(30);
      provider.issueResult = { status: 'REJECTED', errorCode: '539' };

      await useCase.execute({ companyId });

      expect(erro).toHaveBeenCalledWith(
        expect.stringContaining('REJEITADO após entrega ao consumidor'),
      );
    });

    it('a rejeicao NAO para a fila — os seguintes seguem', async () => {
      // Rejeição é desfecho, não indisponibilidade: o órgão está no ar, e
      // parar aqui atrasaria cupons que passariam sem problema.
      await enqueueCupom(30);
      await enqueueCupom(20);
      provider.issueResult = { status: 'REJECTED', errorCode: '539' };

      const result = await useCase.execute({ companyId });

      expect(result.rejected).toBe(2);
      expect(result.remaining).toBe(0);
    });
  });

  it('entrada sem XML nao trava a fila inteira', async () => {
    const semXml = randomUUID();
    await documents.save(
      FiscalDocument.with(
        {
          companyId,
          customerId: null,
          documentType: 'NFCE',
          provider: 'SEFAZ_BA_NFE',
          environment: 'HOMOLOGATION',
          status: 'SIGNED',
          sourceSystem: 'pdv',
          externalReference: randomUUID(),
          idempotencyKey: randomUUID(),
          series: '1',
          number: '9',
          rpsSeries: null,
          rpsNumber: null,
          accessKey: null,
          verificationCode: null,
          protocol: null,
          totalAmount: 10,
          xmlObjectKey: null,
          errorCode: null,
          errorMessage: null,
          issuedAt: new Date(Date.now() - 40 * 60_000),
          authorizedAt: null,
          cancelledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        semXml,
      ),
    );
    await queue.enqueue({
      fiscalDocumentId: semXml,
      companyId,
      emittedAt: new Date(Date.now() - 40 * 60_000),
    });
    const bom = await enqueueCupom(30);

    const result = await useCase.execute({ companyId });

    // A entrada defeituosa fica registrada e o resto anda: travar a fila por
    // causa dela deixaria cupons bons sem transmitir indefinidamente.
    expect(result.transmitted).toBe(1);
    expect(provider.issuedDocumentIds).toEqual([bom]);
    expect(queue.all()[0].attempts).toBe(1);
  });
});
