import type { SearchEligibleEntriesResult } from '../../../../application/dtos/search-eligible-entries.dto';
import type { Pagination } from '../../../../../../tenancy/application/pagination';

export class EligibleEntryPresenter {
  static toHttpList(
    result: SearchEligibleEntriesResult,
    pagination: Pagination,
  ) {
    return {
      data: result.data.map((item) => ({
        financialEntryId: item.financialEntryId,
        status: item.status,
        eligibleAmountCents: item.eligibleAmountCents,
        dueDate: item.dueDate.toISOString().slice(0, 10),
        competenceDate: item.competenceDate.toISOString().slice(0, 10),
        paidAt: item.paidAt ? item.paidAt.toISOString().slice(0, 10) : null,
        description: item.description,
        categoryName: item.categoryName,
      })),
      meta: {
        total: result.total,
        page: pagination.page,
        perPage: pagination.perPage,
        totalPages: pagination.totalPages,
      },
    };
  }
}
