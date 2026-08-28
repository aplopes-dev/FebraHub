import type { Lead, LeadStatus, Origin, OriginChannel } from "@/lib/mock-db";

export type LeadRow = {
  lead: Lead;
  personName: string;
  personPhone: string;
  personCity: string;
  ownerName?: string;
  ownerInitials?: string;
  interestName?: string;
  origin: Origin;
  /** Minutos até o primeiro contato; `undefined` = ninguém falou ainda. */
  firstContactMinutes?: number;
  /** Horas esperando desde a chegada, para quem ainda não foi contatado. */
  waitingHours: number;
  slaBreached: boolean;
};

export type LeadFilters = {
  status: LeadStatus | "todos";
  channel: OriginChannel | "todos";
  onlyOrphans: boolean;
  search: string;
};

export type ChannelSummary = {
  channel: OriginChannel;
  count: number;
  converted: number;
  conversionPercent: number;
};

export type LeadsBoard = {
  rows: LeadRow[];
  summary: {
    total: number;
    orphans: number;
    medianFirstContactMinutes?: number;
    slaBreached: number;
    convertedPercent: number;
  };
  channels: ChannelSummary[];
};
