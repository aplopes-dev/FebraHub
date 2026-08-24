"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@citybox/ui/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { formatDate } from "@/features/clinic/marketing/campaigns/_ui/format";
import {
  salesService,
  type Funnel,
} from "@/features/clinic/vendas/services/sales.service";
import { useClinicId } from "@/features/clinic/vendas/lib/use-clinic-id";
import { salesQueryKeys } from "@/features/clinic/vendas/hooks/query-keys";

import type { Campaign, CampaignStatusType } from "../../campaign.model";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CHANNEL_LABELS,
  CHANNEL_COLORS,
} from "../../constants";
import {
  LgpdConsent,
  Question,
} from "../campaign-templates/page-template/step-three/page-template-step-three.schema";
import { toAbsoluteExternalUrl } from "../../utils/to-absolute-external-url";

type CampaignDetailsProps = {
  campaign: Campaign;
};

function getTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    form_lead: "Formulário de Leads",
    mgm: "Indique e Ganhe",
    debito_atraso: "Débito em atraso",
    retorno_tratamento: "Retorno de procedimento",
    aniversario: "Aniversariantes",
    nps: "Pesquisa de Satisfação",
  };
  return typeMap[type] || type;
}

function getSegmentLabel(segment: string): string {
  const segmentMap: Record<string, string> = {
    captacao_leads: "Captação de Leads",
    operacional_atendimento: "Operacional de Atendimento",
    relacionamento_pos_venda: "Relacionamento & Pós-Venda",
  };
  return segmentMap[segment] || segment;
}

function getStatusTypeLabel(statusType: string): string {
  const statusTypeMap: Record<string, string> = {
    always_active: "Sempre Ativa",
    period: "Até uma data",
    limit: "Por limite de leads",
  };
  return statusTypeMap[statusType] || statusType;
}

function getDuplicityRuleLabel(rule: string): string {
  const ruleMap: Record<string, string> = {
    block: "Bloquear duplicados",
    update: "Atualizar existente",
    create_new: "Criar novo",
  };
  return ruleMap[rule] || rule;
}

function getSuccessActionLabel(action: string): string {
  const actionMap: Record<string, string> = {
    message: "Mensagem",
    redirect: "Redirecionamento",
  };
  return actionMap[action] || action;
}

function getFieldTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    text: "Texto",
    phone: "Telefone",
    email: "E-mail",
    radio: "Múltipla escolha",
    checkbox: "Caixas de seleção",
    textarea: "Área de texto",
  };
  return typeMap[type] || type;
}

type StepTwo = {
  name: string;
  slug: string;
  funnelId?: string;
  stageId?: string;
  ownerId?: string;
  notifyOnLead?: boolean;
  tags?: string[];
  duplicityRule?: string;
  notificationChannels?: string[];
  fbPixelId?: string;
  googleTagId?: string;
  successAction?: string;
  successMessage?: string;
  redirectUrl?: string;
};

type StepThree = {
  questions: Question[];
  lgpdConsent: LgpdConsent;
  primaryColor?: string;
  logoUrl?: string;
};

type StepFour = {
  statusType: CampaignStatusType;
  startDate?: string;
  endDate?: string;
  leadLimit?: number;
};
export function CampaignDetails({ campaign }: CampaignDetailsProps) {
  const { clinicId, isReady } = useClinicId();

  // Extrair dados do content (API canônico → UI espelha stepTwo/Three/Four no service)
  const stepTwo = campaign.content?.stepTwo as StepTwo | undefined;
  const stepThree = campaign.content?.stepThree as StepThree | undefined;
  const stepFour = campaign.content?.stepFour as StepFour | undefined;
  const funnelId = campaign.funnelId ?? stepTwo?.funnelId;
  const stageId = campaign.stageId ?? stepTwo?.stageId;

  // Buscar dados do funil e etapa se existirem
  const { data: funnel } = useQuery<Funnel>({
    queryKey: salesQueryKeys.funnel(clinicId, funnelId ?? ""),
    queryFn: () => salesService.getFunnel(clinicId, funnelId!),
    enabled: isReady && !!funnelId,
    staleTime: 5 * 60 * 1000,
  });

  // Encontrar a etapa no funil
  const stage = funnel?.stages?.find((s) => s.id === stageId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Campanha</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Tipo
            </label>
            <p className="mt-1 text-sm text-foreground">
              {getTypeLabel(campaign.type)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Segmento
            </label>
            <p className="mt-1 text-sm text-foreground">
              {getSegmentLabel(campaign.segment)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Canal
            </label>
            <div className="mt-1">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  CHANNEL_COLORS[
                    campaign.channel as keyof typeof CHANNEL_COLORS
                  ],
                )}
              >
                {
                  CHANNEL_LABELS[
                    campaign.channel as keyof typeof CHANNEL_LABELS
                  ]
                }
              </Badge>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    STATUS_COLORS[
                      campaign.status as keyof typeof STATUS_COLORS
                    ],
                  )}
                >
                  {STATUS_LABELS[campaign.status as keyof typeof STATUS_LABELS]}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tipo de Status
              </label>
              <p className="mt-1 text-sm text-foreground">
                {getStatusTypeLabel(campaign.statusType)}
              </p>
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Data de Criação
              </label>
              <p className="mt-1 text-sm text-foreground">
                {formatDate(campaign.createdAt, {
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
                Última Atualização
              </label>
              <p className="mt-1 text-sm text-foreground">
                {formatDate(campaign.updatedAt, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {campaign.endDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Data de Fim
                </label>
                <p className="mt-1 text-sm text-foreground">
                  {formatDate(campaign.endDate, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CRM & Funil - Step 2 */}
        {stepTwo &&
          (funnelId ||
            stageId ||
            stepTwo.ownerId ||
            stepTwo.notifyOnLead !== undefined) && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                CRM & Funil
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {funnelId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Funil
                    </label>
                    <p className="mt-1 text-sm text-foreground">
                      {funnel?.name || funnelId}
                    </p>
                  </div>
                )}

                {stageId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Etapa do Funil
                    </label>
                    <p className="mt-1 text-sm text-foreground">
                      {stage?.name || stageId}
                    </p>
                  </div>
                )}

                {stepTwo.ownerId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Responsável
                    </label>
                    <p className="mt-1 text-sm text-foreground font-mono">
                      {stepTwo.ownerId}
                    </p>
                  </div>
                )}

                {stepTwo.notifyOnLead !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Notificar Equipe
                    </label>
                    <p className="mt-1 text-sm text-foreground">
                      {stepTwo.notifyOnLead ? "Sim" : "Não"}
                    </p>
                  </div>
                )}

                {stepTwo.notificationChannels &&
                  Array.isArray(stepTwo.notificationChannels) &&
                  stepTwo.notificationChannels.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Canais de Notificação
                      </label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {stepTwo.notificationChannels.map(
                          (channel: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {channel}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

        {/* Organização - Step 2 */}
        {stepTwo && (stepTwo.tags || stepTwo.duplicityRule) && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Organização
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {stepTwo.tags &&
                Array.isArray(stepTwo.tags) &&
                stepTwo.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tags
                    </label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {stepTwo.tags.map((tag: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {stepTwo.duplicityRule && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Regra de Duplicidade
                  </label>
                  <p className="mt-1 text-sm text-foreground">
                    {getDuplicityRuleLabel(stepTwo.duplicityRule)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rastreamento - Step 2 */}
        {stepTwo && (stepTwo.fbPixelId || stepTwo.googleTagId) && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Rastreamento
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {stepTwo.fbPixelId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Facebook Pixel ID
                  </label>
                  <p className="mt-1 text-sm text-foreground font-mono">
                    {stepTwo.fbPixelId}
                  </p>
                </div>
              )}

              {stepTwo.googleTagId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Google Tag Manager ID
                  </label>
                  <p className="mt-1 text-sm text-foreground font-mono">
                    {stepTwo.googleTagId}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ação Após Envio - Step 2 */}
        {stepTwo && stepTwo.successAction && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Ação Após Envio
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tipo de Ação
                </label>
                <p className="mt-1 text-sm text-foreground">
                  {getSuccessActionLabel(stepTwo.successAction)}
                </p>
              </div>

              {stepTwo.successAction === "message" &&
                stepTwo.successMessage && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Mensagem de Sucesso
                    </label>
                    <p className="mt-1 text-sm text-foreground">
                      {stepTwo.successMessage}
                    </p>
                  </div>
                )}

              {stepTwo.successAction === "redirect" && stepTwo.redirectUrl && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    URL de Redirecionamento
                  </label>
                  <p className="mt-1 text-sm">
                    <a
                      href={toAbsoluteExternalUrl(stepTwo.redirectUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {toAbsoluteExternalUrl(stepTwo.redirectUrl)}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Limites e Configurações - Step 4 */}
        {campaign.leadLimit && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Limites e Configurações
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Limite de Leads
                </label>
                <p className="mt-1 text-sm text-foreground">
                  {campaign.leadLimit} leads
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
