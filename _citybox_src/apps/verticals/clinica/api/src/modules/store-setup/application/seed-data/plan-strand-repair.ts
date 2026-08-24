import type { ClinicStrand } from '@citybox/messaging';
import type { ClinicSeedPack } from './packs/types';
import { FISIOTERAPIA_SPECIALTY_NAMES } from './packs/fisioterapia/specialties';
import { NUTRICAO_SPECIALTY_NAMES } from './packs/nutricao/specialties';

/** Marcador inequívoco de seed odontológico no plano Particular. */
const ODONTOLOGY_SEED_MARKERS = [
  'Cirurgia',
  'Dentística',
  'Endodontia',
  'Harmonização Facial',
] as const;

const FISIO_SEED_MARKER = FISIOTERAPIA_SPECIALTY_NAMES[0];
const NUTRICAO_SEED_MARKER = NUTRICAO_SPECIALTY_NAMES[0];

export function expectedPlanSpecialtyNames(
  pack: ClinicSeedPack,
): readonly string[] {
  return pack.plan.specialties.map((specialty) => specialty.name);
}

/** Plano seedado bate com o pack da vertente (ordem + nomes). */
export function planSpecialtyNamesMatchPack(
  existingNames: readonly string[],
  pack: ClinicSeedPack,
): boolean {
  const expected = expectedPlanSpecialtyNames(pack);
  if (existingNames.length !== expected.length) return false;
  return expected.every((name, index) => existingNames[index] === name);
}

/** Detecta plano Particular da vertente errada (ex.: fisio com Cirurgia/Dentística). */
export function planNeedsStrandRepair(
  existingNames: readonly string[],
  strand: ClinicStrand,
  pack: ClinicSeedPack,
): boolean {
  if (existingNames.length === 0) return false;
  if (planSpecialtyNamesMatchPack(existingNames, pack)) return false;

  const names = new Set(existingNames);

  if (strand === 'fisioterapia') {
    const hasOdontoMarker = ODONTOLOGY_SEED_MARKERS.some((marker) =>
      names.has(marker),
    );
    const missingFisioMarker = !names.has(FISIO_SEED_MARKER);
    return hasOdontoMarker || missingFisioMarker;
  }

  if (strand === 'nutricao') {
    const hasOdontoMarker = ODONTOLOGY_SEED_MARKERS.some((marker) =>
      names.has(marker),
    );
    const hasFisioMarker = names.has(FISIO_SEED_MARKER);
    const missingNutricaoMarker = !names.has(NUTRICAO_SEED_MARKER);
    return hasOdontoMarker || hasFisioMarker || missingNutricaoMarker;
  }

  return (
    (names.has(FISIO_SEED_MARKER) || names.has(NUTRICAO_SEED_MARKER)) &&
    !names.has(ODONTOLOGY_SEED_MARKERS[0])
  );
}
