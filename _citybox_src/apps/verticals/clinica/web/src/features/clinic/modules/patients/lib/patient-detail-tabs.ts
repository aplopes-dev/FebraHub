export type PatientDetailTabValue =
  | 'sobre'
  | 'orcamentos'
  | 'calculo-imc'
  | 'tratamentos'
  | 'anamnese'
  | 'documentos'
  | 'financeiro'
  | 'arquivos';

export const PATIENT_DETAIL_BASE_PATH = '/pacientes';

export type PatientDetailTabDefinition = {
  value: PatientDetailTabValue;
  label: string;
  placeholderTitle: string;
  placeholderDescription: string;
};

export const PATIENT_DETAIL_TABS: PatientDetailTabDefinition[] = [
  {
    value: 'sobre',
    label: 'Sobre',
    placeholderTitle: 'Sobre em breve',
    placeholderDescription: 'O resumo do paciente estará disponível nesta aba em breve.',
  },
  {
    value: 'calculo-imc',
    label: 'Cálculo de IMC',
    placeholderTitle: 'Cálculo de IMC',
    placeholderDescription:
      'Registre peso e altura do paciente e acompanhe o histórico de IMC e classificação.',
  },
  {
    value: 'orcamentos',
    label: 'Orçamentos',
    placeholderTitle: 'Orçamentos',
    placeholderDescription: 'Gerencie orçamentos e propostas de procedimento do paciente.',
  },
  {
    value: 'tratamentos',
    label: 'Prontuário',
    placeholderTitle: 'Prontuário',
    placeholderDescription: 'Gerencie procedimentos e evoluções clínicas do paciente.',
  },
  {
    value: 'anamnese',
    label: 'Anamnese',
    placeholderTitle: 'Anamnese',
    placeholderDescription: 'Gerencie anamneses preenchidas e compartilhe links com o paciente.',
  },
  {
    value: 'documentos',
    label: 'Documentos',
    placeholderTitle: 'Documentos',
    placeholderDescription: 'Emita contratos, receituários e atestados para o paciente.',
  },
  {
    value: 'financeiro',
    label: 'Financeiro',
    placeholderTitle: 'Financeiro',
    placeholderDescription: 'Gerencie lançamentos, recebimentos e pendências financeiras do paciente.',
  },
  {
    value: 'arquivos',
    label: 'Arquivos',
    placeholderTitle: 'Arquivos',
    placeholderDescription: 'Gerencie exames, imagens e anexos do paciente nesta aba.',
  },
];

export const PATIENT_DETAIL_DEFAULT_TAB: PatientDetailTabValue = 'sobre';

/** Abas sem badge "Em breve" na navegação. */
export const PATIENT_DETAIL_IMPLEMENTED_TABS: ReadonlySet<PatientDetailTabValue> = new Set([
  'sobre',
  'orcamentos',
  'calculo-imc',
  'tratamentos',
  'anamnese',
  'documentos',
  'financeiro',
  'arquivos',
]);

export function isPatientDetailTabImplemented(tab: PatientDetailTabValue): boolean {
  return PATIENT_DETAIL_IMPLEMENTED_TABS.has(tab);
}

const PATIENT_DETAIL_TAB_VALUES = new Set<PatientDetailTabValue>(
  PATIENT_DETAIL_TABS.map((tab) => tab.value),
);

export function isPatientDetailTabValue(value: string): value is PatientDetailTabValue {
  return PATIENT_DETAIL_TAB_VALUES.has(value as PatientDetailTabValue);
}

export function patientDetailTabHref(
  patientId: string,
  tab: PatientDetailTabValue = PATIENT_DETAIL_DEFAULT_TAB,
): string {
  return `${PATIENT_DETAIL_BASE_PATH}/${patientId}/${tab}`;
}

export function patientDetailDefaultHref(patientId: string): string {
  return patientDetailTabHref(patientId, PATIENT_DETAIL_DEFAULT_TAB);
}

export function getPatientDetailTabDefinition(
  tab: PatientDetailTabValue,
): PatientDetailTabDefinition {
  const definition = PATIENT_DETAIL_TABS.find((item) => item.value === tab);
  if (!definition) {
    throw new Error(`Aba de paciente desconhecida: ${tab}`);
  }
  return definition;
}
