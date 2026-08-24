import { calculatePatientBmi } from './calculate-patient-bmi';

describe('calculatePatientBmi', () => {
  it('calculates BMI from weight and height', () => {
    expect(calculatePatientBmi(70, 175)).toBe(22.9);
    expect(calculatePatientBmi(80, 180)).toBe(24.7);
  });

  it('returns null when weight or height is invalid', () => {
    expect(calculatePatientBmi(0, 175)).toBeNull();
    expect(calculatePatientBmi(70, 0)).toBeNull();
    expect(calculatePatientBmi(-1, 175)).toBeNull();
    expect(calculatePatientBmi(70, -1)).toBeNull();
    expect(calculatePatientBmi(Number.NaN, 175)).toBeNull();
    expect(calculatePatientBmi(70, Number.POSITIVE_INFINITY)).toBeNull();
  });
});
