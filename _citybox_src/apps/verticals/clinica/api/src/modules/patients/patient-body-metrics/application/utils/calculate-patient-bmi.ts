export function calculatePatientBmi(
  weightKg: number,
  heightCm: number,
): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) {
    return null;
  }
  if (weightKg <= 0 || heightCm <= 0) {
    return null;
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}
