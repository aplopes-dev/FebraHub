'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLeadQuery } from '../hooks/use-leads-queries';
import { LeadFormPage } from './lead-form-page';
import type { LeadFormTabValue } from './lead-form-tabs';

const LEAD_FORM_TABS: readonly LeadFormTabValue[] = [
  'contact',
  'properties',
  'documents',
  'activity',
];

function parseInitialTab(raw: string | null): LeadFormTabValue | undefined {
  if (!raw) return undefined;
  return LEAD_FORM_TABS.includes(raw as LeadFormTabValue)
    ? (raw as LeadFormTabValue)
    : undefined;
}

/** Carrega o lead da API antes de montar o form. */
export function LeadFormLoader({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = parseInitialTab(searchParams.get('tab'));
  const { data: lead, isLoading, isError } = useLeadQuery(id);

  useEffect(() => {
    if (isLoading) return;
    if (isError || lead === null) {
      router.replace('/leads');
    }
  }, [isLoading, isError, lead, router]);

  if (isLoading || lead === undefined) {
    return (
      <div className="rounded-4xl border border-border/70 bg-card px-6 py-16 text-center text-sm text-muted-foreground">
        Carregando lead…
      </div>
    );
  }

  if (!lead) return null;

  return <LeadFormPage mode="edit" initialLead={lead} initialTab={initialTab} />;
}
