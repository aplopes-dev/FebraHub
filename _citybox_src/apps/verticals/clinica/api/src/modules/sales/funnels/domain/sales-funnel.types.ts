export type SalesFunnelStageType = 'others' | 'won' | 'lost';

export type SalesFunnelStageProps = {
  id: string;
  storeId: string;
  funnelId: string;
  name: string;
  type: SalesFunnelStageType;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SalesFunnelProps = {
  storeId: string;
  name: string;
  isDefault: boolean;
  stages: SalesFunnelStageProps[];
  createdAt: Date;
  updatedAt: Date;
};

export const DEFAULT_STAGE_COLORS = {
  open: '#3B82F6',
  inProgress: '#F59E0B',
  won: '#22C55E',
  lost: '#EF4444',
} as const;

export function buildDefaultStages(
  storeId: string,
  funnelId: string,
  wonName = 'Ganha',
  now = new Date(),
): Omit<SalesFunnelStageProps, 'id'>[] {
  return [
    {
      storeId,
      funnelId,
      name: 'Em aberto',
      type: 'others',
      color: DEFAULT_STAGE_COLORS.open,
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      storeId,
      funnelId,
      name: 'Em andamento',
      type: 'others',
      color: DEFAULT_STAGE_COLORS.inProgress,
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      storeId,
      funnelId,
      name: wonName,
      type: 'won',
      color: DEFAULT_STAGE_COLORS.won,
      order: 998,
      createdAt: now,
      updatedAt: now,
    },
    {
      storeId,
      funnelId,
      name: 'Perdida',
      type: 'lost',
      color: DEFAULT_STAGE_COLORS.lost,
      order: 999,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
