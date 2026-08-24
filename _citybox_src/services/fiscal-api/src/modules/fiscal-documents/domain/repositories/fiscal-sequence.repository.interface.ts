import type { FiscalSequence } from '../entities/fiscal-sequence.entity';
import type {
  FiscalDocumentEnvironment,
  FiscalDocumentType,
} from '../entities/fiscal-document.entity';

export type FiscalSequenceKey = {
  companyId: string;
  documentType: FiscalDocumentType;
  series: string;
  environment: FiscalDocumentEnvironment;
};

export abstract class FiscalSequenceRepository {
  abstract findByKey(key: FiscalSequenceKey): Promise<FiscalSequence | null>;
  abstract save(sequence: FiscalSequence): Promise<FiscalSequence>;
  /// Séries de um Emitente, opcionalmente filtradas por ambiente (spec erp/011).
  abstract findAllByCompany(
    companyId: string,
    environment?: FiscalDocumentEnvironment,
  ): Promise<FiscalSequence[]>;
  abstract findById(id: string): Promise<FiscalSequence | null>;
  abstract delete(id: string): Promise<void>;
}
