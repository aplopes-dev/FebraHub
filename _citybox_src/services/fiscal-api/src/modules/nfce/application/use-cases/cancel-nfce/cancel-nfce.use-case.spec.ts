import { randomUUID } from 'crypto';
import { CancelNfeUseCase } from '../../../../nfe/application/use-cases/cancel-nfe/cancel-nfe.use-case';
import { InMemoryFiscalDocumentRepository } from '../../../../fiscal-documents/tests/in-memory-fiscal-document.repository';
import { InMemoryFiscalEventRepository } from '../../../../fiscal-documents/tests/in-memory-fiscal-event.repository';
import { InMemoryProviderRequestRepository } from '../../../../fiscal-documents/tests/in-memory-provider-request.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import { FakeFiscalProvider } from '../../../../nfe/tests/fake-fiscal-provider';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { NfeCancelDeadlineConflictError } from '../../../../nfe/domain/errors/nfe-cancel-deadline-expired.error';
import type { FiscalDocumentType } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';

const MINUTE = 60 * 1000;

/// ⚠️ Esta suíte testa `CancelNfeUseCase`, **não** um `CancelNfceUseCase`.
///
/// Não existe caso de uso próprio de cancelamento de cupom, e é deliberado: o
/// de NF-e já resolve prazo por `document.documentType` e transporte por
/// `document.provider`, então duplicá-lo daria duas máquinas de estado para
/// manter em sincronia — e a divergência entre elas só apareceria com uma nota
/// presa em estado inconsistente.
///
/// O arquivo vive sob `modules/nfce/` porque o que ele cobre é o
/// comportamento **do cupom**: a janela de 30 minutos e a ausência de
/// substituição. Se alguém um dia criar o caso de uso paralelo, estes testes
/// são o que prova que não era preciso.
describe('Cancelamento de NFC-e (US4, FR-008)', () => {
  let documents: InMemoryFiscalDocumentRepository;
  let provider: FakeFiscalProvider;
  let useCase: CancelNfeUseCase;

  beforeEach(() => {
    documents = new InMemoryFiscalDocumentRepository();
    provider = new FakeFiscalProvider();
    const factory = new FiscalProviderFactory();
    factory.register('SEFAZ_BA_NFE', provider);

    useCase = new CancelNfeUseCase(
      documents,
      new InMemoryFiscalEventRepository(),
      new InMemoryProviderRequestRepository(),
      factory,
      new InMemoryObjectStorage(),
    );
  });

  /// `rejects.toMatchObject` com `expect.stringContaining` devolve `any` e o
  /// lint reprova. Ler a mensagem do erro capturado é mais direto de qualquer
  /// forma, e o tipo fica explícito.
  async function externalMessageOf(promise: Promise<unknown>): Promise<string> {
    try {
      await promise;
      throw new Error('esperava rejeição, mas a promessa resolveu');
    } catch (error: unknown) {
      if (error instanceof NfeCancelDeadlineConflictError) {
        return error.externalMessage;
      }
      throw error;
    }
  }

  async function seedAuthorized(
    minutesAgo: number,
    documentType: FiscalDocumentType = 'NFCE',
  ): Promise<FiscalDocument> {
    const now = new Date();
    const document = FiscalDocument.with(
      {
        companyId: randomUUID(),
        customerId: null,
        documentType,
        provider: 'SEFAZ_BA_NFE',
        environment: 'HOMOLOGATION',
        status: 'AUTHORIZED',
        sourceSystem: 'pdv',
        externalReference: randomUUID(),
        idempotencyKey: randomUUID(),
        series: '1',
        number: '1',
        rpsSeries: null,
        rpsNumber: null,
        accessKey: '29260811444777000161650010000000011000000015',
        verificationCode: null,
        protocol: '129261000154552',
        totalAmount: 85,
        xmlObjectKey: null,
        errorCode: null,
        errorMessage: null,
        issuedAt: new Date(now.getTime() - minutesAgo * MINUTE),
        authorizedAt: new Date(now.getTime() - minutesAgo * MINUTE),
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
      },
      randomUUID(),
    );
    await documents.save(document);
    return document;
  }

  it('cancela dentro dos 30 minutos', async () => {
    const document = await seedAuthorized(10);

    const result = await useCase.execute({
      fiscalDocumentId: document.id,
      justification: 'Cancelamento por erro de digitacao no caixa',
    });

    expect(result.status).toBe('CANCEL_AUTHORIZED');
  });

  it('⚠️ recusa aos 31 minutos — o prazo do cupom NAO e o da NF-e', async () => {
    // A janela do cupom é de 30 MINUTOS. Copiar as 24h da NF-e deixaria
    // cancelar muito além do prazo legal, e a SEFAZ recusaria tarde — depois
    // de o operador achar que deu certo.
    const document = await seedAuthorized(31);

    await expect(
      useCase.execute({
        fiscalDocumentId: document.id,
        justification: 'Cancelamento por erro de digitacao no caixa',
      }),
    ).rejects.toBeInstanceOf(NfeCancelDeadlineConflictError);
  });

  it('a NF-e continua com 24 horas', async () => {
    // Regressão no sentido inverso: o prazo curto do cupom não pode ter
    // encurtado o da nota, que já está em produção.
    const document = await seedAuthorized(60, 'NFE');

    const result = await useCase.execute({
      fiscalDocumentId: document.id,
      justification: 'Cancelamento por erro de digitacao',
    });

    expect(result.status).toBe('CANCEL_AUTHORIZED');
  });

  describe('⚠️ a recusa NAO oferece substituicao (T044)', () => {
    it('a mensagem NEGA a substituicao, em vez de so omiti-la', async () => {
      const document = await seedAuthorized(31);

      try {
        await useCase.execute({
          fiscalDocumentId: document.id,
          justification: 'Cancelamento por erro de digitacao no caixa',
        });
        fail('deveria ter lançado');
      } catch (error: unknown) {
        const message = (error as NfeCancelDeadlineConflictError)
          .externalMessage;

        // ⚠️ A primeira versão deste teste proibia a palavra "substitu" na
        // mensagem. Estava errado: a mensagem a usa para **negar** o caminho
        // ("não admite ... nem substituição"), e isso é melhor que o silêncio
        // — preempta o operador procurar um endpoint que a API nunca vai ter.
        //
        // O que T044 proíbe é *oferecer*. Então o teste checa a negação, e não
        // a ausência da palavra: asserção por palavra-chave solta reprovaria a
        // redação mais útil.
        expect(message.toLowerCase()).toContain('não admite');
        expect(message.toLowerCase()).toContain('nem substituição');
        // E diz o que fazer, em vez de só informar que expirou.
        expect(message.toLowerCase()).toContain('comercialmente');
      }
    });

    it('a mensagem diz "Cupom fiscal", nao "NF-e"', async () => {
      const document = await seedAuthorized(31);

      const message = await externalMessageOf(
        useCase.execute({
          fiscalDocumentId: document.id,
          justification: 'Cancelamento por erro de digitacao no caixa',
        }),
      );

      expect(message).toContain('Cupom fiscal');
      expect(message).not.toContain('NF-e');
    });

    it('a da NF-e, essa sim, aponta devolucao ou carta de correcao', async () => {
      const document = await seedAuthorized(25 * 60, 'NFE');

      const message = await externalMessageOf(
        useCase.execute({
          fiscalDocumentId: document.id,
          justification: 'Cancelamento por erro de digitacao',
        }),
      );

      expect(message).toContain('devolução');
    });
  });
});
