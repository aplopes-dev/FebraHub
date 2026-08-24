import { ClinicCommissionsPage } from '@/features/clinic/financeiro/comissoes/pages/commissions-page';
import { RequireFinancialAccess } from '@/features/clinic/financeiro/components/require-financial-access';

export default function ComissoesPage() {
  return (
    <RequireFinancialAccess access="canAccessCommissions">
      <ClinicCommissionsPage />
    </RequireFinancialAccess>
  );
}
