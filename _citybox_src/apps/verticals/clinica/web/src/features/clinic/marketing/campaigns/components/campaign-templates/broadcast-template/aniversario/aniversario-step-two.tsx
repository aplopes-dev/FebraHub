'use client';

import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@citybox/ui/atoms';
import { useWhatsappTemplatesQuery } from '@/features/clinic/modules/settings/whatsapp/hooks/use-whatsapp-queries';
import { MultipleSelectorField } from '../../../../_ui/fields';
import {
  aniversarioStepTwoSchema,
  DEFAULT_ANIVERSARIO_MESSAGE,
  EMPTY_ANIVERSARIO_STEP_TWO,
  type AniversarioStepTwoFormData,
} from './aniversario-form.schema';
import { useBirthdayAudienceOptions } from './use-birthday-audience-options';

type AniversarioStepTwoProps = {
  initialData?: Partial<AniversarioStepTwoFormData>;
  onDataChange?: (data: AniversarioStepTwoFormData) => void;
  onValidationChange?: (isValid: boolean) => void;
};

export function AniversarioStepTwo({
  initialData,
  onDataChange,
  onValidationChange,
}: AniversarioStepTwoProps) {
  const { planOptions, specialtyOptions, genderOptions, isLoading } =
    useBirthdayAudienceOptions();
  const templatesQuery = useWhatsappTemplatesQuery();
  const hydratedFromSettingsRef = useRef(false);

  const [values, setValues] = useState<AniversarioStepTwoFormData>({
    ...EMPTY_ANIVERSARIO_STEP_TWO,
    ...initialData,
    messageBody: initialData?.messageBody?.trim() || '',
  });

  useEffect(() => {
    if (hydratedFromSettingsRef.current) return;
    if (initialData?.messageBody?.trim()) {
      hydratedFromSettingsRef.current = true;
      return;
    }

    if (templatesQuery.isLoading) return;

    const birthdayBody =
      templatesQuery.data
        ?.find((item) => item.key === 'birthday')
        ?.body.trim() || DEFAULT_ANIVERSARIO_MESSAGE;

    hydratedFromSettingsRef.current = true;
    setValues((current) => {
      if (current.messageBody.trim()) return current;
      return { ...current, messageBody: birthdayBody };
    });
  }, [
    initialData?.messageBody,
    templatesQuery.data,
    templatesQuery.isLoading,
  ]);

  useEffect(() => {
    onDataChange?.(values);
    const parsed = aniversarioStepTwoSchema.safeParse(values);
    onValidationChange?.(parsed.success);
  }, [values, onDataChange, onValidationChange]);

  const patch = (partial: Partial<AniversarioStepTwoFormData>) => {
    setValues((current) => ({ ...current, ...partial }));
  };

  const messagePlaceholder =
    templatesQuery.isLoading
      ? 'Carregando texto das Configurações WhatsApp…'
      : DEFAULT_ANIVERSARIO_MESSAGE;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold">Definir público</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Define o público que você deseja alcançar com a campanha de
          Aniversário. Você pode segmentar seu público por um ou mais planos,
          especialidades de procedimentos ou gênero.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MultipleSelectorField
          label="Plano"
          placeholder={isLoading ? 'Carregando…' : 'Todos os planos'}
          options={planOptions}
          value={values.planIds}
          onValueChange={(planIds) => patch({ planIds })}
        />
        <MultipleSelectorField
          label="Especialidades"
          placeholder={isLoading ? 'Carregando…' : 'Todas as especialidades'}
          options={specialtyOptions}
          value={values.specialtyIds}
          onValueChange={(specialtyIds) => patch({ specialtyIds })}
        />
        <MultipleSelectorField
          label="Gênero"
          placeholder="Todos os gêneros"
          options={genderOptions}
          value={values.genders}
          onValueChange={(genders) =>
            patch({
              genders: genders as AniversarioStepTwoFormData['genders'],
            })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="aniversario-message">
          Mensagem
        </label>
        <Textarea
          id="aniversario-message"
          rows={8}
          value={values.messageBody}
          onChange={(event) => patch({ messageBody: event.target.value })}
          placeholder={messagePlaceholder}
          disabled={templatesQuery.isLoading && !values.messageBody}
        />
        <p className="text-muted-foreground text-xs">
          Texto inicial igual ao template Aniversário em Configurações →
          WhatsApp. Variáveis: {'{nome_paciente}'}, {'{nome_clinica}'},{' '}
          {'{telefone_clinica}'}
        </p>
      </div>
    </div>
  );
}
