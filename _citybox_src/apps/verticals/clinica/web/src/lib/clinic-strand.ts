import {
  DEFAULT_CLINIC_STRAND,
  getClinicStrandDefinition,
  resolveClinicStrand,
  type ClinicLocationMap,
  type ClinicStrand,
} from '@citybox/messaging/clinic-strand';

export function resolveStoreClinicStrand(
  clinicStrand?: ClinicStrand | string | null,
): ClinicStrand {
  return resolveClinicStrand(clinicStrand ?? DEFAULT_CLINIC_STRAND);
}

export function storeLocationMaps(
  clinicStrand?: ClinicStrand | string | null,
): readonly ClinicLocationMap[] {
  return getClinicStrandDefinition(resolveStoreClinicStrand(clinicStrand)).features
    .locationMaps;
}

export function storeShowsToothMap(clinicStrand?: ClinicStrand | string | null): boolean {
  const maps = storeLocationMaps(clinicStrand);
  return maps.includes('tooth') || maps.includes('face');
}

/** Faces M/O/I/D/V/L/P no dente — só odontologia (config planos + orçamento). */
export function storeSupportsTreatmentToothFaces(
  clinicStrand?: ClinicStrand | string | null,
): boolean {
  return storeLocationMaps(clinicStrand).includes('tooth');
}

export function storeShowsBodyMap(clinicStrand?: ClinicStrand | string | null): boolean {
  return storeLocationMaps(clinicStrand).includes('body');
}

export function storeShowsImc(clinicStrand?: ClinicStrand | string | null): boolean {
  return getClinicStrandDefinition(resolveStoreClinicStrand(clinicStrand)).features.showImc;
}

/** Campo Sessões no orçamento (fisio) — expande N linhas quando N≥2. */
export function storeShowsBudgetTreatmentSessions(
  clinicStrand?: ClinicStrand | string | null,
): boolean {
  return getClinicStrandDefinition(resolveStoreClinicStrand(clinicStrand)).features
    .budgetTreatmentSessions;
}

/** Nutrição: Inicializar (modal Anamnese/Corporal/Plano) em vez de Finalizar. */
export function storeShowsNutritionInitializeFlow(
  clinicStrand?: ClinicStrand | string | null,
): boolean {
  return getClinicStrandDefinition(resolveStoreClinicStrand(clinicStrand)).features
    .showNutritionInitializeFlow;
}

export function storeCouncilTypes(
  clinicStrand?: ClinicStrand | string | null,
): readonly string[] {
  return getClinicStrandDefinition(resolveStoreClinicStrand(clinicStrand)).features
    .councilTypes;
}

/** Label do profissional da vertente (Dentista / Fisioterapeuta / Nutricionista). */
export function storeProfessionalLabel(
  clinicStrand?: ClinicStrand | string | null,
): string {
  return getClinicStrandDefinition(resolveStoreClinicStrand(clinicStrand)).copy
    .roleLabels.professional;
}

/** Placeholder do diagnóstico do tratamento — sem "dente" fora da odontologia. */
export function storeTreatmentDiagnosisPlaceholder(
  clinicStrand?: ClinicStrand | string | null,
): string {
  if (storeShowsToothMap(clinicStrand)) {
    return 'Diagnóstico clínico do dente/região...';
  }
  if (storeShowsBodyMap(clinicStrand)) {
    return 'Diagnóstico clínico da região...';
  }
  return 'Diagnóstico clínico do paciente...';
}

/** Label da coluna de localização por vertente (Dente / Região / Local). */
export function storeLocationColumnLabel(
  clinicStrand?: ClinicStrand | string | null,
): string {
  if (storeShowsToothMap(clinicStrand)) {
    return 'Dente';
  }
  if (storeShowsBodyMap(clinicStrand)) {
    return 'Região';
  }
  return 'Local';
}

export function storeUsesCrefitoOnly(clinicStrand?: ClinicStrand | string | null): boolean {
  const types = storeCouncilTypes(clinicStrand);
  return types.length === 1 && types[0] === 'CREFITO';
}
