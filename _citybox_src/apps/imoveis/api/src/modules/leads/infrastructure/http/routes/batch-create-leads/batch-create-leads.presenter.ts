import type { BatchCreateLeadsOutput } from '../../../../application/use-cases/batch-create-leads/batch-create-leads.use-case';

export class BatchCreateLeadsPresenter {
  static toHttp(result: BatchCreateLeadsOutput) {
    return {
      successCount: result.successCount,
      skippedCount: result.skippedCount,
    };
  }
}
