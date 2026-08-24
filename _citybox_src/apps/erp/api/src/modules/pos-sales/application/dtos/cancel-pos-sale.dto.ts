export type CancelPosSaleDto = {
  organizationId: string;
  branchId: string;
  posTerminalId: string;
  saleId: string;
  operatorId: string;
  authorizedByUserId?: string | null;
  reason?: string | null;
};
