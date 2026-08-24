import type { ClinicStrand } from '@citybox/messaging/clinic-strand';
import type { PlanSpecialtyItem, PlanTreatmentItem } from '../types/clinic-plan-specialty';
import { EMPTY_BRL_CURRENCY } from '../lib/format-brl-currency';
import { defaultPlanSpecialtyNamesForStrand } from './default-clinic-specialty-names';
import { defaultLocationUiTypeForSpecialtyName } from './specialty-location-ui-type';

export function clonePlanSpecialties(specialties: PlanSpecialtyItem[]): PlanSpecialtyItem[] {
  return specialties.map((specialty) => ({
    ...specialty,
    treatments: specialty.treatments.map((treatment) => ({ ...treatment })),
  }));
}

/** Cópia para novo plano — descarta IDs persistidos para não reutilizar entidades de outro plano. */
export function clonePlanSpecialtiesForNewPlan(specialties: PlanSpecialtyItem[]): PlanSpecialtyItem[] {
  return specialties.map((specialty) => ({
    id: `specialty-${crypto.randomUUID()}`,
    name: specialty.name,
    locationUiType: specialty.locationUiType,
    treatments: specialty.treatments.map((treatment) => ({
      id: `treatment-${crypto.randomUUID()}`,
      name: treatment.name,
      treatmentValue: treatment.treatmentValue,
      treatmentCost: treatment.treatmentCost,
      enabled: treatment.enabled,
      acceptsFaces: treatment.acceptsFaces,
      locationUiType: treatment.locationUiType ?? null,
    })),
  }));
}

export function createEmptyTreatment(): PlanTreatmentItem {
  return {
    id: `treatment-${crypto.randomUUID()}`,
    name: '',
    treatmentValue: EMPTY_BRL_CURRENCY,
    treatmentCost: EMPTY_BRL_CURRENCY,
    enabled: true,
    acceptsFaces: false,
    locationUiType: null,
  };
}

export function createEmptySpecialty(_existingCount: number): PlanSpecialtyItem {
  return {
    id: `specialty-${crypto.randomUUID()}`,
    name: '',
    locationUiType: 'tooth',
    treatments: [],
  };
}

/**
 * Especialidades do catálogo do sistema sem tratamentos
 * (opção “Não copiar (plano vazio)” na criação do plano).
 */
export function createEmptySystemSpecialties(
  clinicStrand?: ClinicStrand | null,
): PlanSpecialtyItem[] {
  return defaultPlanSpecialtyNamesForStrand(clinicStrand).map((name) => ({
    id: `specialty-${crypto.randomUUID()}`,
    name,
    locationUiType: defaultLocationUiTypeForSpecialtyName(name, clinicStrand),
    treatments: [],
  }));
}
