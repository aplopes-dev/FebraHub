'use client';

import { cn } from '@citybox/ui';
import { Label, RadioGroup, RadioGroupItem, Textarea, Input } from '@citybox/ui/atoms';
import { RichTextEditor } from '@citybox/ui/organisms';
import type { ClinicAnamnesisQuestion } from '@/features/clinic/modules/settings/anamneses/types/clinic-anamnesis';
import { selectedChoiceAllowsOther } from '@/features/clinic/modules/settings/anamneses/lib/anamnesis-question-options';
import type {
  PatientAnamnesisAnswer,
  PatientAnamnesisLateralAnswer,
  PatientAnamnesisTriStateAnswer,
} from '../../../types/patient-anamnesis';

type PatientAnamnesisQuestionFieldProps = {
  question: ClinicAnamnesisQuestion;
  orderNumber: number;
  value: PatientAnamnesisAnswer;
  disabled?: boolean;
  error?: string;
  onChange: (value: PatientAnamnesisAnswer) => void;
};

const TRI_STATE_OPTIONS: Array<{ value: PatientAnamnesisTriStateAnswer; label: string }> = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
  { value: 'unknown', label: 'Não sei' },
];

const LATERAL_OPTIONS: Array<{ value: PatientAnamnesisLateralAnswer; label: string }> = [
  { value: 'left', label: 'Esquerda' },
  { value: 'right', label: 'Direita' },
  { value: 'unknown', label: 'Não sei' },
];

function TriStateField({
  questionId,
  value,
  disabled,
  onChange,
}: {
  questionId: string;
  value?: PatientAnamnesisTriStateAnswer;
  disabled?: boolean;
  onChange: (next: PatientAnamnesisTriStateAnswer) => void;
}) {
  return (
    <RadioGroup
      value={value ?? ''}
      onValueChange={(next) => onChange(next as PatientAnamnesisTriStateAnswer)}
      className="flex flex-wrap gap-4"
      disabled={disabled}
    >
      {TRI_STATE_OPTIONS.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <RadioGroupItem
            value={option.value}
            id={`${questionId}-${option.value}`}
            disabled={disabled}
          />
          <Label htmlFor={`${questionId}-${option.value}`} className="font-normal">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

function shouldShowDescribeAnswer(triState?: PatientAnamnesisTriStateAnswer): boolean {
  return triState === 'yes';
}

function DescribeAnswerField({
  fieldId,
  value,
  disabled,
  placeholder,
  error,
  onChange,
}: {
  fieldId: string;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className={cn('font-normal', error ? 'text-destructive' : 'text-foreground')}>
        Descreva resposta
      </Label>
      <Textarea
        id={fieldId}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? 'Descreva sua resposta'}
        className="min-h-20"
        aria-invalid={Boolean(error)}
      />
    </div>
  );
}

function handleTriStateChange(
  value: PatientAnamnesisAnswer,
  triState: PatientAnamnesisTriStateAnswer,
  onChange: (value: PatientAnamnesisAnswer) => void,
): void {
  onChange({
    ...value,
    triState,
    auxiliaryText: shouldShowDescribeAnswer(triState) ? value.auxiliaryText : undefined,
  });
}

export function PatientAnamnesisQuestionField({
  question,
  orderNumber,
  value,
  disabled = false,
  error,
  onChange,
}: PatientAnamnesisQuestionFieldProps) {
  const fieldId = `anamnesis-question-${question.id}`;

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border bg-background/60 p-4',
        error ? 'border-destructive/60' : 'border-border/60',
      )}
      data-anamnesis-question-id={question.id}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Pergunta {orderNumber}</p>
        <Label
          htmlFor={fieldId}
          className={cn('text-base font-semibold', error ? 'text-destructive' : 'text-foreground')}
        >
          {question.text}
        </Label>
      </div>

      {question.type === 'text' ? (
        <Textarea
          id={fieldId}
          value={value.text ?? ''}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...value,
              text: event.target.value,
            })
          }
          placeholder="Digite sua resposta"
          className="min-h-24"
          aria-invalid={Boolean(error)}
        />
      ) : null}

      {question.type === 'rich_text' ? (
        <RichTextEditor
          value={value.text ?? ''}
          onChange={(text) => onChange({ ...value, text })}
          ariaLabel={question.text}
          placeholder="Digite sua resposta"
          toolbar="basic"
          disabled={disabled}
          className="min-h-[14rem]"
        />
      ) : null}

      {question.type === 'yes_no_unknown' ? (
        <TriStateField
          questionId={question.id}
          value={value.triState}
          disabled={disabled}
          onChange={(triState) => handleTriStateChange(value, triState, onChange)}
        />
      ) : null}

      {question.type === 'yes_no_unknown_text' ? (
        <div className="space-y-3">
          <TriStateField
            questionId={question.id}
            value={value.triState}
            disabled={disabled}
            onChange={(triState) => handleTriStateChange(value, triState, onChange)}
          />
          {shouldShowDescribeAnswer(value.triState) ? (
            <DescribeAnswerField
              fieldId={`${fieldId}-describe`}
              value={value.auxiliaryText ?? ''}
              disabled={disabled}
              placeholder={question.auxiliaryText}
              error={error}
              onChange={(auxiliaryText) =>
                onChange({
                  ...value,
                  auxiliaryText,
                })
              }
            />
          ) : null}
        </div>
      ) : null}

      {question.type === 'left_right_unknown' ? (
        <RadioGroup
          value={value.lateral ?? ''}
          onValueChange={(next) =>
            onChange({
              ...value,
              lateral: next as PatientAnamnesisLateralAnswer,
            })
          }
          className="flex flex-wrap gap-4"
          disabled={disabled}
        >
          {LATERAL_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={`${question.id}-${option.value}`}
                disabled={disabled}
              />
              <Label htmlFor={`${question.id}-${option.value}`} className="font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : null}

      {question.type === 'single_choice' ? (
        <div className="space-y-3">
          <RadioGroup
            value={value.choiceValue ?? ''}
            onValueChange={(choiceValue) =>
              onChange({
                ...value,
                choiceValue,
                auxiliaryText: selectedChoiceAllowsOther(question.options, choiceValue)
                  ? value.auxiliaryText
                  : undefined,
              })
            }
            className="gap-2.5"
            disabled={disabled}
          >
            {(question.options ?? []).map((option) => {
              const optionId = `${question.id}-${option.value}`;
              return (
                <div key={option.value} className="flex items-center gap-2.5">
                  <RadioGroupItem value={option.value} id={optionId} disabled={disabled} />
                  <Label htmlFor={optionId} className="cursor-pointer font-normal">
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
          {selectedChoiceAllowsOther(question.options, value.choiceValue) ? (
            <Input
              value={value.auxiliaryText ?? ''}
              placeholder="Descreva"
              aria-label={`${question.text} — descreva`}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...value,
                  auxiliaryText: event.target.value,
                })
              }
            />
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {question.generatesAlert && question.alertName ? (
        <p className={cn('text-xs text-amber-700 dark:text-amber-300')}>
          Alerta clínico: {question.alertName}
        </p>
      ) : null}
    </div>
  );
}
