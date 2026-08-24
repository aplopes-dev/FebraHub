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

export function slugifyOptionValue(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
