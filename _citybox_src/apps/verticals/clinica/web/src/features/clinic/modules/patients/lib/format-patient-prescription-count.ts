export function formatPatientPrescriptionCount(count: number): string {
  if (count === 1) {
    return '1 Receituário';
  }

  return `${count} Receituários`;
}
