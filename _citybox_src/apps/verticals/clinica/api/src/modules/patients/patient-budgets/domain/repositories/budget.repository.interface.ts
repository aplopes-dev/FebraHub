import type { Budget } from '../entities/budget.entity';
import type { BudgetItem } from '../entities/budget-item.entity';
import type { BudgetStatus } from '../entities/budget.entity';

export type BudgetListSortBy =
  | 'date'
  | 'description'
  | 'finalValueCents'
  | 'status';

export type BudgetListCriteria = {
  skip: number;
  take: number;
  search?: string;
  sortBy?: BudgetListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export type BudgetDetail = {
  budget: Budget;
  items: BudgetItem[];
};

export type BudgetListItem = {
  budget: Budget;
  itemsCount: number;
  /** Contrato emitido para este orçamento, se houver. */
  contractEmissionId: string | null;
  /** Status das assinaturas do contrato vinculado (0–2). */
  contractPatientSignatureStatus: 'unsigned' | 'pending' | 'signed' | null;
  contractResponsibleSignatureStatus: 'unsigned' | 'pending' | 'signed' | null;
  contractPatientName: string | null;
  contractResponsibleName: string | null;
  /** ISO — data da assinatura do paciente (ZapSign), se houver. */
  contractPatientSignedAt: string | null;
  /** ISO — data da assinatura da clínica (ZapSign), se houver. */
  contractResponsibleSignedAt: string | null;
};

export type BudgetStatusUpdateMeta = {
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
};

export type OpenRejectedBudgetRow = {
  id: string;
  date: Date;
  patientId: string;
  patientName: string;
  description: string;
  status: 'pending' | 'rejected';
  finalValueCents: number;
};

export type OpenRejectedBudgetListCriteria = {
  skip: number;
  take: number;
};

export type OpenRejectedBudgetListResult = {
  items: OpenRejectedBudgetRow[];
  total: number;
  totalValueCents: number;
};

export type ApprovedBudgetInRangeCriteria = {
  /** Inclusive ISO yyyy-MM-dd — matched against approvedAt (fallback budget.date). */
  startIsoDate: string;
  endIsoDate: string;
};

export type ApprovedBudgetWithItems = {
  budget: Budget;
  items: BudgetItem[];
  patientName: string;
};

export type BudgetAnalysisInRangeCriteria = {
  /** Inclusive ISO yyyy-MM-dd — matched against Budget.date (civil day). */
  startIsoDate: string;
  endIsoDate: string;
  /** Filter by Budget.responsibleId when set. */
  responsibleId?: string;
  /**
   * Domain statuses to include. Defaults to pending/approved/rejected
   * (expired excluded).
   */
  statuses?: Array<'pending' | 'approved' | 'rejected'>;
};

export type BudgetAnalysisMeta = {
  professionals: Array<{ id: string; name: string }>;
  years: number[];
};

export abstract class BudgetRepository {
  abstract findById(
    storeId: string,
    patientId: string,
    budgetId: string,
  ): Promise<BudgetDetail | null>;

  abstract findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: BudgetListCriteria,
  ): Promise<BudgetListItem[]>;

  abstract countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<BudgetListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract save(detail: BudgetDetail): Promise<BudgetDetail>;

  abstract delete(
    storeId: string,
    patientId: string,
    budgetId: string,
  ): Promise<void>;

  abstract updateStatus(
    storeId: string,
    patientId: string,
    budgetId: string,
    status: BudgetStatus,
    meta?: BudgetStatusUpdateMeta,
  ): Promise<BudgetDetail | null>;

  abstract sumOpenRejectedBudgetsCents(storeId: string): Promise<number>;

  /** Store-wide budgets with status pending/rejected, newest first, with patient name. */
  abstract listOpenRejectedBudgets(
    storeId: string,
    criteria: OpenRejectedBudgetListCriteria,
  ): Promise<OpenRejectedBudgetListResult>;

  /**
   * Store-wide approved budgets whose sale date (approvedAt date, fallback date)
   * falls in [startIsoDate, endIsoDate], including items and patient name.
   */
  abstract listApprovedBudgetsInRange(
    storeId: string,
    criteria: ApprovedBudgetInRangeCriteria,
  ): Promise<ApprovedBudgetWithItems[]>;

  /** Load budget details (items + patient name) by ids for the store. */
  abstract findManyDetailsByIds(
    storeId: string,
    budgetIds: string[],
  ): Promise<ApprovedBudgetWithItems[]>;

  /**
   * Store-wide budgets in [startIsoDate, endIsoDate] by Budget.date,
   * excluding expired by default; includes items + patient name.
   */
  abstract listBudgetsForAnalysisInRange(
    storeId: string,
    criteria: BudgetAnalysisInRangeCriteria,
  ): Promise<ApprovedBudgetWithItems[]>;

  /** Distinct responsáveis + years with non-expired budgets (for selects). */
  abstract listBudgetAnalysisMeta(storeId: string): Promise<BudgetAnalysisMeta>;
}
