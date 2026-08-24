import type {
  ClinicSeedAnamnesisQuestion,
  ClinicSeedAnamnesisTemplate,
} from '../../anamnesis-templates';
import { GLOBAL_ANAMNESIS_QUESTION_TEXTS } from '../../global-anamnesis-questions';

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

/** Perguntas específicas de fisioterapia (scope clinic no seed). */
export const FISIOTERAPIA_ANAMNESIS_EXTRA_QUESTIONS: ClinicSeedAnamnesisQuestion[] =
  [
    // Queixa / dor
    textQuestion('Qual a localização da dor ou queixa principal?'),
    textQuestion('Há quanto tempo apresenta a queixa?'),
    textQuestion(
      'Descreva a dor (tipo, intensidade 0–10, irradiação, fatores de alívio e piora)',
    ),
    yesNoUnknownText('O que melhora ou piora os sintomas?'),
    yesNoUnknownText('Já realizou fisioterapia anteriormente para esta queixa?'),
    // Ortopédico
    yesNoUnknownText('Possui histórico de fraturas ou entorses?'),
    yesNoUnknownText('Já realizou cirurgia ortopédica? (qual e quando)'),
    yesNoUnknownText('Possui prótese ou implante articular?'),
    yesNoUnknownText('Usa órtese, bengala, muleta ou andador?'),
    yesNoUnknownText('Relata instabilidade articular ou sensação de falseio?'),
    // Neurológico
    yesNoUnknownText(
      'Possui diagnóstico neurológico? (AVC, Parkinson, esclerose múltipla, etc.)',
      { alertName: 'Condição neurológica' },
    ),
    yesNoUnknownText('Apresenta alterações de sensibilidade, formigamento ou dormência?'),
    yesNoUnknownText('Apresenta alterações de equilíbrio ou tontura?'),
    yesNoUnknownText('Possui limitação de força muscular?'),
    // Cardiorrespiratório
    yesNoUnknownText(
      'Possui doença cardíaca ou pulmonar diagnosticada?',
      { alertName: 'Doença cardiorrespiratória' },
    ),
    yesNoUnknownText('Relata falta de ar ou cansaço aos esforços?'),
    yesNoUnknownText('Possui tosse crônica ou expectoração?'),
    // Cirurgias
    yesNoUnknownText('Já foi submetido(a) a cirurgias? (quais e quando)'),
    yesNoUnknownText('Possui restrição médica para exercícios?'),
    // AVDs
    yesNoUnknown(
      'Consegue realizar atividades de vida diária de forma independente?',
    ),
    yesNoUnknownText('Precisa de auxílio para locomover-se?'),
    yesNoUnknownText('Trabalha ou pratica atividade física regularmente?'),
    // Hábitos e sono
    textQuestion('Qual a qualidade do sono?'),
    yesNoUnknownText('Relata dificuldade para dormir?'),
    yesNoUnknownText('Pratica atividade física? (tipo e frequência)'),
    yesNoUnknownText(
      'Permanece muito tempo sentado(a) ou em pé no trabalho?',
    ),
    // Exames
    yesNoUnknownText(
      'Realizou exames de imagem recentes? (RX, ressonância, tomografia)',
    ),
    yesNoUnknownText('Possui laudos ou exames complementares para anexar?'),
    // Objetivo
    textQuestion('Qual o objetivo principal com o tratamento fisioterapêutico?'),
    // Saúde da mulher / pélvica
    yesNoUnknownText('Já passou por gestação? (quantas e quando)'),
    yesNoUnknown('Está no período de puerpério?'),
    textQuestion('Qual foi o tipo de parto? (normal, cesárea, fórceps)'),
    yesNoUnknownText('Apresenta incontinência urinária ou fecal?'),
    yesNoUnknownText('Utiliza anticoncepcional hormonal?'),
    yesNoUnknownText('Apresenta diástase abdominal?'),
    yesNoUnknownText('Realizou cirurgia pélvica ou abdominal?'),
    // Pediátrica
    yesNoUnknown('A criança nasceu prematura?'),
    yesNoUnknownText('Apresenta atraso no desenvolvimento motor?'),
    yesNoUnknownText(
      'Possui síndrome ou condição genética diagnosticada?',
      { alertName: 'Condição genética' },
    ),
    yesNoUnknownText('A criança frequenta escola ou creche?'),
    yesNoUnknownText('Apresenta alterações posturais ou de marcha?'),
  ];

export const FISIOTERAPIA_ANAMNESIS_TEMPLATES: ClinicSeedAnamnesisTemplate[] = [
  {
    name: 'Anamnese fisioterapêutica adulta',
    activeQuestionTexts: [
      GLOBAL.queixaPrincipal,
      'Qual a localização da dor ou queixa principal?',
      'Há quanto tempo apresenta a queixa?',
      'Descreva a dor (tipo, intensidade 0–10, irradiação, fatores de alívio e piora)',
      'O que melhora ou piora os sintomas?',
      'Já realizou fisioterapia anteriormente para esta queixa?',
      GLOBAL.medicacaoContinua,
      GLOBAL.alergiaMedicamentos,
      GLOBAL.diabetes,
      GLOBAL.hipertensao,
      GLOBAL.anticoagulante,
      GLOBAL.implanteMetalico,
      GLOBAL.epilepsia,
      'Possui histórico de fraturas ou entorses?',
      'Já realizou cirurgia ortopédica? (qual e quando)',
      'Possui prótese ou implante articular?',
      'Usa órtese, bengala, muleta ou andador?',
      'Relata instabilidade articular ou sensação de falseio?',
      'Possui diagnóstico neurológico? (AVC, Parkinson, esclerose múltipla, etc.)',
      'Apresenta alterações de sensibilidade, formigamento ou dormência?',
      'Apresenta alterações de equilíbrio ou tontura?',
      'Possui limitação de força muscular?',
      'Possui doença cardíaca ou pulmonar diagnosticada?',
      'Relata falta de ar ou cansaço aos esforços?',
      'Possui tosse crônica ou expectoração?',
      GLOBAL.historicoCardiacoFamiliar,
      'Já foi submetido(a) a cirurgias? (quais e quando)',
      'Possui restrição médica para exercícios?',
      'Consegue realizar atividades de vida diária de forma independente?',
      'Precisa de auxílio para locomover-se?',
      'Trabalha ou pratica atividade física regularmente?',
      'Qual a qualidade do sono?',
      'Relata dificuldade para dormir?',
      GLOBAL.tabagismo,
      GLOBAL.alcool,
      'Pratica atividade física? (tipo e frequência)',
      'Permanece muito tempo sentado(a) ou em pé no trabalho?',
      'Realizou exames de imagem recentes? (RX, ressonância, tomografia)',
      'Possui laudos ou exames complementares para anexar?',
      'Qual o objetivo principal com o tratamento fisioterapêutico?',
      GLOBAL.gestante,
      GLOBAL.observacoes,
    ],
  },
  {
    name: 'Anamnese fisioterapêutica resumida',
    activeQuestionTexts: [
      GLOBAL.queixaPrincipal,
      'Qual a localização da dor ou queixa principal?',
      'Há quanto tempo apresenta a queixa?',
      GLOBAL.medicacaoContinua,
      GLOBAL.alergiaMedicamentos,
      GLOBAL.diabetes,
      GLOBAL.hipertensao,
      'Já realizou cirurgia ortopédica? (qual e quando)',
      'Possui restrição médica para exercícios?',
      'Qual o objetivo principal com o tratamento fisioterapêutico?',
      GLOBAL.gestante,
      GLOBAL.observacoes,
    ],
  },
  {
    name: 'Saúde da mulher / pélvica',
    activeQuestionTexts: [
      GLOBAL.queixaPrincipal,
      GLOBAL.medicacaoContinua,
      GLOBAL.alergiaMedicamentos,
      GLOBAL.diabetes,
      GLOBAL.hipertensao,
      GLOBAL.gestante,
      'Já passou por gestação? (quantas e quando)',
      'Está no período de puerpério?',
      'Qual foi o tipo de parto? (normal, cesárea, fórceps)',
      'Apresenta incontinência urinária ou fecal?',
      'Utiliza anticoncepcional hormonal?',
      'Apresenta diástase abdominal?',
      'Realizou cirurgia pélvica ou abdominal?',
      'Possui restrição médica para exercícios?',
      'Qual o objetivo principal com o tratamento fisioterapêutico?',
      GLOBAL.observacoes,
    ],
  },
  {
    name: 'Anamnese pediátrica',
    activeQuestionTexts: [
      GLOBAL.queixaPrincipal,
      'A criança nasceu prematura?',
      'Apresenta atraso no desenvolvimento motor?',
      'Possui síndrome ou condição genética diagnosticada?',
      'A criança frequenta escola ou creche?',
      'Apresenta alterações posturais ou de marcha?',
      GLOBAL.medicacaoContinua,
      GLOBAL.alergiaMedicamentos,
      'Já foi submetido(a) a cirurgias? (quais e quando)',
      'Possui restrição médica para exercícios?',
      'Qual o objetivo principal com o tratamento fisioterapêutico?',
      GLOBAL.observacoes,
    ],
  },
];
