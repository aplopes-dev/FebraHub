import { describe, expect, it } from 'vitest';
import {
  budgetLocationTypeFromUiType,
  defaultLocationUiTypeForClinicStrand,
  defaultLocationUiTypeForSpecialtyName,
  locationUiTypeRequiresSelection,
  locationUiTypeUsesHofTab,
  resolveEffectiveLocationUiType,
} from './specialty-location-ui-type';
import { createEmptySystemSpecialties } from './plan-specialty-factories';

describe('specialty-location-ui-type', () => {
  it('maps Harmonização Facial to face_region and HOF tab', () => {
    expect(defaultLocationUiTypeForSpecialtyName('Harmonização Facial')).toBe('face_region');
    expect(locationUiTypeUsesHofTab('face_region')).toBe(true);
  });

  it('defaults unknown specialty to body_region on fisioterapia strand', () => {
    expect(defaultLocationUiTypeForSpecialtyName('Especialidade X', 'fisioterapia')).toBe(
      'body_region',
    );
    expect(defaultLocationUiTypeForClinicStrand('fisioterapia')).toBe('body_region');
    expect(defaultLocationUiTypeForClinicStrand('odontologia')).toBe('tooth');
  });

  it('coerces tooth to body_region on fisioterapia strand', () => {
    expect(
      resolveEffectiveLocationUiType({
        specialtyName: 'Fisioterapia Ortopédica e Traumato-Ortopédica',
        treatmentLocationUiType: 'tooth',
        clinicStrand: 'fisioterapia',
      }),
    ).toBe('body_region');
  });

  it('maps Pilates to session without location selection', () => {
    expect(
      defaultLocationUiTypeForSpecialtyName(
        'Pilates Clínico e Condicionamento',
        'fisioterapia',
      ),
    ).toBe('session');
    expect(locationUiTypeRequiresSelection('session')).toBe(false);
    expect(budgetLocationTypeFromUiType('session')).toBe('session');
  });

  it('defaults unknown specialty to none on nutricao strand', () => {
    expect(defaultLocationUiTypeForSpecialtyName('Especialidade X', 'nutricao')).toBe(
      'none',
    );
    expect(defaultLocationUiTypeForClinicStrand('nutricao')).toBe('none');
  });

  it('coerces tooth to none on nutricao strand', () => {
    expect(
      resolveEffectiveLocationUiType({
        specialtyName: 'Acompanhamento Nutricional',
        treatmentLocationUiType: 'tooth',
        clinicStrand: 'nutricao',
      }),
    ).toBe('none');
  });

  it('createEmptySystemSpecialties assigns locationUiType per strand', () => {
    const odonto = createEmptySystemSpecialties();
    expect(odonto.find((s) => s.name === 'Harmonização Facial')?.locationUiType).toBe(
      'face_region',
    );

    const fisio = createEmptySystemSpecialties('fisioterapia');
    expect(fisio.find((s) => s.name === 'Avaliação e Consultas')?.locationUiType).toBe('none');
    expect(
      fisio.find((s) => s.name === 'Fisioterapia Aquática / Hidroterapia')?.locationUiType,
    ).toBe('session');

    const nutricao = createEmptySystemSpecialties('nutricao');
    expect(nutricao).toHaveLength(4);
    expect(
      nutricao.every((specialty) => specialty.locationUiType === 'none'),
    ).toBe(true);
  });
});
