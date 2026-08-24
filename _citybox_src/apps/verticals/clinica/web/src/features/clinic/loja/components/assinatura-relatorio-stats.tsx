'use client';

import { CircleCheck, Clock3, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@citybox/ui/atoms';
import type { ElectronicSignatureReportStats } from '../services/electronic-signatures-report.api.service';
import { EMPTY_ASSINATURA_RELATORIO_STATS } from '../data/assinatura-relatorio';

const STAT_CARDS: {
  key: keyof ElectronicSignatureReportStats;
  label: string;
  iconClassName: string;
  iconBgClassName: string;
  Icon: LucideIcon;
}[] = [
  {
    key: 'enviados',
    label: 'Documentos enviados',
    iconClassName: 'text-blue-600',
    iconBgClassName: 'bg-blue-600/10',
    Icon: Send,
  },
  {
    key: 'pendentes',
    label: 'Documentos pendentes',
    iconClassName: 'text-amber-500',
    iconBgClassName: 'bg-amber-500/10',
    Icon: Clock3,
  },
  {
    key: 'assinados',
    label: 'Documentos assinados',
    iconClassName: 'text-green-600',
    iconBgClassName: 'bg-green-600/10',
    Icon: CircleCheck,
  },
];

type AssinaturaRelatorioStatsProps = {
  stats?: ElectronicSignatureReportStats;
};

/** Mini-cards de KPI do relatório de assinaturas. */
export function AssinaturaRelatorioStats({
  stats = EMPTY_ASSINATURA_RELATORIO_STATS,
}: AssinaturaRelatorioStatsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {STAT_CARDS.map(
        ({ key, label, iconClassName, iconBgClassName, Icon }) => (
          <Card
            key={key}
            className="w-auto min-w-[13.5rem] shrink-0 gap-0 py-0"
          >
            <CardContent className="flex items-center justify-between gap-3 px-4 py-5">
              <div>
                <p
                  className="text-xl font-bold tabular-nums leading-none tracking-tight text-foreground"
                  data-testid={`assinatura-relatorio-stat-${key}`}
                >
                  {stats[key]}
                </p>
                <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                  {label}
                </p>
              </div>
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-md ${iconBgClassName}`}
              >
                <Icon className={`size-5 ${iconClassName}`} aria-hidden />
              </span>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}
