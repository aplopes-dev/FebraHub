import {
  FISIOTERAPIA_SPECIALTY_LOCATION_UI,
  ODONTOLOGY_SPECIALTY_LOCATION_UI,
  resolveSeedSpecialtyLocationUiType,
} from './specialty-location-ui-type';
import { FISIOTERAPIA_SPECIALTY_NAMES } from './packs/fisioterapia/specialties';
import { PARTICULAR_SPECIALTIES } from './particular-specialties';

describe('resolveSeedSpecialtyLocationUiType', () => {
  it('maps odontologia Harmonização Facial to face_region', () => {
    expect(resolveSeedSpecialtyLocationUiType('Harmonização Facial', 'odontologia')).toBe(
      'face_region',
    );
  });

  it('maps odontologia Outros to none', () => {
    expect(resolveSeedSpecialtyLocationUiType('Outros', 'odontologia')).toBe('none');
  });

  it('defaults odontologia specialties to tooth', () => {
    expect(resolveSeedSpecialtyLocationUiType('Endodontia', 'odontologia')).toBe('tooth');
  });

  it('covers every fisio seed specialty name', () => {
    for (const name of FISIOTERAPIA_SPECIALTY_NAMES) {
      expect(FISIOTERAPIA_SPECIALTY_LOCATION_UI[name]).toBeDefined();
      expect(resolveSeedSpecialtyLocationUiType(name, 'fisioterapia')).toBe(
        FISIOTERAPIA_SPECIALTY_LOCATION_UI[name],
      );
    }
  });

  it('covers odontologia seed specialty overrides', () => {
    for (const specialty of PARTICULAR_SPECIALTIES) {
      const expected =
        ODONTOLOGY_SPECIALTY_LOCATION_UI[specialty.name] ?? 'tooth';
      expect(resolveSeedSpecialtyLocationUiType(specialty.name, 'odontologia')).toBe(
        expected,
      );
    }
  });
});
