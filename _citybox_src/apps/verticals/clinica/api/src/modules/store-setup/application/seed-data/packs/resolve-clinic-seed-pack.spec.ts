import { FISIOTERAPIA_CLINIC_SEED_PACK } from './fisioterapia';
import { ODONTOLOGIA_CLINIC_SEED_PACK } from './odontologia';
import {
  resolveClinicSeedPack,
  resolveClinicSeedPackForStrand,
} from './resolve-clinic-seed-pack';

describe('resolveClinicSeedPack', () => {
  it('returns odontologia pack by default', () => {
    expect(resolveClinicSeedPack(undefined)).toBe(ODONTOLOGIA_CLINIC_SEED_PACK);
    expect(resolveClinicSeedPack(null)).toBe(ODONTOLOGIA_CLINIC_SEED_PACK);
    expect(resolveClinicSeedPack('')).toBe(ODONTOLOGIA_CLINIC_SEED_PACK);
  });

  it('returns fisioterapia pack for fisioterapia strand', () => {
    expect(resolveClinicSeedPack('fisioterapia')).toBe(FISIOTERAPIA_CLINIC_SEED_PACK);
    expect(resolveClinicSeedPackForStrand('fisioterapia')).toBe(
      FISIOTERAPIA_CLINIC_SEED_PACK,
    );
  });
});

describe('FISIOTERAPIA_CLINIC_SEED_PACK', () => {
  it('seeds treatments with zero value and cost', () => {
    for (const specialty of FISIOTERAPIA_CLINIC_SEED_PACK.plan.specialties) {
      for (const treatment of specialty.treatments) {
        expect(treatment.valueCents).toBe(0);
        expect(treatment.costCents).toBe(0);
        expect(treatment.acceptsFaces).toBe(false);
      }
    }
  });

  it('includes fisio anamnesis templates and demo Avaliação category', () => {
    expect(FISIOTERAPIA_CLINIC_SEED_PACK.anamnesis.templates.length).toBe(4);
    expect(FISIOTERAPIA_CLINIC_SEED_PACK.demo.appointmentCategoryName).toBe(
      'Avaliação',
    );
  });
});
