import type {
  AnamnesisAlertTrigger,
  AnamnesisQuestionType,
  CustomQuestionInput,
} from '../../application/dtos/anamnesis.dto';
import { InvalidAnamnesisQuestionError } from '../errors/invalid-anamnesis-question.error';

const ALERT_SUPPORTED_TYPES: AnamnesisQuestionType[] = [
  'yes_no_unknown',
  'yes_no_unknown_text',
];

const MIN_SINGLE_CHOICE_OPTIONS = 2;

export function anamnesisQuestionTypeSupportsAlert(
  type: AnamnesisQuestionType,
): boolean {
  return ALERT_SUPPORTED_TYPES.includes(type);
}

export function validateCustomQuestionInput(
  question: CustomQuestionInput,
  context: string,
): void {
  const text = question.text.trim();
  if (!text) {
    throw new InvalidAnamnesisQuestionError(
      context,
      'Enunciado da pergunta é obrigatório',
    );
  }

  if (
    question.type === 'yes_no_unknown_text' &&
    !question.auxiliaryText?.trim()
  ) {
    throw new InvalidAnamnesisQuestionError(
      context,
      'Texto auxiliar é obrigatório para este tipo de pergunta',
    );
  }

  if (question.type === 'single_choice') {
    const options = (question.options ?? []).filter(
      (option) => option.value.trim() && option.label.trim(),
    );
    if (options.length < MIN_SINGLE_CHOICE_OPTIONS) {
      throw new InvalidAnamnesisQuestionError(
        context,
        'Pergunta de escolha única precisa de pelo menos duas opções',
      );
    }
  }

  if (
    question.generatesAlert &&
    anamnesisQuestionTypeSupportsAlert(question.type)
  ) {
    if (!question.alertWhen) {
      throw new InvalidAnamnesisQuestionError(
        context,
        'Informe quando o alerta deve ser gerado',
      );
    }
    if (!question.alertName?.trim()) {
      throw new InvalidAnamnesisQuestionError(
        context,
        'Nome do alerta é obrigatório',
      );
    }
  }
}

export function normalizeAlertWhen(
  type: AnamnesisQuestionType,
  generatesAlert: boolean,
  alertWhen?: AnamnesisAlertTrigger,
): AnamnesisAlertTrigger | undefined {
  if (!generatesAlert || !anamnesisQuestionTypeSupportsAlert(type)) {
    return undefined;
  }
  return alertWhen;
}
