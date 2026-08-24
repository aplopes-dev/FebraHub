import { Ability, type AbilityClass } from '@casl/ability';
import type { Actions } from './actions.js';

/**
 * Recursos protegidos. Novos subjects = entidades de domínio (não telas).
 * Granular: Stock, Sales, Marketing + ficha (budget/evolution/file/…).
 */
export type Subjects =
  | 'Vertical'
  | 'Settings'
  | 'Team'
  | 'ClinicPlan'
  | 'AnamnesisTemplate'
  | 'ContractModel'
  | 'Category'
  | 'Stock'
  | 'Patient'
  | 'PatientBudget'
  | 'PatientEvolution'
  | 'PatientFile'
  | 'PatientDocument'
  | 'PatientPrescription'
  | 'PatientCertificate'
  | 'PatientAnamnesis'
  | 'PatientTreatment'
  | 'Financial'
  | 'FinancialIncome'
  | 'FinancialExpense'
  | 'FinancialCommission'
  | 'FinancialAccount'
  | 'FinancialCategory'
  | 'Schedule'
  | 'Sales'
  | 'Marketing'
  | 'Dashboard'
  | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;
export type AppAbilityClass = AbilityClass<AppAbility>;
