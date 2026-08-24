'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@citybox/ui/atoms';
import type { DashboardPatientMetricId } from '../types/clinic-dashboard';
import {
  DASHBOARD_PATIENT_METRIC_DEFINITIONS,
  findDashboardPatientMetricDefinition,
  isDashboardPatientsListMetricId,
  resolveDashboardPatientMetricCount,
} from '../lib/dashboard-patient-metric-definitions';
import { useDashboardPatientsSummaryQuery } from '../hooks/use-dashboard-patients-summary-query';
import { DashboardBirthdaysDialog } from './dashboard-birthdays-dialog';
import { DashboardPatientMetricDialog } from './dashboard-patient-metric-dialog';

type DashboardPatientsCardProps = {
  upcomingBirthdaysCount: number;
  upcomingBirthdaysLoading?: boolean;
  upcomingBirthdaysError?: boolean;
};

export function DashboardPatientsCard({
  upcomingBirthdaysCount,
  upcomingBirthdaysLoading = false,
  upcomingBirthdaysError = false,
}: DashboardPatientsCardProps) {
  const [selectedMetricId, setSelectedMetricId] =
    useState<DashboardPatientMetricId | null>(null);
  const { summary, isLoading, isError } = useDashboardPatientsSummaryQuery();

  const selectedDefinition = selectedMetricId
    ? findDashboardPatientMetricDefinition(selectedMetricId)
    : null;
  const selectedListMetric =
    selectedMetricId && isDashboardPatientsListMetricId(selectedMetricId)
      ? selectedMetricId
      : null;

  const formatCount = (metricId: DashboardPatientMetricId): string | number => {
    if (metricId === 'birthdays') {
      if (upcomingBirthdaysLoading) return 'Carregando...';
      if (upcomingBirthdaysError) return '—';
      return upcomingBirthdaysCount;
    }
    if (isLoading) return 'Carregando...';
    if (isError) return '—';
    return resolveDashboardPatientMetricCount(
      metricId,
      summary,
      upcomingBirthdaysCount,
    );
  };

  return (
    <>
      <Card className="py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-xl font-semibold">Pacientes</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60 px-4 pb-4">
          {DASHBOARD_PATIENT_METRIC_DEFINITIONS.map((metric) => (
            <div
              key={metric.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none tabular-nums text-foreground">
                  {formatCount(metric.id)}
                </p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">
                  {metric.label}
                </p>
              </div>
              <Button
                type="button"
                variant="link"
                className="h-auto shrink-0 px-0"
                aria-label={`Ver ${metric.label}`}
                onClick={() => setSelectedMetricId(metric.id)}
              >
                Ver
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <DashboardBirthdaysDialog
        open={selectedMetricId === 'birthdays'}
        onOpenChange={(open) => {
          if (!open) setSelectedMetricId(null);
        }}
      />
      <DashboardPatientMetricDialog
        key={selectedListMetric ?? 'closed'}
        metricId={selectedListMetric}
        metricLabel={selectedDefinition?.label ?? 'Pacientes'}
        open={selectedListMetric !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMetricId(null);
        }}
      />
    </>
  );
}
