import { ClinicCashFlowPage } from "@/features/clinic/financeiro/pages/cash-flow-page";
import { RequireFinancialAccess } from "@/features/clinic/financeiro/components/require-financial-access";

export default function FluxoDeCaixaPage() {
  return (
    <RequireFinancialAccess access="canAccessCashFlow">
      <ClinicCashFlowPage />
    </RequireFinancialAccess>
  );
}
