import type { ClinicStrand } from '@citybox/messaging/clinic-strand';
import { DEFAULT_NUTRICAO_PLAN_SPECIALTY_NAMES } from './default-clinic-specialty-names';

export type ClinicPlanLocationUiType =
  | 'tooth'
  | 'face_region'
  | 'body_region'
  | 'session'
  | 'none';

const ODONTOLOGY_SPECIALTY_LOCATION_UI: Readonly<
  Record<string, ClinicPlanLocationUiType>
> = {
  'Harmonização Facial': 'face_region',
  Outros: 'none',
  'Testes e Exames Laboratoriais': 'none',
};

const FISIOTERAPIA_SPECIALTY_LOCATION_UI: Readonly<
  Record<string, ClinicPlanLocationUiType>
> = {
  'Avaliação e Consultas': 'none',
  'Fisioterapia Ortopédica e Traumato-Ortopédica': 'body_region',
  'Terapia Manual e Procedimentos Invasivos': 'body_region',
  'Fisioterapia Neurológica': 'body_region',
  'Fisioterapia Esportiva': 'body_region',
  'RPG e Reeducação Postural': 'body_region',
  'Fisioterapia Pélvica e Saúde da Mulher': 'body_region',
  'Fisioterapia Cardiorrespiratória': 'body_region',
  'Fisioterapia Geriátrica': 'body_region',
  'DTM e Fisioterapia Orofacial': 'body_region',
  'Drenagem Linfática e Fisioterapia Vascular': 'body_region',
  'Fisioterapia Dermatofuncional': 'body_region',
  'Fisioterapia Pediátrica': 'body_region',
  'Fisioterapia do Trabalho / Ergonomia': 'none',
  'Pilates Clínico e Condicionamento': 'session',
  'Fisioterapia Aquática / Hidroterapia': 'session',
  'Confecção e Adaptação de Órteses': 'body_region',
  'Avaliação Física e Exames Funcionais': 'body_region',
  'Testes e Avaliações Especializadas': 'none',
  'Prevenção e Educação em Saúde': 'none',
  'Urgência / Atendimento Agudo': 'body_region',
};

const NUTRICAO_SPECIALTY_LOCATION_UI: Readonly<
  Record<string, ClinicPlanLocationUiType>
> = Object.fromEntries(
  DEFAULT_NUTRICAO_PLAN_SPECIALTY_NAMES.map((name) => [name, 'none' as const]),
);

export function defaultLocationUiTypeForSpecialtyName(
  specialtyName: string,
  clinicStrand?: ClinicStrand | null,
): ClinicPlanLocationUiType {
  if (clinicStrand === 'nutricao') {
    return NUTRICAO_SPECIALTY_LOCATION_UI[specialtyName] ?? 'none';
  }
  if (clinicStrand === 'fisioterapia') {
    return FISIOTERAPIA_SPECIALTY_LOCATION_UI[specialtyName] ?? 'body_region';
  }
  return ODONTOLOGY_SPECIALTY_LOCATION_UI[specialtyName] ?? 'tooth';
}

/** Fallback do mapa no orçamento/tratamento antes de escolher o item do plano. */
export function defaultLocationUiTypeForClinicStrand(
  clinicStrand?: ClinicStrand | null,
): ClinicPlanLocationUiType {
  if (clinicStrand === 'nutricao') return 'none';
  if (clinicStrand === 'fisioterapia') return 'body_region';
  return 'tooth';
}

export function resolveEffectiveLocationUiType(input: {
  specialtyLocationUiType?: ClinicPlanLocationUiType;
  treatmentLocationUiType?: ClinicPlanLocationUiType | null;
  specialtyName: string;
  clinicStrand?: ClinicStrand | null;
}): ClinicPlanLocationUiType {
  let resolved: ClinicPlanLocationUiType;
  if (input.treatmentLocationUiType) {
    resolved = input.treatmentLocationUiType;
  } else if (input.specialtyLocationUiType) {
    resolved = input.specialtyLocationUiType;
  } else {
    resolved = defaultLocationUiTypeForSpecialtyName(
      input.specialtyName,
      input.clinicStrand,
    );
  }

  // Fisioterapia não usa mapa dentário — coerção defensiva se o plano vier com `tooth`.
  if (input.clinicStrand === 'fisioterapia' && resolved === 'tooth') {
    return 'body_region';
  }

  // Nutrição não usa mapa anatômico — coerção defensiva.
  if (
    input.clinicStrand === 'nutricao' &&
    (resolved === 'tooth' ||
      resolved === 'body_region' ||
      resolved === 'face_region')
  ) {
    return 'none';
  }

  return resolved;
}

export function budgetLocationTypeFromUiType(
  locationUiType: ClinicPlanLocationUiType,
): 'tooth' | 'body_region' | 'session' | 'none' {
  if (locationUiType === 'tooth') {
    return 'tooth';
  }
  if (locationUiType === 'session') {
    return 'session';
  }
  if (locationUiType === 'none') {
    return 'none';
  }
  return 'body_region';
}

export function locationUiTypeRequiresSelection(
  locationUiType: ClinicPlanLocationUiType,
): boolean {
  return (
    locationUiType === 'tooth' ||
    locationUiType === 'face_region' ||
    locationUiType === 'body_region'
  );
}

export function locationUiTypeUsesHofTab(
  locationUiType: ClinicPlanLocationUiType,
): boolean {
  return locationUiType === 'face_region';
}
