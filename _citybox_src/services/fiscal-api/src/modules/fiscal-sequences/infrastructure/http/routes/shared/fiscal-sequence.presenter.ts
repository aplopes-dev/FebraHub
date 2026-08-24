import type { FiscalSequence } from '../../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import { displaySeries } from '../../../../domain/series-format';

function toResponse(sequence: FiscalSequence) {
  return {
    id: sequence.id,
    documentType: sequence.documentType,
    series: displaySeries(sequence.series),
    // bigint não serializa em JSON — número atual como string.
    currentNumber: sequence.currentNumber.toString(),
    environment: sequence.environment,
    active: sequence.active,
  };
}

export class FiscalSequencePresenter {
  static toHttp(sequence: FiscalSequence) {
    return { data: toResponse(sequence) };
  }

  static toListHttp(sequences: FiscalSequence[]) {
    return { data: sequences.map(toResponse) };
  }
}
