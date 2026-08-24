import { randomUUID } from 'crypto';
import { ListFiscalDocumentEventsUseCase } from './list-fiscal-document-events.use-case';
import { InMemoryFiscalDocumentRepository } from '../../../tests/in-memory-fiscal-document.repository';
import { InMemoryFiscalEventRepository } from '../../../tests/in-memory-fiscal-event.repository';
import { buildFiscalDocument } from '../../../tests/fixtures/fiscal-document.fixture';
import { FiscalEvent } from '../../../domain/entities/fiscal-event.entity';
import { FiscalDocumentNotFoundError } from '../../../domain/errors/fiscal-document-not-found.error';

describe('ListFiscalDocumentEventsUseCase', () => {
  it('returns events for an existing document in chronological order', async () => {
    const documentRepo = new InMemoryFiscalDocumentRepository();
    const eventRepo = new InMemoryFiscalEventRepository();
    const document = buildFiscalDocument();
    await documentRepo.save(document);

    await eventRepo.save(
      FiscalEvent.with(
        {
          fiscalDocumentId: document.id,
          eventType: 'CANCEL',
          sequence: null,
          status: 'AUTHORIZED',
          justification: 'Cliente desistiu da compra',
          correctionText: null,
          protocol: 'cancel-protocol-1',
          requestXmlObjectKey: null,
          responseXmlObjectKey: null,
          // Eventos de NF-e nao pertencem ao Padrao Nacional da NFS-e.
          nationalEventCode: null,
          generatorEnvironment: null,
          replacedByDocumentId: null,
          createdAt: new Date(),
          companyId: null,
          series: null,
          numberRangeStart: null,
          numberRangeEnd: null,
        },
        randomUUID(),
      ),
    );

    const useCase = new ListFiscalDocumentEventsUseCase(
      documentRepo,
      eventRepo,
    );
    const events = await useCase.execute({ fiscalDocumentId: document.id });

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('CANCEL');
  });

  it('throws FiscalDocumentNotFoundError for an unknown document', async () => {
    const documentRepo = new InMemoryFiscalDocumentRepository();
    const eventRepo = new InMemoryFiscalEventRepository();
    const useCase = new ListFiscalDocumentEventsUseCase(
      documentRepo,
      eventRepo,
    );

    await expect(
      useCase.execute({
        fiscalDocumentId: '00000000-0000-4000-8000-000000000000',
      }),
    ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
  });
});
