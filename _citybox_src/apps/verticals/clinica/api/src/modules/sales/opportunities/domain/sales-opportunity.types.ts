export type SalesOpportunityOrigin =
  | 'instagram'
  | 'facebook'
  | 'google'
  | 'whatsapp'
  | 'site'
  | 'indicacao'
  | 'retorno'
  | 'campaign'
  | 'budget'
  | 'outro';

export type SalesOpportunityHistoryAction =
  | 'created'
  | 'moved'
  | 'comment'
  | 'label_changed'
  | 'contact_scheduled'
  | 'updated';

export type SalesOpportunityPatientSnapshot = {
  name: string;
  phone?: string;
  email?: string;
};

export type SalesOpportunityProps = {
  storeId: string;
  funnelId: string;
  stageId: string;
  title: string;
  description: string | null;
  phone: string | null;
  origin: SalesOpportunityOrigin | null;
  nextContact: Date | null;
  patientId: string | null;
  labelId: string | null;
  submissionId: string | null;
  budgetId: string | null;
  sortOrder: number;
  lastInteractionAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: SalesOpportunityPatientSnapshot | null;
  /** Resolved from current stage — not persisted on opportunity row */
  stageType?: 'others' | 'won' | 'lost';
};

export type SalesOpportunityHistoryProps = {
  storeId: string;
  opportunityId: string;
  actionType: SalesOpportunityHistoryAction;
  userId: string | null;
  userName: string | null;
  userAvatar: string | null;
  content: string | null;
  metadata: Record<string, unknown> | null;
  isSystemAction: boolean;
  systemName: string | null;
  createdAt: Date;
};

export function onlyDigits(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameCivilDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
