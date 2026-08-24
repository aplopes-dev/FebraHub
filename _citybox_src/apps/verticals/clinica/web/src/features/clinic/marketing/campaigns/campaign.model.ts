/**
 * Modelos de dados para Campanhas
 *
 * Baseados nos DTOs do backend em apps/api/src/modules/marketing/infra/http/routes/
 */

export type CampaignStatus =
  | "draft"
  | "active"
  | "inactive"
  | "paused"
  | "finished";
export type CampaignChannel = "whatsapp" | "sms" | "web";
export type CampaignStrategy = "PAGE" | "BROADCAST" | "AUTOMATION";
export type CampaignSegment =
  | "captacao_leads"
  | "operacional_atendimento"
  | "relacionamento_pos_venda";
export type CampaignType =
  | "form_lead"
  | "mgm"
  | "debito_atraso"
  | "retorno_tratamento"
  | "aniversario"
  | "nps";
export type CampaignStatusType = "always_active" | "period" | "limit";

/**
 * Campanha completa retornada pela API
 */
export interface Campaign {
  id: string;
  clinicId: string;
  name: string;
  slug: string;
  segment: CampaignSegment;
  type: CampaignType;
  strategy: CampaignStrategy;
  status: CampaignStatus;
  channel: CampaignChannel;
  statusType: CampaignStatusType;
  startDate?: Date | string;
  endDate?: Date | string;
  leadLimit?: number;
  views: number;
  submissions: number;
  funnelId?: string;
  stageId?: string;
  content: Record<string, unknown>;
  publicUrl?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Campanha formatada para exibição na lista
 * (com campos calculados para UI)
 */
export interface CampaignListItem {
  id: string;
  name: string;
  type: string; // Label legível do tipo
  icon?: string; // Nome do ícone
  patientsReached: number; // views
  responseRate: number; // (submissions / views) * 100
  responses: number; // submissions
  channel: CampaignChannel;
  status: CampaignStatus;
}

/**
 * Dados para criar uma nova campanha
 */
export interface CreateCampaignData {
  name: string;
  segment: CampaignSegment;
  type: CampaignType;
  strategy: CampaignStrategy;
  channel?: CampaignChannel;
  statusType?: CampaignStatusType;
  startDate?: string;
  endDate?: string;
  leadLimit?: number;
  funnelId?: string;
  stageId?: string;
  content: Record<string, unknown>;
}

/**
 * Dados para atualizar o status de uma campanha
 */
export interface UpdateCampaignStatusData {
  newStatus: CampaignStatus;
  endDate?: string; // Data de término (usado quando finalizando)
}
