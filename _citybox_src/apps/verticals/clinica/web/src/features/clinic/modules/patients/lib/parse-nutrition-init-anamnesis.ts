import type {
  PatientAnamnesisAnswer,
  PatientAnamnesisQuestionSnapshot,
} from '../types/patient-anamnesis';
import {
  NUTRITION_ANAMNESIS_OTHER_VALUE,
  NUTRITION_ANAMNESIS_QUESTIONS,
  parseNutritionAnamnesis,
} from './nutrition-anamnesis-questions';

export type NutritionInitAnamnesisSnapshot = {
  templateId?: string;
  templateName?: string;
  consultationReason: string;
  questions: PatientAnamnesisQuestionSnapshot[];
  answers: PatientAnamnesisAnswer[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseSnapshotQuestions(raw: unknown): PatientAnamnesisQuestionSnapshot[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.text !== 'string') {
      return [];
    }

    return [
      {
        id: item.id,
        text: item.text,
        type: item.type as PatientAnamnesisQuestionSnapshot['type'],
        generatesAlert: item.generatesAlert === true,
        alertWhen: item.alertWhen === 'yes' || item.alertWhen === 'no' ? item.alertWhen : undefined,
        alertName: typeof item.alertName === 'string' ? item.alertName : undefined,
        auxiliaryText: typeof item.auxiliaryText === 'string' ? item.auxiliaryText : undefined,
        options: Array.isArray(item.options)
          ? item.options.flatMap((option) => {
              if (!isRecord(option) || typeof option.value !== 'string' || typeof option.label !== 'string') {
                return [];
              }
              return [
                {
                  value: option.value,
                  label: option.label,
                  ...(option.allowsOther === true ? { allowsOther: true } : {}),
                },
              ];
            })
          : undefined,
      },
    ];
  });
}

function parseSnapshotAnswers(raw: unknown): PatientAnamnesisAnswer[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => {
    if (!isRecord(item) || typeof item.questionId !== 'string') {
      return [];
    }

    return [
      {
        questionId: item.questionId,
        ...(typeof item.triState === 'string' ? { triState: item.triState as PatientAnamnesisAnswer['triState'] } : {}),
        ...(typeof item.lateral === 'string' ? { lateral: item.lateral as PatientAnamnesisAnswer['lateral'] } : {}),
        ...(typeof item.text === 'string' ? { text: item.text } : {}),
        ...(typeof item.auxiliaryText === 'string' ? { auxiliaryText: item.auxiliaryText } : {}),
        ...(typeof item.choiceValue === 'string' ? { choiceValue: item.choiceValue } : {}),
      },
    ];
  });
}

function fromLegacySection(section: unknown): NutritionInitAnamnesisSnapshot {
  const legacy = parseNutritionAnamnesis(section);
  const questions: PatientAnamnesisQuestionSnapshot[] = [
    {
      id: 'previous-treatments',
      text: 'Tratamentos anteriores',
      type: 'rich_text',
    },
    ...NUTRITION_ANAMNESIS_QUESTIONS.map((question) => ({
      id: question.id,
      text: question.label,
      type: 'single_choice' as const,
      options: question.options.map((option) => ({
        value: option.value,
        label: option.label,
        ...(option.value === NUTRITION_ANAMNESIS_OTHER_VALUE ? { allowsOther: true } : {}),
      })),
    })),
    {
      id: 'notes',
      text: 'Observações',
      type: 'text',
    },
  ];

  const answers: PatientAnamnesisAnswer[] = [
    ...(legacy.previousTreatments
      ? [{ questionId: 'previous-treatments', text: legacy.previousTreatments }]
      : []),
    ...Object.entries(legacy.answers).map(([questionId, answer]) => ({
      questionId,
      choiceValue: answer.value,
      ...(answer.otherText ? { auxiliaryText: answer.otherText } : {}),
    })),
    ...(legacy.notes ? [{ questionId: 'notes', text: legacy.notes }] : []),
  ];

  return {
    templateName: 'Anamnese nutricional (legado)',
    consultationReason: legacy.chiefComplaint,
    questions,
    answers,
  };
}

export function parseNutritionInitAnamnesisSection(
  section: unknown,
): NutritionInitAnamnesisSnapshot | null {
  if (!isRecord(section)) {
    return null;
  }

  if (typeof section.templateId === 'string' || Array.isArray(section.questions)) {
    const questions = parseSnapshotQuestions(section.questions);
    const answers = parseSnapshotAnswers(section.answers);
    const consultationReason =
      typeof section.consultationReason === 'string' ? section.consultationReason : '';

    if (!questions.length && !consultationReason) {
      return null;
    }

    return {
      templateId: typeof section.templateId === 'string' ? section.templateId : undefined,
      templateName: typeof section.templateName === 'string' ? section.templateName : undefined,
      consultationReason,
      questions,
      answers,
    };
  }

  const legacy = fromLegacySection(section);
  if (!legacy.consultationReason && legacy.answers.length === 0) {
    return null;
  }

  return legacy;
}

export function formatNutritionAnamnesisAnswer(
  question: PatientAnamnesisQuestionSnapshot,
  answer: PatientAnamnesisAnswer | undefined,
): string {
  if (!answer) {
    return '';
  }

  if (question.type === 'rich_text' || question.type === 'text') {
    return (answer.text ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (question.type === 'single_choice') {
    const option = question.options?.find((item) => item.value === answer.choiceValue);
    const label = option?.label ?? answer.choiceValue ?? '';
    if (answer.auxiliaryText?.trim()) {
      return `${label} — ${answer.auxiliaryText.trim()}`;
    }
    return label;
  }

  if (answer.triState) {
    const labels = { yes: 'Sim', no: 'Não', unknown: 'Não sei' } as const;
    const base = labels[answer.triState];
    return answer.auxiliaryText?.trim() ? `${base} — ${answer.auxiliaryText.trim()}` : base;
  }

  if (answer.lateral) {
    const labels = { left: 'Esquerda', right: 'Direita', unknown: 'Não sei' } as const;
    return labels[answer.lateral];
  }

  return '';
}
