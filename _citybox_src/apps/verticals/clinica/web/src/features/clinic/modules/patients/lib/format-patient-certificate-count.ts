export function formatPatientCertificateCount(count: number): string {
  if (count === 1) {
    return '1 Atestado';
  }

  return `${count} Atestados`;
}
