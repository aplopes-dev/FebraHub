import { imoveisFetch } from '@/lib/imoveis-api';
import type { LeadReminder } from '@/features/leads/types';

type ApiReminder = {
  kind: LeadReminder['kind'];
  title: string;
  description: string;
  progress: number;
  people?: LeadReminder['people'];
  totalPeople?: number;
  isHighlighted?: boolean;
  href?: string;
};

type ApiRemindersResponse = {
  data: ApiReminder[];
};

export async function listReminders(options?: {
  agentId?: string;
}): Promise<readonly LeadReminder[]> {
  const params = new URLSearchParams();
  if (options?.agentId) params.set('agentId', options.agentId);
  const qs = params.toString();
  const res = await imoveisFetch<ApiRemindersResponse>(
    `/v1/reminders${qs ? `?${qs}` : ''}`,
  );
  return (res.data ?? []).map((item) => ({
    kind: item.kind,
    title: item.title,
    description: item.description,
    progress: item.progress,
    people: item.people,
    totalPeople: item.totalPeople,
    isHighlighted: item.isHighlighted,
    href: item.href,
  }));
}
