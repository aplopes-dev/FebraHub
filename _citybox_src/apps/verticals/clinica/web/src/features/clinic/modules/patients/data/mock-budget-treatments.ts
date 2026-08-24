import type { ClinicPlanLocationUiType } from '../../settings/plans/types/clinic-plan-specialty';
import { defaultLocationUiTypeForSpecialtyName } from '../../settings/plans/data/specialty-location-ui-type';

type MockBudgetTreatmentOption = Omit<BudgetTreatmentOption, 'locationUiType'> & {
  locationUiType?: ClinicPlanLocationUiType;
};

export type BudgetTreatmentOption = {
  id: string;
  name: string;
  valueCents: number;
  acceptsFaces: boolean;
  specialtyName: string;
  locationUiType: ClinicPlanLocationUiType;
};

export const MOCK_BUDGET_TREATMENTS_BY_PLAN: Record<string, MockBudgetTreatmentOption[]> = {
  'plan-001': [
    {
      id: 'tr-001',
      name: 'Abertura Coronária',
      valueCents: 30000,
      acceptsFaces: true,
      specialtyName: 'Endodontia',
    },
    {
      id: 'tr-002',
      name: 'Limpeza e profilaxia',
      valueCents: 22000,
      acceptsFaces: false,
      specialtyName: 'Prevenção',
    },
    {
      id: 'tr-003',
      name: 'Restauração em resina',
      valueCents: 35000,
      acceptsFaces: true,
      specialtyName: 'Dentística',
    },
  ],
  'plan-002': [
    {
      id: 'tr-004',
      name: 'Clareamento dental',
      valueCents: 89000,
      acceptsFaces: false,
      specialtyName: 'Dentística',
    },
    {
      id: 'tr-005',
      name: 'Facetas em porcelana',
      valueCents: 180000,
      acceptsFaces: false,
      specialtyName: 'Dentística',
    },
  ],
  'plan-003': [
    {
      id: 'tr-006',
      name: 'Aparelho ortodôntico fixo',
      valueCents: 450000,
      acceptsFaces: false,
      specialtyName: 'Ortodontia',
    },
    {
      id: 'tr-007',
      name: 'Manutenção ortodôntica',
      valueCents: 28000,
      acceptsFaces: false,
      specialtyName: 'Ortodontia',
    },
  ],
  'plan-004': [
    {
      id: 'tr-008',
      name: 'Consulta de avaliação',
      valueCents: 15000,
      acceptsFaces: false,
      specialtyName: 'Outros',
    },
  ],
  'plan-005': [
    {
      id: 'tr-009',
      name: 'Implante unitário',
      valueCents: 320000,
      acceptsFaces: false,
      specialtyName: 'Implantodontia',
    },
    {
      id: 'tr-010',
      name: 'Coroa protética',
      valueCents: 210000,
      acceptsFaces: false,
      specialtyName: 'Prótese',
    },
    {
      id: 'tr-hof-001',
      name: 'Toxina botulínica (botox)',
      valueCents: 150000,
      acceptsFaces: false,
      specialtyName: 'Harmonização Facial',
    },
  ],
};

export function getBudgetTreatmentsForPlan(planId: string): BudgetTreatmentOption[] {
  return (MOCK_BUDGET_TREATMENTS_BY_PLAN[planId] ?? []).map((item) => ({
    ...item,
    locationUiType:
      item.locationUiType ??
      defaultLocationUiTypeForSpecialtyName(item.specialtyName),
  }));
}
