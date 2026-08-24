import { ClinicTransactionsPage } from "@/features/clinic/financeiro/pages/transactions-page";
import { RequireFinancialAccess } from "@/features/clinic/financeiro/components/require-financial-access";

export default function TransacoesPage() {
  return (
    <RequireFinancialAccess access="canAccessTransactions">
      <ClinicTransactionsPage />
    </RequireFinancialAccess>
  );
}
