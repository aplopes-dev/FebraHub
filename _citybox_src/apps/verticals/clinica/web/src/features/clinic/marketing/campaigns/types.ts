import type { LucideIcon } from "lucide-react";

export type CampaignStatus =
  | "draft"
  | "active"
  | "inactive"
  | "paused"
  | "finished";

export type CampaignChannel = "whatsapp" | "sms" | "web";

export type CampaignStrategy = "PAGE" | "BROADCAST" | "AUTOMATION";

export type SelectedCampaignType = {
  segmentId: string;
  typeId: string;
};

export interface CampaignType {
  id: string;
  title: string;
  description: string;
  strategy: CampaignStrategy;
  icon: string; // nome do ícone do lucide-react
}

export interface CampaignSegmentConfig {
  id: string;
  label: string;
  description: string;
  types: CampaignType[];
}

export type CampaignSegment = "captacao_leads" | "operacional_atendimento" | "relacionamento_pos_venda";
export type CampaignStatusType = "always_active" | "period" | "limit";

export type Campaign = {
  id: string;
  name: string;
  type: string;
  icon?: LucideIcon;
  patientsReached: number;
  responseRate: number; // porcentagem
  responses: number;
  channel: CampaignChannel;
  status: CampaignStatus;
  strategy: CampaignStrategy;
  segment: CampaignSegment;
  statusType: CampaignStatusType;
  endDate?: string; // Data formatada como string legível
  clinicId?: string;
  slug?: string;
  publicUrl?: string;
};
