'use client';

import { cn } from '@citybox/ui';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Separator,
} from '@citybox/ui/atoms';
import { REPORTS_CATALOG } from '../lib/reports-catalog';
import type { ReportId } from '../types/clinic-reports';

type ReportsCatalogAccordionProps = {
  selectedReportId: ReportId;
  onSelectReport: (reportId: ReportId) => void;
};

export function ReportsCatalogAccordion({
  selectedReportId,
  onSelectReport,
}: ReportsCatalogAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="patients"
      className="border-border/60"
    >
      {REPORTS_CATALOG.map((group) => (
        <AccordionItem
          key={group.id}
          value={group.id}
          className="rounded-none"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="text-sm font-medium text-foreground">
              {group.label}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-3">
            <Separator className="mb-2" />
            <ul className="space-y-1 px-3">
              {group.items.map((item) => {
                const isSelected = item.id === selectedReportId;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        isSelected
                          ? 'font-medium text-primary'
                          : 'text-foreground hover:bg-muted/60',
                      )}
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => onSelectReport(item.id)}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
