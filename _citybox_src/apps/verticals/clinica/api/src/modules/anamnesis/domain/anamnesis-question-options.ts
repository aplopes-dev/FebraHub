export const ANAMNESIS_QUESTION_TYPES = [
  'yes_no_unknown',
  'yes_no_unknown_text',
  'text',
  'left_right_unknown',
  'rich_text',
  'single_choice',
] as const;

export type AnamnesisQuestionType = (typeof ANAMNESIS_QUESTION_TYPES)[number];

export type AnamnesisQuestionOption = {
  value: string;
  label: string;
  allowsOther?: boolean;
};

export const YES_NO_OTHER_OPTIONS: readonly AnamnesisQuestionOption[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'outro', label: 'Outro', allowsOther: true },
];

export function isHtmlFilled(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return (
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .trim().length > 0
  );
}

export function parseAnamnesisQuestionOptions(
  raw: unknown,
): AnamnesisQuestionOption[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const options: AnamnesisQuestionOption[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const record = item as Record<string, unknown>;
    const value = typeof record.value === 'string' ? record.value.trim() : '';
    const label = typeof record.label === 'string' ? record.label.trim() : '';
    if (!value || !label || seen.has(value)) {
      continue;
    }

    seen.add(value);
    options.push({
      value,
      label,
      ...(record.allowsOther === true ? { allowsOther: true } : {}),
    });
  }

  return options.length > 0 ? options : undefined;
}

export function selectedChoiceAllowsOther(
  options: readonly AnamnesisQuestionOption[] | undefined,
  choiceValue: string | undefined,
): boolean {
  if (!choiceValue || !options) {
    return false;
  }

  return options.some(
    (option) => option.value === choiceValue && option.allowsOther === true,
  );
}
