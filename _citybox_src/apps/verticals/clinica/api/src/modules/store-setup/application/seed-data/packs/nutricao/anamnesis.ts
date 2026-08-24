import type {
  ClinicSeedAnamnesisQuestion,
  ClinicSeedAnamnesisTemplate,
} from '../../anamnesis-templates';
import { GLOBAL_ANAMNESIS_QUESTION_TEXTS } from '../../global-anamnesis-questions';
import {
  YES_NO_OTHER_OPTIONS,
  type AnamnesisQuestionOption,
} from '../../../../../anamnesis/domain/anamnesis-question-options';

const GLOBAL = GLOBAL_ANAMNESIS_QUESTION_TEXTS;

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

function richTextQuestion(text: string): ClinicSeedAnamnesisQuestion {
  return {
    text,
    type: 'rich_text',
    generatesAlert: false,
    alertWhen: null,
    alertName: null,
  };
}

function singleChoiceQuestion(
  text: string,
  options: readonly AnamnesisQuestionOption[],
): ClinicSeedAnamnesisQuestion {
  return {
    text,
    type: 'single_choice',
    generatesAlert: false,
    alertWhen: null,
    alertName: null,
    options: [...options],
  };
}

function yesNoOtherQuestion(text: string): ClinicSeedAnamnesisQuestion {
  return singleChoiceQuestion(text, YES_NO_OTHER_OPTIONS);
}

/** Perguntas específicas de nutrição (scope clinic no seed) — união base + lista de produto. */
export const NUTRICAO_ANAMNESIS_EXTRA_QUESTIONS: ClinicSeedAnamnesisQuestion[] =
  [
    // Objetivo / histórico
    textQuestion('Qual o objetivo principal com o acompanhamento nutricional?'),
    yesNoUnknownText('Já fez acompanhamento com nutricionista?'),
    textQuestion('Há quanto tempo busca esse objetivo?'),
    textQuestion('Tratamentos Anteriores'),
    // Hábitos alimentares
    textQuestion('Quantas refeições faz por dia?'),
    yesNoUnknownText('Costuma pular refeições?'),
    yesNoUnknown('Consome frutas e hortaliças diariamente?'),
    yesNoUnknownText('Consome ultraprocessados / fast food com frequência?'),
    yesNoUnknownText('Bebe água regularmente? Qual volume aproximado/dia?'),
    yesNoUnknownText('Consome refrigerante ou bebidas açucaradas?'),
    // Restrições / intolerâncias
    yesNoUnknownText('Possui alergia alimentar?', {
      alertName: 'Alergia alimentar',
    }),
    yesNoUnknownText(
      'Possui intolerância alimentar? (lactose, glúten, etc.)',
      { alertName: 'Intolerância alimentar' },
    ),
    yesNoUnknownText(
      'Segue dieta vegetariana, vegana ou outra restrição cultural/religiosa?',
    ),
    yesNoUnknownText('Já fez dietas restritivas ou jejum prolongado?'),
    // Antropometria
    yesNoUnknownText('Conhece peso e altura atuais?'),
    yesNoUnknownText(
      'Houve variação recente de peso? (quanto e em quanto tempo)',
    ),
    yesNoUnknownText(
      'Já realizou bioimpedância ou avaliação de composição corporal?',
    ),
    // Clínico nutricional
    yesNoUnknownText('Possui dislipidemia / colesterol ou triglicerídeos altos?', {
      alertName: 'Dislipidemia',
    }),
    yesNoUnknownText('Possui alterações hormonais ou na tireóide?', {
      alertName: 'Tireoide / hormonal',
    }),
    yesNoUnknownText(
      'Possui doença gastrointestinal? (refluxo, gastrite, SII, etc.)',
      { alertName: 'GI' },
    ),
    yesNoUnknownText('Possui doença renal?', { alertName: 'Doença renal' }),
    yesNoUnknownText('Possui doença hepática?', {
      alertName: 'Doença hepática',
    }),
    yesNoUnknownText('Usa suplementos alimentares ou vitaminas? (quais)'),
    yesNoUnknownText('Já fez cirurgia?'),
    // Estilo de vida
    yesNoUnknownText('Realiza atividade física regular?'),
    textQuestion('Qual a qualidade do sono?'),
    yesNoUnknownText('Relata estresse que afeta a alimentação?'),
    yesNoUnknown('Trabalha em turnos / horários irregulares de refeição?'),
    yesNoUnknown('Utiliza filtro solar diariamente?'),
    // Materno-infantil
    yesNoUnknownText('Já passou por gestação?'),
    yesNoUnknown('Está amamentando?'),
    yesNoUnknownText('A criança tem introdução alimentar / seletividade?'),
    // Cutâneo / pigmentar (lista de produto)
    yesNoUnknown('Possui patologias cutâneas?'),
    yesNoUnknown('Psoríase?', { alertName: 'Psoríase' }),
    yesNoUnknown('Vitiligo?'),
    yesNoUnknown('Lúpus?', { alertName: 'Lúpus' }),
    yesNoUnknown('Rosácea?'),
    yesNoUnknownText('Outra patologia cutânea?'),
    yesNoUnknown('Possui alterações pigmentares cutâneas?'),
    yesNoUnknown('Sardas?'),
    yesNoUnknown('Manchas senis?'),
    yesNoUnknown('Melasma?'),
    yesNoUnknown('Manchas por sequela de cicatrizes?'),
    yesNoUnknownText('Outra alteração pigmentar?'),
  ];

export const NUTRICAO_ANAMNESIS_TEMPLATES: ClinicSeedAnamnesisTemplate[] = [
  {
    name: 'Anamnese nutricional',
    activeQuestionTexts: [
      GLOBAL.queixaPrincipal,
      'Tratamentos Anteriores',
      'Qual o objetivo principal com o acompanhamento nutricional?',
      'Já fez acompanhamento com nutricionista?',
      'Há quanto tempo busca esse objetivo?',
      GLOBAL.medicacaoContinua,
      GLOBAL.alergiaMedicamentos,
      GLOBAL.gestante,
      GLOBAL.diabetes,
      GLOBAL.hipertensao,
      GLOBAL.tabagismo,
      GLOBAL.alcool,
      GLOBAL.restricaoAlimentar,
      GLOBAL.implanteMetalico,
      'Quantas refeições faz por dia?',
      'Costuma pular refeições?',
      'Consome frutas e hortaliças diariamente?',
      'Consome ultraprocessados / fast food com frequência?',
      'Bebe água regularmente? Qual volume aproximado/dia?',
      'Consome refrigerante ou bebidas açucaradas?',
      'Possui alergia alimentar?',
      'Possui intolerância alimentar? (lactose, glúten, etc.)',
      'Segue dieta vegetariana, vegana ou outra restrição cultural/religiosa?',
      'Já fez dietas restritivas ou jejum prolongado?',
      'Conhece peso e altura atuais?',
      'Houve variação recente de peso? (quanto e em quanto tempo)',
      'Já realizou bioimpedância ou avaliação de composição corporal?',
      'Possui dislipidemia / colesterol ou triglicerídeos altos?',
      'Possui alterações hormonais ou na tireóide?',
      'Possui doença gastrointestinal? (refluxo, gastrite, SII, etc.)',
      'Possui doença renal?',
      'Possui doença hepática?',
      'Usa suplementos alimentares ou vitaminas? (quais)',
      'Já fez cirurgia?',
      'Realiza atividade física regular?',
      'Qual a qualidade do sono?',
      'Relata estresse que afeta a alimentação?',
      'Trabalha em turnos / horários irregulares de refeição?',
      'Utiliza filtro solar diariamente?',
      'Possui patologias cutâneas?',
      'Psoríase?',
      'Vitiligo?',
      'Lúpus?',
      'Rosácea?',
      'Outra patologia cutânea?',
      'Possui alterações pigmentares cutâneas?',
      'Sardas?',
      'Manchas senis?',
      'Melasma?',
      'Manchas por sequela de cicatrizes?',
      'Outra alteração pigmentar?',
      GLOBAL.observacoes,
    ],
  },
  {
    name: 'Anamnese nutricional resumida',
    activeQuestionTexts: [
      GLOBAL.queixaPrincipal,
      'Tratamentos Anteriores',
      'Qual o objetivo principal com o acompanhamento nutricional?',
      GLOBAL.medicacaoContinua,
      GLOBAL.diabetes,
      GLOBAL.hipertensao,
      'Possui alterações hormonais ou na tireóide?',
      'Possui doença hepática?',
      'Realiza atividade física regular?',
      GLOBAL.gestante,
      GLOBAL.observacoes,
    ],
  },
  {
    name: 'Nutrição materno-infantil',
    activeQuestionTexts: [
      GLOBAL.queixaPrincipal,
      'Qual o objetivo principal com o acompanhamento nutricional?',
      GLOBAL.gestante,
      'Já passou por gestação?',
      'Está amamentando?',
      'A criança tem introdução alimentar / seletividade?',
      GLOBAL.medicacaoContinua,
      GLOBAL.alergiaMedicamentos,
      GLOBAL.restricaoAlimentar,
      'Possui alergia alimentar?',
      'Possui intolerância alimentar? (lactose, glúten, etc.)',
      'Quantas refeições faz por dia?',
      'Bebe água regularmente? Qual volume aproximado/dia?',
      GLOBAL.observacoes,
    ],
  },
  {
    name: 'Anamnese nutricional esportiva',
    activeQuestionTexts: [
      GLOBAL.queixaPrincipal,
      'Qual o objetivo principal com o acompanhamento nutricional?',
      'Realiza atividade física regular?',
      'Usa suplementos alimentares ou vitaminas? (quais)',
      'Bebe água regularmente? Qual volume aproximado/dia?',
      'Houve variação recente de peso? (quanto e em quanto tempo)',
      'Quantas refeições faz por dia?',
      'Costuma pular refeições?',
      'Consome ultraprocessados / fast food com frequência?',
      GLOBAL.medicacaoContinua,
      GLOBAL.diabetes,
      GLOBAL.hipertensao,
      GLOBAL.observacoes,
    ],
  },
  {
    name: 'Anamnese de acompanhamento nutricional resumida',
    activeQuestionTexts: [
      'Queixa principal',
      'Tratamentos anteriores',
      'Gestante?',
      'Tabagista?',
      'Possui diabetes?',
      'Possui hipertensão?',
      'Utiliza marcapasso?',
      'Possui alterações hormonais ou na tireóide?',
      'Possui doença hepática?',
      'Utiliza filtro solar diariamente?',
      'Utiliza medicamentos contínuos?',
      'Realiza atividade física regular?',
      'Já fez cirurgia?',
      'Patologias cutâneas?',
      'Alterações pigmentares cutâneas?',
      'Observações',
    ],
  },
];

export const NUTRICAO_FOLLOWUP_ANAMNESIS_TEMPLATE_NAME =
  'Anamnese de acompanhamento nutricional resumida';

const SKIN_PATHOLOGY_OPTIONS: readonly AnamnesisQuestionOption[] = [
  { value: 'psoriase', label: 'Psoríase' },
  { value: 'vitiligo', label: 'Vitiligo' },
  { value: 'lupus', label: 'Lúpus' },
  { value: 'rosacea', label: 'Rosácea' },
  { value: 'outro', label: 'Outro', allowsOther: true },
];

const PIGMENT_OPTIONS: readonly AnamnesisQuestionOption[] = [
  { value: 'sardas', label: 'Sardas' },
  { value: 'manchas-senis', label: 'Manchas senis' },
  { value: 'melasma', label: 'Melasma' },
  {
    value: 'sequela-cicatrizes',
    label: 'Manchas por sequela de cicatrizes',
  },
  { value: 'outro', label: 'Outro', allowsOther: true },
];

/** Perguntas do sheet de Inicializar — tipos próprios para não alterar os modelos atuais. */
export const NUTRICAO_FOLLOWUP_ANAMNESIS_QUESTIONS: ClinicSeedAnamnesisQuestion[] =
  [
    richTextQuestion('Queixa principal'),
    richTextQuestion('Tratamentos anteriores'),
    yesNoOtherQuestion('Gestante?'),
    yesNoOtherQuestion('Tabagista?'),
    yesNoOtherQuestion('Possui diabetes?'),
    yesNoOtherQuestion('Possui hipertensão?'),
    yesNoOtherQuestion('Utiliza marcapasso?'),
    yesNoOtherQuestion('Possui alterações hormonais ou na tireóide?'),
    yesNoOtherQuestion('Possui doença hepática?'),
    yesNoOtherQuestion('Utiliza filtro solar diariamente?'),
    yesNoOtherQuestion('Utiliza medicamentos contínuos?'),
    yesNoOtherQuestion('Realiza atividade física regular?'),
    yesNoOtherQuestion('Já fez cirurgia?'),
    singleChoiceQuestion('Patologias cutâneas?', SKIN_PATHOLOGY_OPTIONS),
    singleChoiceQuestion('Alterações pigmentares cutâneas?', PIGMENT_OPTIONS),
    textQuestion('Observações'),
  ];
