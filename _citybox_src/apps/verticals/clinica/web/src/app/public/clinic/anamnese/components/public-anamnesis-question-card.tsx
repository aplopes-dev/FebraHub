'use client';

import { cn } from '@citybox/ui';
import { Label, RadioGroup, RadioGroupItem, Textarea } from '@citybox/ui/atoms';
import type { PatientAnamnesisQuestionSnapshot } from '@/features/clinic/modules/patients/types/patient-anamnesis';
import type {
  PatientAnamnesisAnswer,
  PatientAnamnesisLateralAnswer,
  PatientAnamnesisTriStateAnswer,
} from '@/features/clinic/modules/patients/types/patient-anamnesis';

type PublicAnamnesisQuestionCardProps = {
  question: PatientAnamnesisQuestionSnapshot;
  orderNumber: number;
  value: PatientAnamnesisAnswer;
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

function shouldShowDescribeAnswer(triState?: PatientAnamnesisTriStateAnswer): boolean {
  return triState === 'yes';
}

function VerticalRadioOptions<T extends string>({
  value,
  options,
  name,
  onChange,
}: {
  value: T | undefined;
  options: Array<{ value: T; label: string }>;
  name: string;
  onChange: (next: T) => void;
}) {
  return (
    <RadioGroup
      value={value ?? ''}
      onValueChange={(next) => onChange(next as T)}
      className="flex flex-col gap-2"
    >
      {options.map((option) => {
        const optionId = `${name}-${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 px-3 py-3 transition-colors',
              value === option.value && 'border-primary bg-primary/5',
            )}
          >
            <RadioGroupItem value={option.value} id={optionId} className="shrink-0" />
            <span className="text-sm font-medium text-foreground">{option.label}</span>
          </label>
        );
      })}
    </RadioGroup>
  );
}

export function PublicAnamnesisQuestionCard({
  question,
  orderNumber,
  value,
  onChange,
}: PublicAnamnesisQuestionCardProps) {
  const fieldId = `public-anamnesis-${question.id}`;

  return (
    <div className="w-full rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-primary">Pergunta {orderNumber}</p>
        <Label htmlFor={fieldId} className="text-base font-semibold leading-snug text-foreground">
          {question.text}
        </Label>
      </div>

      <div className="mt-4 space-y-3">
        {question.type === 'text' || question.type === 'rich_text' ? (
          <Textarea
            id={fieldId}
            value={value.text ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                text: event.target.value,
              })
            }
            placeholder="Digite sua resposta"
            className="min-h-24 w-full resize-none"
          />
        ) : null}

        {question.type === 'yes_no_unknown' ? (
          <VerticalRadioOptions
            name={question.id}
            value={value.triState}
            options={TRI_STATE_OPTIONS}
            onChange={(triState) =>
              onChange({
                ...value,
                triState,
                auxiliaryText: undefined,
              })
            }
          />
        ) : null}

        {question.type === 'yes_no_unknown_text' ? (
          <>
            <VerticalRadioOptions
              name={question.id}
              value={value.triState}
              options={TRI_STATE_OPTIONS}
              onChange={(triState) =>
                onChange({
                  ...value,
                  triState,
                  auxiliaryText: shouldShowDescribeAnswer(triState) ? value.auxiliaryText : undefined,
                })
              }
            />
            {shouldShowDescribeAnswer(value.triState) ? (
              <div className="space-y-1.5">
                <Label htmlFor={`${fieldId}-describe`} className="text-sm font-normal text-foreground">
                  Descreva resposta
                </Label>
                <Textarea
                  id={`${fieldId}-describe`}
                  value={value.auxiliaryText ?? ''}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      auxiliaryText: event.target.value,
                    })
                  }
                  placeholder={question.auxiliaryText ?? 'Descreva sua resposta'}
                  className="min-h-20 w-full resize-none"
                />
              </div>
            ) : null}
          </>
        ) : null}

        {question.type === 'left_right_unknown' ? (
          <VerticalRadioOptions
            name={question.id}
            value={value.lateral}
            options={LATERAL_OPTIONS}
            onChange={(lateral) =>
              onChange({
                ...value,
                lateral,
              })
            }
          />
        ) : null}

        {question.type === 'single_choice' ? (
          <>
            <VerticalRadioOptions
              name={question.id}
              value={value.choiceValue}
              options={(question.options ?? []).map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(choiceValue) =>
                onChange({
                  ...value,
                  choiceValue,
                  auxiliaryText: (question.options ?? []).some(
                    (option) => option.value === choiceValue && option.allowsOther,
                  )
                    ? value.auxiliaryText
                    : undefined,
                })
              }
            />
            {(question.options ?? []).some(
              (option) => option.value === value.choiceValue && option.allowsOther,
            ) ? (
              <div className="space-y-1.5">
                <Label htmlFor={`${fieldId}-other`} className="text-sm font-normal text-foreground">
                  Descreva resposta
                </Label>
                <Textarea
                  id={`${fieldId}-other`}
                  value={value.auxiliaryText ?? ''}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      auxiliaryText: event.target.value,
                    })
                  }
                  placeholder="Descreva sua resposta"
                  className="min-h-20 w-full resize-none"
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
