import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@citybox/ui';
import { PATIENT_DETAIL_TABS } from '../../lib/patient-detail-tabs';
import {
  PATIENT_DETAIL_CONTENT_SHELL_CLASS,
  PATIENT_DETAIL_HEADER_SHELL_CLASS,
  PATIENT_DETAIL_LAYOUT_ROOT_CLASS,
  PATIENT_DETAIL_PANEL_SOFT_CLASS,
} from '../../lib/patient-detail-tabs-ui';

const PATIENTS_LIST_HREF = '/pacientes';

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded bg-muted-foreground/15', className)}
      aria-hidden
    />
  );
}

export function PatientDetailSkeleton() {
  return (
    <section className={PATIENT_DETAIL_LAYOUT_ROOT_CLASS}>
      <div className={PATIENT_DETAIL_HEADER_SHELL_CLASS}>
        <div className="space-y-3">
          <Link
            href={PATIENTS_LIST_HREF}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Voltar para Pacientes
          </Link>

          <div className="flex items-start gap-3">
            <Bar className="size-24 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bar className="h-7 w-48" />
                  <Bar className="h-9 w-20 rounded-md" />
                  <Bar className="size-9 rounded-md" />
                </div>
                <Bar className="h-4 w-32" />
              </div>

              <div className="mt-1 flex gap-6 border-b border-border/60">
                {PATIENT_DETAIL_TABS.map((tab, index) => (
                  <span
                    key={tab.value}
                    className={cn(
                      'pb-3 text-sm font-normal tracking-wide',
                      index === 0 ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {tab.label.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={PATIENT_DETAIL_CONTENT_SHELL_CLASS}>
        <div className={cn(PATIENT_DETAIL_PANEL_SOFT_CLASS, 'px-4 py-16')}>
          <Bar className="mx-auto h-5 w-48" />
          <Bar className="mx-auto mt-3 h-4 w-72 max-w-full" />
        </div>
      </div>

      <span className="sr-only">Carregando ficha do paciente…</span>
    </section>
  );
}
