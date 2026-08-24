import { Card, CardContent } from '@citybox/ui/atoms';
import { DashboardPageFrame } from '../components/dashboard-page-frame';

type ClinicDashboardSectionPageProps = {
  sectionName: string;
};

export function ClinicDashboardSectionPage({
  sectionName,
}: ClinicDashboardSectionPageProps) {
  return (
    <DashboardPageFrame>
      <Card>
        <CardContent className="flex min-h-48 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">
            {sectionName} estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </DashboardPageFrame>
  );
}
