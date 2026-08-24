import type {
  PatientNutritionAnamnesis,
  PatientNutritionAnamnesisAnswer,
} from '../types/patient-nutrition-anamnesis';

/**
 * Catálogo de perguntas da anamnese do "Inicializar" da nutrição.
 *
 * Os `id` e `value` são persistidos no JSON da inicialização — alterá-los
 * invalida respostas já gravadas. Para mudar o texto exibido, altere só o
 * `label`.
 */
export const NUTRITION_ANAMNESIS_OTHER_VALUE = 'outro';

export type NutritionAnamnesisOption = {
  value: string;
  label: string;
};

export type NutritionAnamnesisQuestion = {
  id: string;
  label: string;
  options: readonly NutritionAnamnesisOption[];
};

const YES_NO_OTHER_OPTIONS: readonly NutritionAnamnesisOption[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: NUTRITION_ANAMNESIS_OTHER_VALUE, label: 'Outro' },
];

function yesNoOtherQuestion(
  id: string,
  label: string,
): NutritionAnamnesisQuestion {
  return { id, label, options: YES_NO_OTHER_OPTIONS };
}

export const NUTRITION_ANAMNESIS_QUESTIONS: readonly NutritionAnamnesisQuestion[] =
  [
    yesNoOtherQuestion('gestante', 'Gestante?'),
    yesNoOtherQuestion('tabagista', 'Tabagista?'),
    yesNoOtherQuestion('diabetes', 'Possui diabetes?'),
    yesNoOtherQuestion('hipertensao', 'Possui hipertensão?'),
    yesNoOtherQuestion('marcapasso', 'Utiliza marcapasso?'),
    yesNoOtherQuestion(
      'alteracoes-hormonais',
      'Possui alterações hormonais ou na tireóide?',
    ),
    yesNoOtherQuestion('doenca-hepatica', 'Possui doença hepática?'),
    yesNoOtherQuestion('filtro-solar', 'Utiliza filtro solar diariamente?'),
    yesNoOtherQuestion(
      'medicamentos-continuos',
      'Utiliza medicamentos contínuos?',
    ),
    yesNoOtherQuestion('atividade-fisica', 'Realiza atividade física regular?'),
    yesNoOtherQuestion('cirurgia', 'Já fez cirurgia?'),
    {
      id: 'patologias-cutaneas',
      label: 'Patologias cutâneas?',
      options: [
        { value: 'psoriase', label: 'Psoríase' },
        { value: 'vitiligo', label: 'Vitiligo' },
        { value: 'lupus', label: 'Lúpus' },
        { value: 'rosacea', label: 'Rosácea' },
        { value: NUTRITION_ANAMNESIS_OTHER_VALUE, label: 'Outro' },
      ],
    },
    {
      id: 'alteracoes-pigmentares',
      label: 'Alterações pigmentares cutâneas?',
      options: [
        { value: 'sardas', label: 'Sardas' },
        { value: 'manchas-senis', label: 'Manchas senis' },
        { value: 'melasma', label: 'Melasma' },
        {
          value: 'sequela-cicatrizes',
          label: 'Manchas por sequela de cicatrizes',
        },
        { value: NUTRITION_ANAMNESIS_OTHER_VALUE, label: 'Outro' },
      ],
    },
  ];

export function createEmptyNutritionAnamnesis(): PatientNutritionAnamnesis {
  return {
    chiefComplaint: '',
    previousTreatments: '',
    answers: {},
    notes: '',
  };
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function parseAnswer(raw: unknown, question: NutritionAnamnesisQuestion) {
  if (!raw || typeof raw !== 'object') return null;

  const { value, otherText } = raw as Record<string, unknown>;
  if (typeof value !== 'string') return null;
  if (!question.options.some((option) => option.value === value)) return null;

  return typeof otherText === 'string' && otherText.length > 0
    ? { value, otherText }
    : { value };
}

/** Lê a anamnese do JSON persistido, descartando respostas fora do catálogo. */
export function parseNutritionAnamnesis(
  section: unknown,
): PatientNutritionAnamnesis {
  if (!section || typeof section !== 'object') {
    return createEmptyNutritionAnamnesis();
  }

  const source = section as Record<string, unknown>;
  const rawAnswers =
    source.answers && typeof source.answers === 'object'
      ? (source.answers as Record<string, unknown>)
      : {};

  const answers = NUTRITION_ANAMNESIS_QUESTIONS.reduce<
    Record<string, PatientNutritionAnamnesisAnswer>
  >((accumulated, question) => {
    const answer = parseAnswer(rawAnswers[question.id], question);
    return answer ? { ...accumulated, [question.id]: answer } : accumulated;
  }, {});

  return {
    chiefComplaint: readString(source, 'chiefComplaint'),
    previousTreatments: readString(source, 'previousTreatments'),
    answers,
    notes: readString(source, 'notes'),
  };
}
