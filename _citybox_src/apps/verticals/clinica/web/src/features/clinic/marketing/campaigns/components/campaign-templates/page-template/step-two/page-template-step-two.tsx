"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@citybox/ui/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import { TextField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import { TextareaField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import { SelectField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import { Switch } from "@citybox/ui/atoms";
import { RadioGroup } from "@citybox/ui/atoms";
import { Badge } from "@citybox/ui/atoms";
import { useFunnels } from "@/features/clinic/vendas/hooks/use-funnels";
import type { Funnel } from "@/features/clinic/vendas/services/sales.service";
import {
  pageStrategySchema,
  type PageStrategyFormData,
} from "./page-template-step-two.schema";
import {
  OWNER_OPTIONS,
  DUPLICITY_RULE_OPTIONS,
  SUCCESS_ACTION_OPTIONS,
} from "./page-template-step-two.constants";
import { RadioCard } from "../radio-card";

const EMPTY_FUNNELS: Funnel[] = [];

type PageTemplateStepTwoProps = {
  selectedType?: { segmentId: string; typeId: string };
  initialData?: Partial<PageStrategyFormData>;
  onDataChange?: (data: Partial<PageStrategyFormData>) => void;
  onValidationChange?: (isValid: boolean) => void;
};

export function PageTemplateStepTwo({
  initialData,
  onDataChange,
  onValidationChange,
}: PageTemplateStepTwoProps) {
  const { data: funnelsData, isLoading: isLoadingFunnels } = useFunnels();
  const funnels = funnelsData ?? EMPTY_FUNNELS;
  const lastFunnelIdRef = useRef<string | undefined>(undefined);

  const form = useForm<PageStrategyFormData>({
    resolver: zodResolver(pageStrategySchema),
    defaultValues: {
      name: initialData?.name || "",
      formDescription: initialData?.formDescription || "",
      funnelId: initialData?.funnelId || "",
      stageId: initialData?.stageId || "",
      ownerId: initialData?.ownerId || "none",
      notifyOnLead: initialData?.notifyOnLead ?? false,
      notificationChannels: initialData?.notificationChannels || [],
      tags: initialData?.tags || [],
      duplicityRule: initialData?.duplicityRule || "block",
      fbPixelId: initialData?.fbPixelId || "",
      googleTagId: initialData?.googleTagId || "",
      successAction: initialData?.successAction || "message",
      successMessage:
        initialData?.successMessage ||
        "Obrigado! Sua mensagem foi enviada com sucesso. Entraremos em contato em breve.",
      redirectUrl: initialData?.redirectUrl || "",
    },
  });

  const watchedFunnelId = form.watch("funnelId");
  const watchedSuccessAction = form.watch("successAction");

  // Resetar stageId quando funil mudar e selecionar primeira etapa
  useEffect(() => {
    // Evitar loop: só executar se funis estiverem carregados e se o funil realmente mudou
    if (isLoadingFunnels || funnels.length === 0) return;

    const currentFunnelId = watchedFunnelId || "";

    // Se o funil não mudou, não fazer nada
    if (lastFunnelIdRef.current === currentFunnelId) return;

    // Atualizar referência
    lastFunnelIdRef.current = currentFunnelId;

    // Se não há funil selecionado, limpar etapa
    if (!currentFunnelId || currentFunnelId.trim() === "") {
      const currentStageId = form.getValues("stageId");
      if (currentStageId && currentStageId.trim() !== "") {
        form.setValue("stageId", "", {
          shouldValidate: false,
          shouldDirty: false,
        });
      }
      return;
    }

    const selectedFunnel = funnels.find((f) => f.id === currentFunnelId);
    if (!selectedFunnel) {
      // Se o funil não existe mais, limpar etapa
      const currentStageId = form.getValues("stageId");
      if (currentStageId && currentStageId.trim() !== "") {
        form.setValue("stageId", "", {
          shouldValidate: false,
          shouldDirty: false,
        });
      }
      return;
    }

    const currentStageId = form.getValues("stageId");
    // Verificar se a etapa atual pertence ao funil selecionado
    const stageBelongsToFunnel = selectedFunnel.stages.some(
      (s) => s.id === currentStageId,
    );

    // Se a etapa atual pertence ao funil, não fazer nada
    if (stageBelongsToFunnel) return;

    // Selecionar primeira etapa (order 0) ou a primeira disponível
    const firstStage =
      selectedFunnel.stages
        .sort((a, b) => a.order - b.order)
        .find((s) => s.order === 0) ||
      selectedFunnel.stages.sort((a, b) => a.order - b.order)[0];

    if (firstStage) {
      form.setValue("stageId", firstStage.id, {
        shouldValidate: false,
        shouldDirty: false,
      });
    } else {
      form.setValue("stageId", "", {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [watchedFunnelId, funnels, isLoadingFunnels, form]);

  // Notificar mudanças nos dados
  useEffect(() => {
    if (!onDataChange) return;

    const subscription = form.watch((data) => {
      onDataChange(data as Partial<PageStrategyFormData>);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDataChange]);

  // Validar campos obrigatórios e notificar componente pai
  useEffect(() => {
    if (!onValidationChange) return;

    const validateForm = () => {
      // Campo obrigatório: name
      const name = form.getValues("name");
      const hasName =
        !!name && typeof name === "string" && name.trim().length >= 3;

      if (!hasName) {
        onValidationChange?.(false);
        return;
      }

      // Se funil foi selecionado, stageId é obrigatório
      const funnelId = form.getValues("funnelId");
      if (funnelId && typeof funnelId === "string" && funnelId.trim() !== "") {
        const stageId = form.getValues("stageId");
        const hasStageId =
          !!stageId && typeof stageId === "string" && stageId.trim() !== "";
        if (!hasStageId) {
          onValidationChange?.(false);
          return;
        }
      }

      // Validação condicional baseada em successAction
      const successAction = form.getValues("successAction");
      if (successAction === "message") {
        const successMessage = form.getValues("successMessage");
        const hasMessage =
          !!successMessage &&
          typeof successMessage === "string" &&
          successMessage.trim().length > 0;
        onValidationChange?.(hasMessage);
      } else if (successAction === "redirect") {
        const redirectUrl = form.getValues("redirectUrl");
        const hasUrl =
          !!redirectUrl &&
          typeof redirectUrl === "string" &&
          redirectUrl.trim().length > 0;
        onValidationChange?.(hasUrl);
      } else {
        onValidationChange?.(true);
      }
    };

    // Validar imediatamente
    validateForm();

    // Validar quando campos relevantes mudarem
    const subscription = form.watch(() => {
      validateForm();
    });

    return () => subscription.unsubscribe();
  }, [form, onValidationChange]);

  // Opções de funis para o Select
  const funnelOptions = useMemo(() => {
    return [
      { value: "none", label: "Nenhum" },
      ...funnels.map((funnel) => ({
        value: funnel.id,
        label: funnel.name,
      })),
    ];
  }, [funnels]);

  // Etapas do funil selecionado
  const stageOptions = useMemo(() => {
    if (!watchedFunnelId) return [];
    const selectedFunnel = funnels.find((f) => f.id === watchedFunnelId);
    if (!selectedFunnel) return [];
    return selectedFunnel.stages
      .sort((a, b) => a.order - b.order)
      .map((stage) => ({
        value: stage.id,
        label: stage.name,
      }));
  }, [watchedFunnelId, funnels]);

  const handleTagInputChange = (value: string) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    form.setValue("tags", tags);
  };

  const tagsInputValue = form.watch("tags")?.join(", ") || "";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Objetivo & Público</h2>
        <p className="text-muted-foreground text-sm">
          Defina os objetivos da campanha e selecione o público-alvo.
        </p>
      </div>

      <Form {...form}>
        <form className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Bloco 1: Identificação */}
          <Card className="min-w-0 col-span-full">
            <CardHeader>
              <CardTitle className="text-base">Identificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-2">
                        <TextField
                          label="Nome da Campanha"
                          {...field}
                          error={!!form.formState.errors.name}
                        />
                        <FormDescription className="text-xs text-muted-foreground/60 flex items-center gap-1 ">
                          Será usado para identificar a campanha no sistema.
                        </FormDescription>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="formDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-2">
                        <TextareaField
                          label="Descrição curta (opcional)"
                          {...field}
                          rows={3}
                          error={!!form.formState.errors.formDescription}
                        />
                        <FormDescription className="text-xs text-muted-foreground/60 flex items-center gap-1 ">
                          Exemplo: &quot;Preencha o formulário e nossa equipe
                          entrará em contato.&quot;
                        </FormDescription>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Bloco 2: CRM & Funil */}
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="text-base">CRM & Funil</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="funnelId"
                render={({ field }) => {
                  const selectValue =
                    field.value && field.value.trim() !== ""
                      ? field.value
                      : "none";
                  return (
                    <FormItem className="min-w-0">
                      <FormControl>
                        <div className="space-y-2">
                          <SelectField
                            label="Funil"
                            options={funnelOptions}
                            value={selectValue}
                            onValueChange={(value) => {
                              // Converter "none" para string vazia para salvar no formulário
                              const newValue = value === "none" ? "" : value;
                              if (newValue !== field.value) {
                                field.onChange(newValue);
                              }
                            }}
                            disabled={isLoadingFunnels}
                            error={!!form.formState.errors.funnelId}
                          />
                          <FormDescription className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            Selecione o funil de vendas para a campanha.
                          </FormDescription>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="stageId"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormControl>
                      <SelectField
                        label="Etapa"
                        options={stageOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          !watchedFunnelId ||
                          watchedFunnelId === "none" ||
                          isLoadingFunnels
                        }
                        error={!!form.formState.errors.stageId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TODO: Implementar responsável no CRM para integrar com a campanha */}
              {/* <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormControl>
                      <SelectField
                        label="Responsável"
                        options={OWNER_OPTIONS}
                        value={field.value || "none"}
                        onValueChange={(value) => {
                          // Converter "none" para string vazia para salvar no formulário
                          field.onChange(value === "none" ? "" : value);
                        }}
                        error={!!form.formState.errors.ownerId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* TODO: Implementar notificação no Sistema para integrar com o CRM e a campanha */}
              {/* <FormField
                control={form.control}
                name="notifyOnLead"
                render={({ field }) => (
                  <FormItem className="col-span-full flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="cursor-pointer">
                        Notificar equipe imediatamente?
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              /> */}

              {/* TODO: Implementar tags no Sistema para integrar com o CRM e a campanha */}
              {/* <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem className="col-span-full">
                    <FormControl>
                      <div className="space-y-2">
                        <TextField
                          label="Tags"
                          value={tagsInputValue}
                          onChange={(e) => handleTagInputChange(e.target.value)}
                        />
                        <FormDescription
                          className="text-xs text-muted-foreground/60 flex items-center gap-1 "
                        >
                          Adicione tags para ajudar a categorizar a campanha.
                        </FormDescription>
                      </div>
                    </FormControl>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch("tags")?.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              <FormField
                control={form.control}
                name="duplicityRule"
                render={({ field }) => (
                  <FormItem className="col-span-full min-w-0">
                    <FormLabel>Regra de Duplicidade</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 gap-4"
                      >
                        {DUPLICITY_RULE_OPTIONS.map((option) => (
                          <RadioCard
                            key={option.value}
                            value={option.value}
                            label={option.label}
                            description={
                              option.value === "block"
                                ? "Registra a resposta como duplicada e não cria outro card no CRM"
                                : option.value === "update"
                                  ? "Atualiza informações do lead existente"
                                  : "Cria um novo lead mesmo se já existir"
                            }
                            isSelected={field.value === option.value}
                            onSelect={field.onChange}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Bloco 3: Rastreamento & Ação Final */}
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="text-base">
                {/* Rastreamento & Ação Final */}
                Ação Pós-Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* TODO: Implementar pixel e tag no Sistema para integrar com campanha */}
                {/* <FormField
                  control={form.control}
                  name="fbPixelId"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormControl>
                        <div className="space-y-2">
                          <TextField
                            label="Facebook Pixel ID"
                            {...field}
                            error={!!form.formState.errors.fbPixelId}
                          />
                          <FormDescription className="text-xs text-muted-foreground/60 flex items-center gap-1 ">
                            ID do Facebook Pixel para rastrear a campanha.
                          </FormDescription>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                {/* TODO: Implementar pixel e tag no Sistema para integrar com campanha */}
                {/* <FormField
                  control={form.control}
                  name="googleTagId"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormControl>
                        <div className="space-y-2">
                          <TextField
                            label="Google Tag Manager ID"
                            {...field}
                            error={!!form.formState.errors.googleTagId}
                          />
                          <FormDescription className="text-xs text-muted-foreground/60 flex items-center gap-1 ">
                            ID do Google Tag Manager para rastrear a campanha.
                          </FormDescription>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
              </div>

              <FormField
                control={form.control}
                name="successAction"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    {/* <FormLabel>Ação Após Envio</FormLabel> */}
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 gap-4"
                      >
                        {SUCCESS_ACTION_OPTIONS.map((option) => (
                          <RadioCard
                            key={option.value}
                            value={option.value}
                            label={option.label}
                            description={
                              option.value === "message"
                                ? "Exibe uma mensagem de sucesso na página"
                                : "Redireciona o usuário para uma URL específica"
                            }
                            isSelected={field.value === option.value}
                            onSelect={field.onChange}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedSuccessAction === "message" && (
                <FormField
                  control={form.control}
                  name="successMessage"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormControl>
                        <div className="space-y-2">
                          <TextareaField
                            label="Mensagem de Sucesso"
                            {...field}
                            error={!!form.formState.errors.successMessage}
                          />
                          <FormDescription className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            Mensagem que será exibida após o envio do
                            formulário.
                          </FormDescription>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedSuccessAction === "redirect" && (
                <FormField
                  control={form.control}
                  name="redirectUrl"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormControl>
                        <div className="space-y-2">
                          <TextField
                            label="URL de Redirecionamento"
                            {...field}
                            error={!!form.formState.errors.redirectUrl}
                          />
                          <FormDescription className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            Ex.: https://www.instagram.com/sua_clinica (se omitir
                            o https://, será adicionado automaticamente)
                          </FormDescription>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
