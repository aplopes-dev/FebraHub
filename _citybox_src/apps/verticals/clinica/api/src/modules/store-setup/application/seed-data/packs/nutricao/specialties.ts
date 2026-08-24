import type {
  ClinicSeedSpecialty,
  ClinicSeedTreatment,
} from '../../particular-specialties';

/** Linha comercial canônica (mesmo nome da especialidade) — não é catálogo de procedimentos. */
function commercialLine(name: string): ClinicSeedTreatment {
  return { name, acceptsFaces: false, valueCents: 0, costCents: 0 };
}

export const NUTRICAO_SPECIALTY_NAMES = [
  'Acompanhamento Nutricional',
  'Avaliação Nutricional Preventiva',
  'Elaboração de Dietas Vegetarianas e Veganas',
  'Planejamento para Deficiências Nutricionais',
] as const;

export const NUTRICAO_SPECIALTIES: ClinicSeedSpecialty[] =
  NUTRICAO_SPECIALTY_NAMES.map((name) => ({
    name,
    treatments: [commercialLine(name)],
  }));
