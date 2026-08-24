'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import {
  CLINIC_NESTED_SHEET_BACKDROP_CLASS,
  CLINIC_NESTED_SHEET_CONTENT_CLASS,
  CLINIC_NESTED_SHEET_CONTENT_PROPS,
  CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { useAnamnesisQuestionForm } from '../lib/use-anamnesis-question-form';
import {
  ANAMNESIS_ALERT_TRIGGER_OPTIONS,
  ANAMNESIS_QUESTION_TYPE_OPTIONS,
  anamnesisQuestionTypeSupportsAlert,
} from '../lib/clinic-anamnesis-ui';
import type { ClinicAnamnesisQuestion } from '../types/clinic-anamnesis';

type AddAnamnesisQuestionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingQuestion?: ClinicAnamnesisQuestion | null;
  onSuccess?: (question: ClinicAnamnesisQuestion) => void;
};

export function AddAnamnesisQuestionSheet({
  open,
  onOpenChange,
  editingQuestion = null,
  onSuccess,
}: AddAnamnesisQuestionSheetProps) {
  const { values, errors, isSubmitting, isEditing, patch, reset, initializeFromQuestion, submit } =
    useAnamnesisQuestionForm();

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    if (editingQuestion) {
      initializeFromQuestion(editingQuestion);
      return;
    }

    reset();
  }, [editingQuestion, initializeFromQuestion, open, reset]);

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    const question = await submit();
    if (question) {
      onSuccess?.(question);
      onOpenChange(false);
    }
  };

  const supportsAlert = anamnesisQuestionTypeSupportsAlert(values.type);

  return (
    <>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <button
              type="button"
              className={cn(CLINIC_NESTED_SHEET_BACKDROP_CLASS, 'cursor-default border-0 p-0')}
              aria-label="Fechar formulário de pergunta"
              onClick={() => onOpenChange(false)}
            />,
            document.body,
          )
        : null}

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          {...CLINIC_NESTED_SHEET_CONTENT_PROPS}
          className={cn('flex flex-col gap-0 p-0', CLINIC_NESTED_SHEET_CONTENT_CLASS)}
        >
          <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
            <SheetTitle className="font-bold">
              {isEditing ? 'Editar pergunta' : 'Nova pergunta'}
            </SheetTitle>
          </SheetHeader>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
            {isSubmitting ? (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando pergunta…
                </div>
              </div>
            ) : null}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="anamnesis-question-text">Pergunta</Label>
                <Input
                  id="anamnesis-question-text"
                  value={values.text}
                  onChange={(event) => patch({ text: event.target.value })}
                  placeholder="Ex.: Possui alergia a medicamentos?"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.text}
                />
                {errors.text ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.text}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="anamnesis-question-type">Tipo da pergunta</Label>
                <Select
                  value={values.type}
                  onValueChange={(value) => patch({ type: value as typeof values.type })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="anamnesis-question-type"
                    className="w-full"
                    aria-invalid={!!errors.type}
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent
                    className={CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS}
                    position="popper"
                  >
                    {ANAMNESIS_QUESTION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.type}
                  </p>
                ) : null}
              </div>

              {values.type === 'single_choice' ? (
                <div className="space-y-3">
                  <Label>Opções</Label>
                  {values.options.map((option, index) => (
                    <div
                      key={option.value || `option-new-${index}`}
                      className="grid gap-2 sm:grid-cols-[1fr_auto]"
                    >
                      <Input
                        value={option.label}
                        placeholder={`Opção ${index + 1}`}
                        disabled={isSubmitting}
                        onChange={(event) => {
                          const next = values.options.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, label: event.target.value }
                              : item,
                          );
                          patch({ options: next });
                        }}
                      />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={option.allowsOther === true}
                          disabled={isSubmitting}
                          aria-label={`Opção ${index + 1}: permite resposta aberta (Outro)`}
                          onCheckedChange={(checked) => {
                            const next = values.options.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, allowsOther: checked === true }
                                : item,
                            );
                            patch({ options: next });
                          }}
                        />
                        <span aria-hidden>Outro</span>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      patch({
                        options: [
                          ...values.options,
                          {
                            value: `opt-${crypto.randomUUID()}`,
                            label: '',
                          },
                        ],
                      })
                    }
                  >
                    Adicionar opção
                  </Button>
                  {errors.options ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.options}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {values.type === 'yes_no_unknown_text' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="anamnesis-question-auxiliary-text">
                    Texto da Pergunta auxiliar
                  </Label>
                  <Input
                    id="anamnesis-question-auxiliary-text"
                    value={values.auxiliaryText}
                    onChange={(event) => patch({ auxiliaryText: event.target.value })}
                    placeholder="Ex.: Qual medicamento?"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.auxiliaryText}
                  />
                  {errors.auxiliaryText ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.auxiliaryText}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {supportsAlert ? (
                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                  <Checkbox
                    id="anamnesis-question-generates-alert"
                    checked={values.generatesAlert}
                    disabled={isSubmitting}
                    onCheckedChange={(checked) => patch({ generatesAlert: checked === true })}
                  />
                  <Label
                    htmlFor="anamnesis-question-generates-alert"
                    className="text-sm font-normal leading-snug"
                  >
                    Esta pergunta gera um alerta
                  </Label>
                </div>
              ) : null}

              {supportsAlert && values.generatesAlert ? (
                <div className="grid gap-4 rounded-lg border border-border/60 bg-background/60 p-4 sm:grid-cols-2 sm:items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="anamnesis-question-alert-when">Condição do alerta</Label>
                    <Select
                      value={values.alertWhen || undefined}
                      onValueChange={(value) =>
                        patch({ alertWhen: value as typeof values.alertWhen })
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        id="anamnesis-question-alert-when"
                        className="w-full"
                        aria-invalid={!!errors.alertWhen}
                      >
                        <SelectValue placeholder="Selecione a condição" />
                      </SelectTrigger>
                      <SelectContent
                        className={CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS}
                        position="popper"
                      >
                        {ANAMNESIS_ALERT_TRIGGER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.alertWhen ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.alertWhen}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="anamnesis-question-alert-name">Nome do alerta</Label>
                    <Input
                      id="anamnesis-question-alert-name"
                      value={values.alertName}
                      onChange={(event) => patch({ alertName: event.target.value })}
                      placeholder="Ex.: Alergia medicamentosa"
                      disabled={isSubmitting}
                      aria-invalid={!!errors.alertName}
                    />
                    {errors.alertName ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.alertName}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
            <Button
              type="button"
              variant="ghost"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Fechar
            </Button>
            <Button
              type="button"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              onClick={() => void handleSave()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : isEditing ? (
                'Salvar'
              ) : (
                'Adicionar'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
