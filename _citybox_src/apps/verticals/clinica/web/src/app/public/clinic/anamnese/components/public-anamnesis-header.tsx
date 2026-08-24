'use client';

import { Progress } from '@citybox/ui/atoms';

type PublicAnamnesisHeaderProps = {
  clinicName: string;
  patientName: string;
  answeredCount: number;
  totalCount: number;
  percent: number;
};

export function PublicAnamnesisHeader({
  clinicName,
  patientName,
  answeredCount,
  totalCount,
  percent,
}: PublicAnamnesisHeaderProps) {
  const firstName = patientName.trim().split(/\s+/)[0] ?? patientName;

  return (
    <header className="sticky top-0 z-20 border-b border-primary/15 bg-primary/5 px-4 py-5 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-lg space-y-4">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-primary">
          {clinicName}
        </p>

        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">Olá, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground">
            Responda as perguntas abaixo sobre sua saúde
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {answeredCount} de {totalCount} respondidas
            </span>
            <span className="font-semibold text-primary">{percent}%</span>
          </div>
          <Progress
            value={percent}
            className="h-2 bg-primary/15"
            aria-label="Progresso do preenchimento"
          />
        </div>
      </div>
    </header>
  );
}
