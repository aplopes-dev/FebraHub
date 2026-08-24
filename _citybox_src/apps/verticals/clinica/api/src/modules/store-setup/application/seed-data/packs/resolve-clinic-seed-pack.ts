import {
  DEFAULT_CLINIC_STRAND,
  type ClinicStrand,
  resolveClinicStrand,
} from '@citybox/messaging';
import type { ClinicSeedPack } from './types';
import { ODONTOLOGIA_CLINIC_SEED_PACK } from './odontologia';
import { FISIOTERAPIA_CLINIC_SEED_PACK } from './fisioterapia';
import { NUTRICAO_CLINIC_SEED_PACK } from './nutricao';

const PACKS: Record<ClinicStrand, ClinicSeedPack> = {
  odontologia: ODONTOLOGIA_CLINIC_SEED_PACK,
  fisioterapia: FISIOTERAPIA_CLINIC_SEED_PACK,
  nutricao: NUTRICAO_CLINIC_SEED_PACK,
};

export function resolveClinicSeedPack(
  raw: string | null | undefined,
): ClinicSeedPack {
  const strand = resolveClinicStrand(raw ?? DEFAULT_CLINIC_STRAND);
  return PACKS[strand];
}

export function resolveClinicSeedPackForStrand(strand: ClinicStrand): ClinicSeedPack {
  return PACKS[strand];
}
