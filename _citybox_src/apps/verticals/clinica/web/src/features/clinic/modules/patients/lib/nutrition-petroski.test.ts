import { describe, expect, it } from 'vitest';
import {
  countValidSkinfoldMeasures,
  createEmptyNutritionBody,
  hasSkinfoldMeasuresForPetroski,
  missingPetroskiSkinfolds,
  skinfoldMedian,
  validatePetroskiBodyForSave,
} from './nutrition-body-composition';
import {
  ageYearsFromBirthDate,
  calculatePetroskiComposition,
} from './nutrition-petroski';
import type { PatientNutritionBody } from '../types/patient-nutrition-body';

function measures(
  first = '',
  second = '',
  third = '',
): PatientNutritionBody['skinfolds']['tricipital'] {
  return { first, second, third };
}

function bodyWithPetroskiMale(): PatientNutritionBody {
  const body = createEmptyNutritionBody();
  return {
    ...body,
    adipometryProtocol: 'petroski',
    weightKg: '80',
    heightCm: '175',
    skinfolds: {
      ...body.skinfolds,
      tricipital: measures('12', '14'),
      subescapular: measures('16', '18'),
      iliaca: measures('20', '22'),
      panturrilha: measures('10', '12'),
    },
  };
}

describe('skinfoldMedian / Petroski measure count', () => {
  it('computes median with one measure (display) but Petroski requires two', () => {
    const one = measures('12,5');
    expect(skinfoldMedian(one)).toBe(12.5);
    expect(countValidSkinfoldMeasures(one)).toBe(1);
    expect(hasSkinfoldMeasuresForPetroski(one)).toBe(false);
  });

  it('accepts two measures for Petroski and averages them', () => {
    const two = measures('10', '14');
    expect(skinfoldMedian(two)).toBe(12);
    expect(hasSkinfoldMeasuresForPetroski(two)).toBe(true);
  });

  it('uses middle value with three measures', () => {
    const three = measures('10', '20', '12');
    expect(skinfoldMedian(three)).toBe(12);
    expect(hasSkinfoldMeasuresForPetroski(three)).toBe(true);
  });

  it('lists required folds missing when only one measure each', () => {
    const body = createEmptyNutritionBody();
    body.adipometryProtocol = 'petroski';
    body.skinfolds.tricipital = measures('12');
    body.skinfolds.subescapular = measures('14', '16');
    body.skinfolds.iliaca = measures('18', '20');
    body.skinfolds.panturrilha = measures('10', '12');

    expect(missingPetroskiSkinfolds(body, 'male')).toEqual(['tricipital']);
  });
});

describe('validatePetroskiBodyForSave', () => {
  it('returns null when protocol is not petroski', () => {
    expect(
      validatePetroskiBodyForSave(createEmptyNutritionBody(), 'male', 30),
    ).toBeNull();
  });

  it('requires age, BMI and two measures per fold', () => {
    const body = bodyWithPetroskiMale();
    expect(validatePetroskiBodyForSave(body, 'male', null)).toMatch(/nascimento/i);
    expect(
      validatePetroskiBodyForSave(
        { ...body, weightKg: '' },
        'male',
        30,
      ),
    ).toMatch(/peso e altura/i);

    body.skinfolds.tricipital = measures('12');
    expect(validatePetroskiBodyForSave(body, 'male', 30)).toMatch(/2 medidas/i);
  });

  it('passes when complete', () => {
    expect(
      validatePetroskiBodyForSave(bodyWithPetroskiMale(), 'male', 30),
    ).toBeNull();
  });
});

describe('calculatePetroskiComposition', () => {
  it('returns null when incomplete', () => {
    expect(
      calculatePetroskiComposition({
        body: createEmptyNutritionBody(),
        gender: 'male',
        ageYears: 30,
      }),
    ).toBeNull();
  });

  it('computes male density, Siri fat % and masses', () => {
    const result = calculatePetroskiComposition({
      body: bodyWithPetroskiMale(),
      gender: 'male',
      ageYears: 30,
    });

    expect(result).not.toBeNull();
    expect(result!.medians).toHaveLength(4);
    expect(result!.bodyDensity).toBeGreaterThan(1);
    expect(result!.bodyDensity).toBeLessThan(1.2);
    expect(result!.fatPercent).toBeGreaterThan(0);
    expect(result!.fatPercent).toBeLessThan(60);
    expect(result!.fatMassKg + result!.leanMassKg).toBeCloseTo(80, 1);
  });

  it('includes optional filled skinfolds in chart medians without changing Σ', () => {
    const body = bodyWithPetroskiMale();
    body.skinfolds.abdominal = { first: '30', second: '32', third: '' };
    body.skinfolds.bicipital = { first: '8', second: '10', third: '' };

    const withoutExtra = calculatePetroskiComposition({
      body: bodyWithPetroskiMale(),
      gender: 'male',
      ageYears: 30,
    });
    const withExtra = calculatePetroskiComposition({
      body,
      gender: 'male',
      ageYears: 30,
    });

    expect(withExtra!.medians.map((item) => item.id)).toEqual([
      'tricipital',
      'subescapular',
      'bicipital',
      'iliaca',
      'abdominal',
      'panturrilha',
    ]);
    expect(withExtra!.fatPercent).toBe(withoutExtra!.fatPercent);
    expect(withExtra!.bodyDensity).toBe(withoutExtra!.bodyDensity);
  });

  it('computes female equation with weight and height terms', () => {
    const body = createEmptyNutritionBody();
    const filled: PatientNutritionBody = {
      ...body,
      adipometryProtocol: 'petroski',
      weightKg: '65',
      heightCm: '162',
      skinfolds: {
        ...body.skinfolds,
        axilar: measures('14', '16'),
        iliaca: measures('18', '20'),
        coxa: measures('22', '24'),
        panturrilha: measures('12', '14'),
      },
    };

    const result = calculatePetroskiComposition({
      body: filled,
      gender: 'female',
      ageYears: 28,
    });

    expect(result).not.toBeNull();
    expect(result!.medians.map((item) => item.id)).toEqual([
      'axilar',
      'iliaca',
      'coxa',
      'panturrilha',
    ]);
    expect(result!.fatMassKg + result!.leanMassKg).toBeCloseTo(65, 1);
  });
});

describe('ageYearsFromBirthDate', () => {
  it('returns null for empty birth date', () => {
    expect(ageYearsFromBirthDate('')).toBeNull();
    expect(ageYearsFromBirthDate(null)).toBeNull();
  });

  it('returns age in years', () => {
    expect(
      ageYearsFromBirthDate('1990-01-15', new Date('2026-08-17')),
    ).toBe(36);
  });
});
