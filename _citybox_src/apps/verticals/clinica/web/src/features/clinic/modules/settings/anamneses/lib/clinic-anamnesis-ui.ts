import type {
  AnamnesisAlertTrigger,
  AnamnesisQuestionScope,
  AnamnesisQuestionType,
  ClinicAnamnesisStatus,
} from '../types/clinic-anamnesis';

export const CLINIC_ANAMNESIS_STATUS_LABEL: Record<ClinicAnamnesisStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
};

export const ANAMNESIS_QUESTION_TYPE_LABEL: Record<AnamnesisQuestionType, string> = {
  yes_no_unknown: 'Sim/Não/Não sei',
  yes_no_unknown_text: 'Sim/Não/Não sei e Texto',
  text: 'Somente Texto',
  left_right_unknown: 'Esquerda/Direita/Não sei',
  rich_text: 'Texto rico',
  single_choice: 'Escolha única',
};

export const ANAMNESIS_QUESTION_TYPE_OPTIONS = Object.entries(ANAMNESIS_QUESTION_TYPE_LABEL).map(
  ([value, label]) => ({
    value: value as AnamnesisQuestionType,
    label,
  }),
);

export const ANAMNESIS_QUESTION_SCOPE_LABEL: Record<AnamnesisQuestionScope, string> = {
  global: 'Global',
  clinic: 'Clínica',
};

export const ANAMNESIS_ALERT_TRIGGER_LABEL: Record<AnamnesisAlertTrigger, string> = {
  yes: 'É um alerta quando responder sim',
  no: 'É um alerta quando responder não',
};

export const ANAMNESIS_ALERT_TRIGGER_OPTIONS = Object.entries(ANAMNESIS_ALERT_TRIGGER_LABEL).map(
  ([value, label]) => ({
    value: value as AnamnesisAlertTrigger,
    label,
  }),
);

export function anamnesisQuestionTypeSupportsAlert(type: AnamnesisQuestionType): boolean {
  return type === 'yes_no_unknown' || type === 'yes_no_unknown_text';
}

export function formatAnamnesisQuestionMeta(question: {
  type: AnamnesisQuestionType;
  generatesAlert?: boolean;
  alertName?: string;
}): string {
  const typeLabel = `Pergunta ${ANAMNESIS_QUESTION_TYPE_LABEL[question.type]}`;

  if (question.generatesAlert && question.alertName?.trim()) {
    return `Com alerta: ${question.alertName.trim()} - ${typeLabel}`;
  }

  return `Sem alerta - ${typeLabel}`;
}
