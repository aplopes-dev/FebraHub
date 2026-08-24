import type { StockProduct } from "../../types";

export interface WithdrawalFormData {
  quantity: number;
  professionalId: string;
}

export interface StockWithdrawalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: StockProduct | null;
  onConfirm?: (data: WithdrawalFormData) => void;
}
