export type DashboardInadimplenciaPeriodMode = 'annual' | 'monthly';

export type InadimplenciaDebtRow = {
  id: string;
  dueDate: Date;
  description: string;
  valueCents: number;
  status: 'pending' | 'received';
  patientId: string;
  patientName: string;
  phone: string | null;
};

export type DashboardInadimplenciaReport = {
  totalDebtsCents: number;
  unpaidCents: number;
  receivedCents: number;
  ratePercent: number;
};

export type DashboardInadimplenciaDetailRow = {
  id: string;
  dueDate: string;
  daysOverdue: number;
  patientId: string;
  patientName: string;
  description: string;
  phone: string | null;
  unpaidCents: number;
};
