'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@citybox/ui/atoms';
import { OdontogramBody, type OdontogramBodyProps } from './odontogram-body';

type PatientBudgetCorpogramAccordionProps = OdontogramBodyProps;

export function PatientBudgetCorpogramAccordion(props: PatientBudgetCorpogramAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="corpogram"
      className="w-full overflow-visible rounded-none border-0"
    >
      <AccordionItem value="corpogram" className="border-0 data-[state=open]:bg-transparent">
        <AccordionTrigger className="justify-end gap-2 rounded-xl bg-background px-4 py-3 hover:no-underline **:data-[slot=accordion-trigger-icon]:ml-0">
          <span className="text-sm font-medium text-foreground">
            <span className="group-aria-expanded/accordion-trigger:hidden">Abrir</span>
            <span className="hidden group-aria-expanded/accordion-trigger:inline">Fechar</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-1 pt-3 pb-1">
          <OdontogramBody {...props} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
