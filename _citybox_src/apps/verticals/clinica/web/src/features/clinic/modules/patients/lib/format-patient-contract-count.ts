export function formatPatientContractCount(count: number): string {
  if (count === 1) {
    return '1 Contrato';
  }

  return `${count} Contratos`;
}
