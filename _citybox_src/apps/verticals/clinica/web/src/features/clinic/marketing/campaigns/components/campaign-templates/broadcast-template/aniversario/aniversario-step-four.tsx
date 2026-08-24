'use client';

import { useEffect, useState } from 'react';
import { Input } from '@citybox/ui/atoms';
import {
  aniversarioStepFourSchema,
  EMPTY_ANIVERSARIO_STEP_FOUR,
  type AniversarioStepFourFormData,
  type AniversarioStepTwoFormData,
} from './aniversario-form.schema';

type AniversarioStepFourProps = {
  stepTwoData?: Partial<AniversarioStepTwoFormData>;
  initialData?: Partial<AniversarioStepFourFormData>;
  onDataChange?: (data: AniversarioStepFourFormData) => void;
  onValidationChange?: (isValid: boolean) => void;
};

export function AniversarioStepFour({
  stepTwoData,
  initialData,
  onDataChange,
  onValidationChange,
}: AniversarioStepFourProps) {
  const [values, setValues] = useState<AniversarioStepFourFormData>({
    ...EMPTY_ANIVERSARIO_STEP_FOUR,
    ...initialData,
  });

  useEffect(() => {
    onDataChange?.(values);
    onValidationChange?.(aniversarioStepFourSchema.safeParse(values).success);
  }, [values, onDataChange, onValidationChange]);

  const planCount = stepTwoData?.planIds?.length ?? 0;
  const specialtyCount = stepTwoData?.specialtyIds?.length ?? 0;
  const genderCount = stepTwoData?.genders?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold">Ativar campanha</h2>
        <p className="text-muted-foreground text-sm">
          Ao ativar, o sistema envia agora para quem faz aniversário hoje e,
          enquanto a campanha estiver ativa, dispara todos os dias às 7h
          (horário de Brasília).
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="aniversario-name">
          Nome da campanha
        </label>
        <Input
          id="aniversario-name"
          value={values.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
        <p className="font-medium text-foreground">Resumo do público</p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>
            Planos:{' '}
            {planCount === 0 ? 'Todos' : `${planCount} selecionado(s)`}
          </li>
          <li>
            Especialidades:{' '}
            {specialtyCount === 0
              ? 'Todas'
              : `${specialtyCount} selecionada(s)`}
          </li>
          <li>
            Gênero:{' '}
            {genderCount === 0 ? 'Todos' : `${genderCount} selecionado(s)`}
          </li>
        </ul>
      </div>
    </div>
  );
}
