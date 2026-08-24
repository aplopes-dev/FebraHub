'use client';

import { LeadsPageContent } from './leads-page-content';

/** Composição da listagem — lista/kanban e lembretes via API. */
export function LeadsPage() {
  return (
    <div className="flex min-h-0 flex-col">
      <LeadsPageContent />
    </div>
  );
}
