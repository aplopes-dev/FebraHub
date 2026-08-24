import { describe, expect, it } from 'vitest';
import {
  formatMissingContractVariableLabels,
  listMissingContractVariableFields,
} from './contract-variable-gaps';

describe('listMissingContractVariableFields', () => {
  it('returns empty when all fields are filled', () => {
    expect(
      listMissingContractVariableFields({
        contractorName: 'Maria',
        contractorBirthDate: '1990-01-01',
        contractorCpf: '52998224725',
        contractorZip: '45654-000',
        contractorStreet: 'Rua A',
        contractorNeighborhood: 'Centro',
        contractorCity: 'Ilhéus',
        contractorState: 'BA',
        contractedName: 'Clínica',
        contractedDocument: '123',
        contractedCity: 'Ilhéus',
      }),
    ).toEqual([]);
  });

  it('lists missing contractor birth date and address', () => {
    const missing = listMissingContractVariableFields({
      contractorName: 'Maria',
      contractorBirthDate: '',
      contractorCpf: '52998224725',
      contractorZip: '',
      contractorStreet: '',
      contractorNeighborhood: 'Centro',
      contractorCity: 'Ilhéus',
      contractorState: 'BA',
      contractedName: 'Clínica',
      contractedDocument: '123',
      contractedCity: 'Ilhéus',
    });
    expect(missing).toEqual([
      'contractorBirthDate',
      'contractorZip',
      'contractorStreet',
    ]);
    expect(formatMissingContractVariableLabels(missing)).toContain(
      'Data de nascimento',
    );
    expect(formatMissingContractVariableLabels(missing)).toContain('Rua');
  });
});
