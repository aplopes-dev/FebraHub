import {
  expectedPlanSpecialtyNames,
  planNeedsStrandRepair,
  planSpecialtyNamesMatchPack,
} from './plan-strand-repair';
import { FISIOTERAPIA_CLINIC_SEED_PACK } from './packs/fisioterapia';
import { NUTRICAO_CLINIC_SEED_PACK } from './packs/nutricao';
import { ODONTOLOGIA_CLINIC_SEED_PACK } from './packs/odontologia';

describe('plan-strand-repair', () => {
  it('confirma pack fisioterapia intacto', () => {
    const names = expectedPlanSpecialtyNames(FISIOTERAPIA_CLINIC_SEED_PACK);
    expect(
      planSpecialtyNamesMatchPack(names, FISIOTERAPIA_CLINIC_SEED_PACK),
    ).toBe(true);
  });

  it('confirma pack nutricao intacto', () => {
    const names = expectedPlanSpecialtyNames(NUTRICAO_CLINIC_SEED_PACK);
    expect(planSpecialtyNamesMatchPack(names, NUTRICAO_CLINIC_SEED_PACK)).toBe(
      true,
    );
  });

  it('detecta plano odontológico em clínica fisioterapia', () => {
    const odontoNames = expectedPlanSpecialtyNames(ODONTOLOGIA_CLINIC_SEED_PACK);
    expect(
      planNeedsStrandRepair(
        odontoNames.slice(0, 5),
        'fisioterapia',
        FISIOTERAPIA_CLINIC_SEED_PACK,
      ),
    ).toBe(true);
  });

  it('detecta plano odontológico em clínica nutrição', () => {
    const odontoNames = expectedPlanSpecialtyNames(ODONTOLOGIA_CLINIC_SEED_PACK);
    expect(
      planNeedsStrandRepair(
        odontoNames.slice(0, 5),
        'nutricao',
        NUTRICAO_CLINIC_SEED_PACK,
      ),
    ).toBe(true);
  });

  it('não repara plano fisioterapia correto', () => {
    const fisioNames = expectedPlanSpecialtyNames(FISIOTERAPIA_CLINIC_SEED_PACK);
    expect(
      planNeedsStrandRepair(
        fisioNames,
        'fisioterapia',
        FISIOTERAPIA_CLINIC_SEED_PACK,
      ),
    ).toBe(false);
  });

  it('não repara plano nutrição correto', () => {
    const names = expectedPlanSpecialtyNames(NUTRICAO_CLINIC_SEED_PACK);
    expect(
      planNeedsStrandRepair(names, 'nutricao', NUTRICAO_CLINIC_SEED_PACK),
    ).toBe(false);
  });
});
