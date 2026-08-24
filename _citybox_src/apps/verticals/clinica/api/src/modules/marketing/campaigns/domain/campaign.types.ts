/**
 * Taxonomia e enums de Campanha (espelha Prisma).
 */

export type CampaignSegment =
  | 'captacao_leads'
  | 'operacional_atendimento'
  | 'relacionamento_pos_venda';

export type CampaignType =
  | 'form_lead'
  | 'mgm'
  | 'debito_atraso'
  | 'retorno_tratamento'
  | 'aniversario'
  | 'nps';

export type CampaignStrategy = 'PAGE' | 'BROADCAST' | 'AUTOMATION';

export type CampaignChannel = 'web' | 'whatsapp' | 'sms';

export type CampaignStatus =
  | 'draft'
  | 'active'
  | 'inactive'
  | 'paused'
  | 'finished';

export type CampaignStatusType = 'always_active' | 'period' | 'limit';

export const CAMPAIGN_SEGMENTS: readonly CampaignSegment[] = [
  'captacao_leads',
  'operacional_atendimento',
  'relacionamento_pos_venda',
] as const;

export const CAMPAIGN_TYPES: readonly CampaignType[] = [
  'form_lead',
  'mgm',
  'debito_atraso',
  'retorno_tratamento',
  'aniversario',
  'nps',
] as const;

export const CAMPAIGN_STRATEGIES: readonly CampaignStrategy[] = [
  'PAGE',
  'BROADCAST',
  'AUTOMATION',
] as const;

export const CAMPAIGN_STATUSES: readonly CampaignStatus[] = [
  'draft',
  'active',
  'inactive',
  'paused',
  'finished',
] as const;
