import { randomUUID } from 'crypto';
import { InMemoryFiscalDocumentRepository } from './in-memory-fiscal-document.repository';
import { runFiscalDocumentRepositoryContract } from './fiscal-document-repository.contract';

/// Mesmo contrato exercitado contra o Postgres real em
/// `tests/integration/prisma-fiscal-document.repository.integration.spec.ts`.
describe('InMemoryFiscalDocumentRepository (contrato)', () => {
  runFiscalDocumentRepositoryContract(() => ({
    repository: new InMemoryFiscalDocumentRepository(),
    companyId: randomUUID(),
  }));
});
