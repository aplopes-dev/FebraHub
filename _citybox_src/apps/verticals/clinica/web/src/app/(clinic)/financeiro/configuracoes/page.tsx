import { ClinicFinancialSettingsPage } from "@/features/clinic/financeiro/pages/settings-page";
import { RequireFinancialAccess } from "@/features/clinic/financeiro/components/require-financial-access";

export default function ConfiguracoesPage() {
  return (
    <RequireFinancialAccess access="canAccessSettings">
      <ClinicFinancialSettingsPage />
    </RequireFinancialAccess>
  );
}
