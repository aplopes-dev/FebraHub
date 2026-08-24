import type { WhatsappVariable } from '../types/whatsapp';

function createVariable(
  id: string,
  label: string,
  key: string,
): WhatsappVariable {
  return { id, label, token: `{${key}}` };
}

/** Variáveis disponíveis no editor de templates WhatsApp (tokens single-brace da API). */
export const WHATSAPP_VARIABLE_CATALOG: WhatsappVariable[] = [
  createVariable('var-patient-name', 'Nome Paciente', 'nome_paciente'),
  createVariable('var-clinic-name', 'Nome Clínica', 'nome_clinica'),
  createVariable('var-weekday', 'Dia da Semana', 'dia_semana'),
  createVariable('var-date', 'Data', 'data'),
  createVariable('var-time', 'Hora', 'hora'),
  createVariable('var-clinic-phone', 'Telefone Clínica', 'telefone_clinica'),
];

export function findWhatsappVariableByToken(
  token: string,
): WhatsappVariable | undefined {
  return WHATSAPP_VARIABLE_CATALOG.find((variable) => variable.token === token);
}

export function findWhatsappVariableByKey(
  key: string,
): WhatsappVariable | undefined {
  return findWhatsappVariableByToken(`{${key}}`);
}
