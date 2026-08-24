import type { TemplateAggregate } from '../../../../application/dtos/anamnesis.dto';
import { toTemplateResponse } from '../../mappers/anamnesis.mapper';

export class TemplatePresenter {
  static toHttp(aggregate: TemplateAggregate) {
    return { data: toTemplateResponse(aggregate) };
  }
}

export class TemplateListPresenter {
  static toHttp(aggregates: TemplateAggregate[]) {
    return { data: aggregates.map((item) => toTemplateResponse(item)) };
  }
}
