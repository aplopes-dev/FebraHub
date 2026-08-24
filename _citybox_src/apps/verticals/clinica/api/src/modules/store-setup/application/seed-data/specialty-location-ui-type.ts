import type { ClinicStrand } from '@citybox/messaging';
import type { ClinicPlanLocationUiType } from '../../../clinic-plans/domain/types/clinic-plan-location-ui-type';
import { NUTRICAO_SPECIALTY_NAMES } from './packs/nutricao/specialties';

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
  NUTRICAO_SPECIALTY_NAMES.map((name) => [name, 'none' as const]),
);

export function resolveSeedSpecialtyLocationUiType(
  specialtyName: string,
  strand: ClinicStrand,
): ClinicPlanLocationUiType {
  if (strand === 'nutricao') {
    return NUTRICAO_SPECIALTY_LOCATION_UI[specialtyName] ?? 'none';
  }
  if (strand === 'fisioterapia') {
    return FISIOTERAPIA_SPECIALTY_LOCATION_UI[specialtyName] ?? 'body_region';
  }
  return ODONTOLOGY_SPECIALTY_LOCATION_UI[specialtyName] ?? 'tooth';
}

export {
  ODONTOLOGY_SPECIALTY_LOCATION_UI,
  FISIOTERAPIA_SPECIALTY_LOCATION_UI,
  NUTRICAO_SPECIALTY_LOCATION_UI,
};
