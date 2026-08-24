import { FinancialEntryFilterQueryDto } from '../shared/financial-entry.dto';

/**
 * Mesmos filtros da listagem (`ListFinancialEntriesQueryDto`), sem
 * paginação/ordenação/aba — o resumo sempre soma o conjunto filtrado
 * inteiro e sempre ignora lançamentos excluídos (`research.md` D5 de
 * `004-financial-statement`).
 */
export class GetFinancialEntriesSummaryQueryDto extends FinancialEntryFilterQueryDto {}
