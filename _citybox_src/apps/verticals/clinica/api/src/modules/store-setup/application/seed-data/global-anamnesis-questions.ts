import type { ClinicSeedAnamnesisQuestion } from './anamnesis-templates';

function yesNoUnknownText(
  text: string,
  alert?: { alertName: string },
): ClinicSeedAnamnesisQuestion {
  return {
    text,
    type: 'yes_no_unknown_text',
    generatesAlert: Boolean(alert),
    alertWhen: alert ? 'yes' : null,
    alertName: alert?.alertName ?? null,
  };
}

function yesNoUnknown(
  text: string,
  alert?: { alertName: string },
): ClinicSeedAnamnesisQuestion {
  return {
    text,
    type: 'yes_no_unknown',
    generatesAlert: Boolean(alert),
    alertWhen: alert ? 'yes' : null,
    alertName: alert?.alertName ?? null,
  };
}

function textQuestion(text: string): ClinicSeedAnamnesisQuestion {
  return {
    text,
    type: 'text',
    generatesAlert: false,
    alertWhen: null,
    alertName: null,
  };
}

/** Textos canônicos — templates fisio referenciam por string exata. */
export const GLOBAL_ANAMNESIS_QUESTION_TEXTS = {
  alergiaMedicamentos: 'Possui alergia a medicamentos?',
  medicacaoContinua: 'Faz uso contínuo de medicação?',
  gestante: 'Está gestante?',
  diabetes: 'Possui diabetes mellitus?',
  hipertensao: 'Possui hipertensão arterial?',
  tabagismo: 'Fuma atualmente?',
  alcool: 'Consume bebidas alcoólicas?',
  restricaoAlimentar: 'Possui restrição alimentar?',
  historicoCardiacoFamiliar: 'Histórico familiar de doenças cardíacas',
  anticoagulante: 'Usa anticoagulante?',
  epilepsia: 'Possui epilepsia ou convulsões?',
  reacaoAnestesia: 'Já teve reação adversa a anestesia local?',
  implanteMetalico: 'Possui marcapasso, stent ou implante metálico?',
  queixaPrincipal: 'Queixa principal',
  observacoes: 'Observações adicionais do paciente',
} as const;

/** Biblioteca global de 15 perguntas — compartilhada por vertentes não-odonto. */
export const GLOBAL_ANAMNESIS_QUESTIONS: ClinicSeedAnamnesisQuestion[] = [
  textQuestion(GLOBAL_ANAMNESIS_QUESTION_TEXTS.queixaPrincipal),
  yesNoUnknownText(GLOBAL_ANAMNESIS_QUESTION_TEXTS.alergiaMedicamentos),
  yesNoUnknownText(GLOBAL_ANAMNESIS_QUESTION_TEXTS.medicacaoContinua),
  yesNoUnknown(GLOBAL_ANAMNESIS_QUESTION_TEXTS.gestante),
  yesNoUnknown(GLOBAL_ANAMNESIS_QUESTION_TEXTS.diabetes),
  yesNoUnknown(GLOBAL_ANAMNESIS_QUESTION_TEXTS.hipertensao),
  yesNoUnknown(GLOBAL_ANAMNESIS_QUESTION_TEXTS.tabagismo),
  yesNoUnknown(GLOBAL_ANAMNESIS_QUESTION_TEXTS.alcool),
  yesNoUnknownText(GLOBAL_ANAMNESIS_QUESTION_TEXTS.restricaoAlimentar),
  yesNoUnknown(GLOBAL_ANAMNESIS_QUESTION_TEXTS.historicoCardiacoFamiliar),
  yesNoUnknownText(GLOBAL_ANAMNESIS_QUESTION_TEXTS.anticoagulante, {
    alertName: 'Anticoagulante',
  }),
  yesNoUnknown(GLOBAL_ANAMNESIS_QUESTION_TEXTS.epilepsia),
  yesNoUnknownText(GLOBAL_ANAMNESIS_QUESTION_TEXTS.reacaoAnestesia),
  yesNoUnknownText(GLOBAL_ANAMNESIS_QUESTION_TEXTS.implanteMetalico, {
    alertName: 'Implante metálico',
  }),
  textQuestion(GLOBAL_ANAMNESIS_QUESTION_TEXTS.observacoes),
];
