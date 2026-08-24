export function isValidFdiToothNumber(toothNumber: number): boolean {
  return (
    (toothNumber >= 11 && toothNumber <= 18) ||
    (toothNumber >= 21 && toothNumber <= 28) ||
    (toothNumber >= 31 && toothNumber <= 38) ||
    (toothNumber >= 41 && toothNumber <= 48) ||
    (toothNumber >= 51 && toothNumber <= 55) ||
    (toothNumber >= 61 && toothNumber <= 65) ||
    (toothNumber >= 71 && toothNumber <= 75) ||
    (toothNumber >= 81 && toothNumber <= 85)
  );
}
