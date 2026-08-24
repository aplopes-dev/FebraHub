/**
 * Nomes canônicos das especialidades do plano Particular (seed da clínica).
 * Espelha os packs em `clinica-api` — manter alinhado ao seed por vertente.
 */
import type { ClinicStrand } from '@citybox/messaging/clinic-strand';

export const DEFAULT_ODONTOLOGY_PLAN_SPECIALTY_NAMES = [
  'Cirurgia',
  'Dentística',
  'Disfunção Temporomandibular (DTM)',
  'Endodontia',
  'Estética',
  'Harmonização Facial',
  'Implantodontia',
  'Odontopediatria',
  'Ortodontia',
  'Ortopedia Funcional',
  'Outros',
  'Periodontia',
  'Prevenção',
  'Prótese',
  'Radiologia',
  'Testes e Exames Laboratoriais',
  'Urgência',
] as const;

export const DEFAULT_FISIOTERAPIA_PLAN_SPECIALTY_NAMES = [
  'Avaliação e Consultas',
  'Fisioterapia Ortopédica e Traumato-Ortopédica',
  'Terapia Manual e Procedimentos Invasivos',
  'Fisioterapia Neurológica',
  'Fisioterapia Esportiva',
  'RPG e Reeducação Postural',
  'Fisioterapia Pélvica e Saúde da Mulher',
  'Fisioterapia Cardiorrespiratória',
  'Fisioterapia Geriátrica',
  'DTM e Fisioterapia Orofacial',
  'Drenagem Linfática e Fisioterapia Vascular',
  'Fisioterapia Dermatofuncional',
  'Fisioterapia Pediátrica',
  'Fisioterapia do Trabalho / Ergonomia',
  'Pilates Clínico e Condicionamento',
  'Fisioterapia Aquática / Hidroterapia',
  'Confecção e Adaptação de Órteses',
  'Avaliação Física e Exames Funcionais',
  'Testes e Avaliações Especializadas',
  'Prevenção e Educação em Saúde',
  'Urgência / Atendimento Agudo',
] as const;

export const DEFAULT_NUTRICAO_PLAN_SPECIALTY_NAMES = [
  'Acompanhamento Nutricional',
  'Avaliação Nutricional Preventiva',
  'Elaboração de Dietas Vegetarianas e Veganas',
  'Planejamento para Deficiências Nutricionais',
] as const;

/** @deprecated Prefer `defaultPlanSpecialtyNamesForStrand`. */
export const DEFAULT_CLINIC_PLAN_SPECIALTY_NAMES =
  DEFAULT_ODONTOLOGY_PLAN_SPECIALTY_NAMES;

export function defaultPlanSpecialtyNamesForStrand(
  clinicStrand?: ClinicStrand | null,
): readonly string[] {
  if (clinicStrand === 'fisioterapia') {
    return DEFAULT_FISIOTERAPIA_PLAN_SPECIALTY_NAMES;
  }
  if (clinicStrand === 'nutricao') {
    return DEFAULT_NUTRICAO_PLAN_SPECIALTY_NAMES;
  }
  return DEFAULT_ODONTOLOGY_PLAN_SPECIALTY_NAMES;
}
