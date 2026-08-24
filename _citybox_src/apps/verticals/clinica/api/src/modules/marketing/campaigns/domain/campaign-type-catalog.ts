import { CampaignInvalidSegmentTypeError } from './errors/campaign-invalid-segment-type.error';
import { CampaignTypeNotImplementedError } from './errors/campaign-type-not-implemented.error';
import type {
  CampaignChannel,
  CampaignSegment,
  CampaignStrategy,
  CampaignType,
} from './campaign.types';

export type CampaignTypeCatalogItem = {
  segment: CampaignSegment;
  segmentLabel: string;
  segmentDescription: string;
  type: CampaignType;
  label: string;
  description: string;
  strategy: CampaignStrategy;
  icon: string;
  defaultChannel: CampaignChannel;
  /** UI/wizard de configuração deste tipo já disponível no produto. */
  implemented: boolean;
};

const CATALOG: readonly CampaignTypeCatalogItem[] = [
  {
    segment: 'captacao_leads',
    segmentLabel: 'Captação de Leads',
    segmentDescription: 'Atraia novos pacientes para a clínica.',
    type: 'form_lead',
    label: 'Formulário de Leads',
    description: 'Crie uma página de captura para ofertas ou avaliações.',
    strategy: 'PAGE',
    icon: 'FileText',
    defaultChannel: 'web',
    implemented: true,
  },
  {
    segment: 'captacao_leads',
    segmentLabel: 'Captação de Leads',
    segmentDescription: 'Atraia novos pacientes para a clínica.',
    type: 'mgm',
    label: 'Indique e Ganhe',
    description: 'Campanha de indicação premiada para pacientes.',
    strategy: 'BROADCAST',
    icon: 'Share2',
    defaultChannel: 'whatsapp',
    implemented: false,
  },
  {
    segment: 'operacional_atendimento',
    segmentLabel: 'Operacional de Atendimento',
    segmentDescription: 'Gerencie avisos, agenda e financeiro.',
    type: 'debito_atraso',
    label: 'Débito em atraso',
    description: 'Lembretes automáticos para boletos em aberto.',
    strategy: 'BROADCAST',
    icon: 'Wallet',
    defaultChannel: 'whatsapp',
    implemented: false,
  },
  {
    segment: 'operacional_atendimento',
    segmentLabel: 'Operacional de Atendimento',
    segmentDescription: 'Gerencie avisos, agenda e financeiro.',
    type: 'retorno_tratamento',
    label: 'Retorno de procedimento finalizado',
    description:
      'Pacientes que finalizaram procedimento e precisam retornar para uma consulta.',
    strategy: 'BROADCAST',
    icon: 'Calendar',
    defaultChannel: 'whatsapp',
    implemented: false,
  },
  {
    segment: 'relacionamento_pos_venda',
    segmentLabel: 'Relacionamento & Pós-Venda',
    segmentDescription: 'Fidelização e pós-venda.',
    type: 'aniversario',
    label: 'Aniversariantes',
    description: 'Envie mensagens de parabéns automáticas.',
    strategy: 'BROADCAST',
    icon: 'Gift',
    defaultChannel: 'whatsapp',
    implemented: true,
  },
  {
    segment: 'relacionamento_pos_venda',
    segmentLabel: 'Relacionamento & Pós-Venda',
    segmentDescription: 'Fidelização e pós-venda.',
    type: 'nps',
    label: 'Pesquisa de Satisfação',
    description: 'Coleta de feedback pós-atendimento.',
    strategy: 'AUTOMATION',
    icon: 'Star',
    defaultChannel: 'whatsapp',
    implemented: false,
  },
] as const;

const BY_TYPE = new Map<CampaignType, CampaignTypeCatalogItem>(
  CATALOG.map((item) => [item.type, item]),
);

/** Lista imutável dos 6 tipos de campanha (fonte de verdade do produto). */
export function listCampaignTypes(): readonly CampaignTypeCatalogItem[] {
  return CATALOG;
}

export function getCatalogEntry(
  type: CampaignType,
): CampaignTypeCatalogItem | undefined {
  return BY_TYPE.get(type);
}

/** Estratégia é sempre derivada do tipo — nunca escolhida pelo cliente. */
export function resolveStrategy(type: CampaignType): CampaignStrategy {
  const entry = BY_TYPE.get(type);
  if (!entry) {
    throw new CampaignInvalidSegmentTypeError(
      'resolveStrategy',
      '(missing)',
      type,
    );
  }
  return entry.strategy;
}

export function defaultChannelForType(type: CampaignType): CampaignChannel {
  const entry = BY_TYPE.get(type);
  if (!entry) {
    throw new CampaignInvalidSegmentTypeError(
      'defaultChannelForType',
      '(missing)',
      type,
    );
  }
  return entry.defaultChannel;
}

export function defaultChannelForStrategy(
  strategy: CampaignStrategy,
): CampaignChannel {
  if (strategy === 'PAGE') return 'web';
  return 'whatsapp';
}

/**
 * Garante que o par (segment, type) existe no catálogo.
 * @throws CampaignInvalidSegmentTypeError
 */
export function assertValidSegmentTypePair(
  segment: CampaignSegment,
  type: CampaignType,
  context = 'assertValidSegmentTypePair',
): CampaignTypeCatalogItem {
  const entry = BY_TYPE.get(type);
  if (!entry || entry.segment !== segment) {
    throw new CampaignInvalidSegmentTypeError(context, segment, type);
  }
  return entry;
}

/**
 * @throws CampaignTypeNotImplementedError
 */
export function assertTypeImplemented(
  type: CampaignType,
  context = 'assertTypeImplemented',
): CampaignTypeCatalogItem {
  const entry = BY_TYPE.get(type);
  if (!entry) {
    throw new CampaignTypeNotImplementedError(context, type);
  }
  if (!entry.implemented) {
    throw new CampaignTypeNotImplementedError(context, type);
  }
  return entry;
}

export type CampaignSegmentGroup = {
  segment: CampaignSegment;
  label: string;
  description: string;
  types: readonly CampaignTypeCatalogItem[];
};

export function listCampaignTypesGroupedBySegment(): CampaignSegmentGroup[] {
  const order: CampaignSegment[] = [
    'captacao_leads',
    'operacional_atendimento',
    'relacionamento_pos_venda',
  ];
  return order.map((segment) => {
    const types = CATALOG.filter((item) => item.segment === segment);
    const first = types[0];
    return {
      segment,
      label: first?.segmentLabel ?? segment,
      description: first?.segmentDescription ?? '',
      types,
    };
  });
}
