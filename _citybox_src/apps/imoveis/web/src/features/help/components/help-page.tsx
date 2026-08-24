'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box } from '@citybox/mui/atoms';
import { useSessionPermissions } from '@/features/settings/hooks/use-session-permissions';
import { HELP_FAQS, visibleHelpFaqs } from '../data/faq-data';
import {
  HELP_MODULES,
  HELP_SUPPORT_CHANNELS,
  visibleHelpModules,
} from '../data/help-content';
import { filterHelpCatalog } from '../data/help-search';
import { HelpFaq } from './help-faq';
import { HelpHero } from './help-hero';
import { HelpModuleGrid } from './help-module-grid';
import { HelpSupportChannels } from './help-support-channels';
import { SupportTicketDialog } from './support-ticket-dialog';

export function HelpPage() {
  const searchParams = useSearchParams();
  const { canNav } = useSessionPermissions();
  const [ticketOpen, setTicketOpen] = useState(false);
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const searchActive = query.trim().length > 0;

  const visibleModules = useMemo(
    () => visibleHelpModules(HELP_MODULES, canNav),
    [canNav],
  );
  const visibleFaqs = useMemo(
    () => visibleHelpFaqs(HELP_FAQS, canNav),
    [canNav],
  );

  const filtered = useMemo(
    () =>
      filterHelpCatalog(query, {
        modules: visibleModules,
        faqs: visibleFaqs,
      }),
    [query, visibleFaqs, visibleModules],
  );

  const faqSection = (
    <HelpFaq
      items={filtered.faqs}
      query={query}
      searchActive={searchActive}
      onOpenTicket={() => setTicketOpen(true)}
    />
  );

  const modulesSection =
    filtered.modules.length > 0 ? (
      <HelpModuleGrid modules={filtered.modules} />
    ) : null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: { xs: 3, sm: 4 },
      }}
    >
      <HelpHero query={query} onQueryChange={setQuery} />

      {searchActive ? (
        <>
          {faqSection}
          {modulesSection}
        </>
      ) : (
        <>
          {modulesSection}
          {faqSection}
        </>
      )}

      <HelpSupportChannels
        channels={HELP_SUPPORT_CHANNELS}
        onOpenTicket={() => setTicketOpen(true)}
      />

      <SupportTicketDialog
        open={ticketOpen}
        onOpenChange={setTicketOpen}
      />
    </Box>
  );
}
