import { describe, expect, it } from 'vitest';
import { interpolateContractVariables } from './interpolate-contract-variables';
import type { PatientContractEmissionFormValues } from '../types/patient-contract-emission';

const baseValues: PatientContractEmissionFormValues = {
  templateId: 'tpl-1',
  contractorName: 'Maria Silva',
  contractorBirthDate: '1990-05-15',
  contractorCpf: '123.456.789-00',
  contractorZip: '45650-000',
  contractorStreet: 'Rua das Flores, 100',
  contractorNeighborhood: 'Centro',
  contractorCity: 'Ilhéus',
  contractorState: 'BA',
  contractedName: 'Clínica Exemplo',
  contractedDocument: '12.345.678/0001-90',
  contractedCity: 'Ilhéus',
  contractValue: 'R$ 2.500,00',
  treatmentsDescription: 'Clareamento dental',
  contractDate: '2026-07-01',
  content: '',
};

describe('interpolateContractVariables', () => {
  it('replaces plain text tokens', () => {
    const html = '<p>Contrato de {{nome_paciente}} no valor de {{valor_contrato}}.</p>';
    const result = interpolateContractVariables(html, baseValues);

    expect(result).toContain('Maria Silva');
    expect(result).toContain('R$ 2.500,00');
    expect(result).not.toContain('{{nome_paciente}}');
  });

  it('replaces TipTap variable chips', () => {
    const html =
      '<p><span data-variable="{{nome_paciente}}" data-label="Nome Paciente">Nome Paciente</span></p>';
    const result = interpolateContractVariables(html, baseValues);

    expect(result).toBe('<p>Maria Silva</p>');
  });
});
