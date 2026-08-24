import { describe, expect, it } from 'vitest';
import {
  calculatePatientBmi,
  formatPatientBmi,
  patientGenderToImcSilhouetteSex,
  patientImcSilhouetteSrc,
  resolvePatientImcStage,
} from './patient-imc';

describe('patient-imc', () => {
  it('calculates BMI from weight and height', () => {
    expect(calculatePatientBmi(70, 175)).toBe(22.9);
    expect(calculatePatientBmi(0, 175)).toBeNull();
  });

  it('resolves product stages from BMI', () => {
    expect(resolvePatientImcStage(17.9)?.riskGrade).toBe('abaixo_normal');
    expect(resolvePatientImcStage(17.9)?.silhouetteVariant).toBe(1);
    expect(resolvePatientImcStage(22)?.riskGrade).toBe('saudavel');
    expect(resolvePatientImcStage(22)?.silhouetteVariant).toBe(2);
    expect(resolvePatientImcStage(27)?.obesityType).toBe('sobrepeso');
    expect(resolvePatientImcStage(27)?.silhouetteVariant).toBe(3);
    expect(resolvePatientImcStage(31)?.obesityType).toBe('grau_1');
    expect(resolvePatientImcStage(31)?.silhouetteVariant).toBe(4);
    expect(resolvePatientImcStage(36)?.obesityType).toBe('grau_2');
    expect(resolvePatientImcStage(36)?.silhouetteVariant).toBe(5);
    expect(resolvePatientImcStage(41)?.obesityType).toBe('grau_3');
    expect(resolvePatientImcStage(41)?.silhouetteVariant).toBe(6);
  });

  it('maps gender to silhouette assets', () => {
    expect(patientGenderToImcSilhouetteSex('female')).toBe('female');
    expect(patientGenderToImcSilhouetteSex('male')).toBe('male');
    expect(patientGenderToImcSilhouetteSex('other')).toBe('male');
    expect(patientImcSilhouetteSrc(2, 'female')).toBe('/clinic/imc/female_2.svg');
    expect(patientImcSilhouetteSrc(2, 'male')).toBe('/clinic/imc/male_2.svg');
  });

  it('formats BMI for display', () => {
    expect(formatPatientBmi(22.9)).toBe('22,9');
  });
});
