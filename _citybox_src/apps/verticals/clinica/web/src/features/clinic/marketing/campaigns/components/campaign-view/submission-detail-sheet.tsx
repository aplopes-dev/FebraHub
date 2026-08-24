// @ts-nocheck
"use client";

import React from "react";
import { SheetModal } from "@/features/clinic/marketing/campaigns/_ui/sheet-modal";
import { cn } from "@citybox/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@citybox/ui/atoms";
import { Alert, AlertDescription, AlertTitle } from "@citybox/ui/atoms";
import { Copy, Info } from "lucide-react";
import { formatDate } from "@/features/clinic/marketing/campaigns/_ui/format";
import type { CampaignSubmission } from "../../submission.model";
import type { Campaign } from "../../campaign.model";

type SubmissionDetailSheetProps = {
  submission: CampaignSubmission;
  campaign?: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getCampaignTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    form_lead: "Formulário de Leads",
    mgm: "Indique e Ganhe",
    debito_atraso: "Débito em Atraso",
    retorno_tratamento: "Retorno de Procedimento",
    aniversario: "Aniversariantes",
    nps: "Pesquisa de Satisfação",
  };
  return typeMap[type] || type;
}

function getSourceLabel(source: string): string {
  const sourceMap: Record<string, string> = {
    web: "Página Web",
    qr_code: "QR Code",
    api: "API",
    manual: "Manual",
  };
  return sourceMap[source] || source;
}

function getQuestionLabel(questionId: string, campaign?: Campaign): string {
  const stepThree = campaign?.content?.stepThree as
    | {
        questions?: Array<{
          id: string;
          label: string;
        }>;
      }
    | undefined;

  if (!stepThree?.questions) {
    // Fallback: processar a chave se não houver dados da campanha
    return questionId.replace("field-", "").replace(/-/g, " ");
  }

  const question = stepThree.questions.find((q) => q.id === questionId);
  return question?.label || questionId.replace("field-", "").replace(/-/g, " ");
}

function getSubmissionPhone(submission: CampaignSubmission): string | null {
  const payload = submission.payload;
  return (
    (payload["field-phone"] as string) || (payload["phone"] as string) || null
  );
}

function getDuplicateStrategyLabel(strategy?: string): string {
  const strategyMap: Record<string, string> = {
    block: "Bloquear duplicados",
    update: "Atualização de existente",
    create_new: "Criar novo sempre",
  };
  return strategy ? strategyMap[strategy] || strategy : "Não configurado";
}

function getQuestionValueLabel(
  questionId: string,
  value: string | string[],
  campaign?: Campaign,
): string {
  const stepThree = campaign?.content?.stepThree as
    | {
        questions?: Array<{
          id: string;
          type: string;
          options?: Array<{
            id: string;
            label: string;
          }>;
        }>;
      }
    | undefined;

  // Se não houver campanha, retorna o valor original
  if (!stepThree?.questions) {
    return Array.isArray(value) ? value.join(", ") : value;
  }

  const question = stepThree.questions.find((q) => q.id === questionId);

  // Se não encontrar a pergunta ou não for radio/checkbox, retorna o valor original
  if (
    !question ||
    (question.type !== "radio" && question.type !== "checkbox")
  ) {
    return Array.isArray(value) ? value.join(", ") : value;
  }

  // Se não tiver opções, retorna o valor original
  if (!question.options || question.options.length === 0) {
    return Array.isArray(value) ? value.join(", ") : value;
  }

  // Para checkbox (array de valores)
  if (Array.isArray(value)) {
    const labels = value
      .map((val) => {
        const option = question.options?.find((opt) => opt.id === val);
        return option?.label || val;
      })
      .filter(Boolean);
    return labels.join(", ");
  }

  // Para radio (valor único)
  const option = question.options.find((opt) => opt.id === value);
  return option?.label || value;
}

export function SubmissionDetailContent({
  submission,
  campaign,
  compact = false,
}: {
  submission: CampaignSubmission;
  campaign?: Campaign;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-6", compact && "space-y-4")}>
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Informações Básicas
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Data da Resposta
              </label>
              <p className="mt-1 text-sm text-foreground">
                {formatDate(submission.submittedAt, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Origem
              </label>
              <p className="mt-1 text-sm text-foreground">
                {getSourceLabel(submission.source)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tipo de Campanha
              </label>
              <p className="mt-1 text-sm text-foreground">
                {getCampaignTypeLabel(submission.campaignType)}
              </p>
            </div>
          </div>
        </div>

        {/* Alerta de Duplicidade */}
        {submission.isDuplicate && (
          <Alert className="border-amber-200 bg-amber-50/50">
            <Copy className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Resposta duplicada</AlertTitle>
            <AlertDescription className="text-amber-800">
              Este telefone já havia enviado o formulário. A resposta foi
              registrada, mas nenhum novo card foi criado no CRM.
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de Duplicidade */}
        {getSubmissionPhone(submission) && campaign?.content?.stepTwo && (
          <Alert className="border-blue-200 bg-blue-50/50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">
              Detecção de Duplicidade
            </AlertTitle>
            <AlertDescription className="text-blue-800">
              <span className="block mb-2">
                Estratégia configurada para esta campanha:{" "}
                <strong>
                  {getDuplicateStrategyLabel(
                    (campaign.content.stepTwo as { duplicityRule?: string })
                      ?.duplicityRule,
                  )}
                </strong>
              </span>
              {(campaign.content.stepTwo as { duplicityRule?: string })
                ?.duplicityRule === "block" && (
                <span className="text-sm">
                  <Copy className="inline h-3 w-3 mr-1" />
                  Respostas duplicadas são registradas com flag e não geram
                  novo card no CRM.
                </span>
              )}
              {(campaign.content.stepTwo as { duplicityRule?: string })
                ?.duplicityRule === "update" && (
                <span className="text-sm">
                  <Copy className="inline h-3 w-3 mr-1" />
                  Duplicados geram nova resposta marcada e atualizam o card
                  existente no CRM.
                </span>
              )}
              {(campaign.content.stepTwo as { duplicityRule?: string })
                ?.duplicityRule === "create_new" && (
                <span className="text-sm">
                  Duplicados sempre criam uma nova oportunidade no CRM.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Accordion com Respostas e Metadados */}
        <Accordion
          type="multiple"
          className="w-full space-y-4"
          defaultValue={["form-responses"]}
        >
          {/* Respostas do Formulário */}
          <AccordionItem value="form-responses">
            <AccordionTrigger className="">
              <span className="text-sm font-semibold text-muted-foreground">
                Respostas do Formulário
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-lg bg-muted/30 p-4 space-y-3">
                {Object.entries(submission.payload).map(([key, value]) => {
                  // Converter value para o tipo esperado
                  const normalizedValue: string | string[] = Array.isArray(
                    value,
                  )
                    ? (value as unknown[]).map((v) => String(v))
                    : String(value);

                  return (
                    <div
                      key={key}
                      className="border-b last:border-b-0 pb-3 last:pb-0"
                    >
                      <label className="text-sm font-medium text-muted-foreground block mb-1">
                        {getQuestionLabel(key, campaign)}
                      </label>
                      <p className="text-sm text-foreground">
                        {getQuestionValueLabel(key, normalizedValue, campaign)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Metadados Técnicos */}
          {submission.metadata &&
            Object.keys(submission.metadata).length > 0 && (
              <AccordionItem value="metadata">
                <AccordionTrigger className="">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Metadados Técnicos
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="rounded-lg bg-muted/30 p-4 space-y-3">
                    {Object.entries(submission.metadata).map(([key, value]) => (
                      <div
                        key={key}
                        className="border-b last:border-b-0 pb-3 last:pb-0"
                      >
                        <label className="text-sm font-medium text-muted-foreground block mb-1">
                          {key}
                        </label>
                        <p className="text-sm text-foreground font-mono break-all">
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
        </Accordion>
    </div>
  );
}

export function SubmissionDetailSheet({
  submission,
  campaign,
  open,
  onOpenChange,
}: SubmissionDetailSheetProps) {
  return (
    <SheetModal
      title="Detalhes da Resposta"
      open={open}
      onOpenChange={onOpenChange}
      className="w-full data-[side=right]:sm:max-w-2xl"
    >
      <SubmissionDetailContent submission={submission} campaign={campaign} />
    </SheetModal>
  );
}
