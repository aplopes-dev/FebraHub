import type { Campaign as ApiCampaign } from '../campaign.model';
import type { Campaign as ComponentCampaign } from '../types';
import { CAMPAIGN_SEGMENTS } from '../constants';
import * as Icons from 'lucide-react';
import { formatDate } from '../_ui/format';

/**
 * Mapeia o tipo da API para o label legível
 */
function getTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    'form_lead': 'Formulário de Leads',
    'mgm': 'Indique e Ganhe',
    'debito_atraso': 'Débito em atraso',
    'retorno_tratamento': 'Retorno de procedimento',
    'aniversario': 'Aniversariantes',
    'nps': 'Pesquisa de Satisfação',
  };
  return typeMap[type] || type;
}

/**
 * Obtém o ícone baseado no tipo da campanha
 */
function getIconFromType(type: string): ComponentCampaign['icon'] {
  // Buscar o ícone nos segmentos
  for (const segment of CAMPAIGN_SEGMENTS) {
    const campaignType = segment.types.find((t) => {
      const typeMap: Record<string, string> = {
        'form_lead': 'form-lead',
        'mgm': 'mgm',
        'debito_atraso': 'debito-atraso',
        'retorno_tratamento': 'retorno-tratamento',
        'aniversario': 'aniversario',
        'nps': 'nps',
      };
      return t.id === typeMap[type];
    });
    
    if (campaignType?.icon) {
      return Icons[campaignType.icon as keyof typeof Icons] as ComponentCampaign['icon'];
    }
  }
  
  return undefined;
}

/**
 * Calcula a taxa de resposta baseada em views e submissions
 */
function calculateResponseRate(views: number, submissions: number): number {
  if (views === 0) return 0;
  return Math.round((submissions / views) * 100);
}

/**
 * Formata a data de fim da campanha
 */
function formatEndDate(endDate?: Date | string): string | undefined {
  if (!endDate) return undefined;
  return formatDate(endDate, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Mapeia uma campanha da API para o formato usado pelos componentes
 */
export function mapApiCampaignToComponent(apiCampaign: ApiCampaign): ComponentCampaign {
  return {
    id: apiCampaign.id,
    name: apiCampaign.name,
    type: getTypeLabel(apiCampaign.type),
    icon: getIconFromType(apiCampaign.type),
    patientsReached: apiCampaign.views,
    responseRate: calculateResponseRate(apiCampaign.views, apiCampaign.submissions),
    responses: apiCampaign.submissions,
    channel: apiCampaign.channel,
    status: apiCampaign.status,
    strategy: apiCampaign.strategy as ComponentCampaign['strategy'],
    segment: apiCampaign.segment as ComponentCampaign['segment'],
    statusType: apiCampaign.statusType as ComponentCampaign['statusType'],
    endDate: formatEndDate(apiCampaign.endDate),
    clinicId: apiCampaign.clinicId,
    slug: apiCampaign.slug,
    publicUrl: apiCampaign.publicUrl,
  };
}
