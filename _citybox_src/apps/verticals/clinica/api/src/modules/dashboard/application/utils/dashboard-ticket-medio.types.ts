export type DashboardTicketMedioPeriodMode = 'annual' | 'monthly';

export type TicketMedioDayMetric = {
  /** yyyy-MM-dd (civil UTC de paidAt) */
  dateKey: string;
  revenueCents: number;
  expenseCents: number;
  /** Pacientes distintos do dia (incomes com patientId). */
  patientIds: string[];
};

export type DashboardTicketMedioPoint = {
  key: string;
  label: string;
  currentCents: number;
  previousCents: number;
};

export type DashboardTicketMedioSeries = {
  currentAverageCents: number;
  points: DashboardTicketMedioPoint[];
};

export type DashboardTicketMedioReport = {
  rendimento: DashboardTicketMedioSeries;
  lucratividade: DashboardTicketMedioSeries;
};
