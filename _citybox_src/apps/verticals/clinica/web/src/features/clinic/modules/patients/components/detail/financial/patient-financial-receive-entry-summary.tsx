'use client';

import { Calendar, CircleDollarSign, FileText, User } from 'lucide-react';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import type { PatientFinancialEntry } from '../../../types/patient-financial-entry';

export type FinancialReceiveEntrySummaryData = {
  name: string;
  date: string;
  valueCents: number;
  patientName?: string | null;
};

type PatientFinancialReceiveEntrySummaryProps = {
  entry: PatientFinancialEntry | FinancialReceiveEntrySummaryData;
};

function formatFinancialDate(date: string): string {
  const isoDate = date.substring(0, 10);
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('pt-BR');
}

export function PatientFinancialReceiveEntrySummary({
  entry,
}: PatientFinancialReceiveEntrySummaryProps) {
  const patientName = 'patientName' in entry ? entry.patientName : null;

  return (
    <div className="rounded-2xl border border-border/50 bg-muted/20 p-3">
      <div className="flex items-start gap-2.5">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          aria-hidden
        >
          <FileText className="size-6" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-base font-semibold leading-snug text-foreground">{entry.name}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            {patientName ? (
              <span className="inline-flex items-center gap-1">
                <User className="size-4 shrink-0" aria-hidden />
                {patientName}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-4 shrink-0" aria-hidden />
              {formatFinancialDate(entry.date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <CircleDollarSign className="size-4 shrink-0" aria-hidden />
              {formatBrlCurrencyFromCents(entry.valueCents)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
