import type {
  CardContractGrouping,
  CardCutoffPeriod,
  CardDayType,
  CardInstallmentDayType,
} from '../../domain/entities/card-contract.entity';
import type {
  CardContractListTab,
  CardContractTabCounts,
  CardContractWithPaymentMethodCount,
} from '../../domain/repositories/card-contract.repository.interface';

export type CardContractListItem = CardContractWithPaymentMethodCount;

/**
 * Campos que o cliente escreve. Todos opcionais menos `provider`: o contrato
 * nasce com os defaults da operadora e o operador ajusta o que precisa.
 */
export type CardContractWritableDto = {
  provider: string;
  bankAccountId?: string | null;
  description?: string;
  grouping?: CardContractGrouping;
  cutoffPeriod?: CardCutoffPeriod;
  firstPaymentDayType?: CardDayType;
  installmentDayType?: CardInstallmentDayType;
  businessDaysOnly?: boolean;
  depositFeeCents?: number;
  anticipationPeriods?: number;
  anticipationRate?: number;
  allEntriesPaidInContract?: boolean;
  businessDaysDeposit?: boolean;
  active?: boolean;
};

export type CreateCardContractDto = {
  organizationId: string;
} & CardContractWritableDto;

export type UpdateCardContractDto = {
  organizationId: string;
  id: string;
} & CardContractWritableDto;

export type DeleteCardContractDto = {
  organizationId: string;
  id: string;
};

export type RestoreCardContractDto = {
  organizationId: string;
  id: string;
};

export type FindCardContractByIdDto = {
  organizationId: string;
  id: string;
};

export type ListCardContractsDto = {
  organizationId: string;
  search?: string;
  tab?: CardContractListTab;
  page?: number;
  perPage?: number;
};

export type ListCardContractsResult = {
  items: CardContractListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: CardContractTabCounts;
};
