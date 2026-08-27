export type ContractStatus = {
  id: string;
  name: string;
  /** Tokens de badge (secondary, outline, destructive…). */
  variant: "default" | "secondary" | "outline" | "destructive";
  active: boolean;
  sortOrder: number;
};

export type ContractStatusFormValues = {
  name: string;
  variant: ContractStatus["variant"];
  active: boolean;
};

export type ContractStatusListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type ContractStatusListResult = {
  data: ContractStatus[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};
