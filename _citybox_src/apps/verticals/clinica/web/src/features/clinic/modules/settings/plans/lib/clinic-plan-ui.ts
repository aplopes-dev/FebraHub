import type { ClinicPlanStatus } from '../types/clinic-plan';

export const CLINIC_PLAN_STATUS_LABEL: Record<ClinicPlanStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
};

export const CLINIC_PLAN_STATUS_BADGE_CLASS: Record<ClinicPlanStatus, string> = {
  active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  inactive: 'border-border bg-muted text-muted-foreground',
};

export const CLINIC_PLAN_DEFAULT_BADGE_CLASS =
  'border-primary/30 bg-primary/10 text-primary text-[10px] font-medium';
