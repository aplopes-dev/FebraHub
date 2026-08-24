'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@citybox/ui/atoms';
import {
  PatientBudgetOdontogram,
  type PatientBudgetOdontogramProps,
} from './patient-budget-odontogram';

type PatientBudgetOdontogramAccordionProps = PatientBudgetOdontogramProps;

export function PatientBudgetOdontogramAccordion(props: PatientBudgetOdontogramAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="odontogram"
      className="w-full overflow-visible rounded-none border-0"
    >
      <AccordionItem
        value="odontogram"
        className="border-0 data-[state=open]:bg-transparent"
      >
        <AccordionTrigger className="justify-end gap-2 rounded-xl bg-background px-4 py-3 hover:no-underline **:data-[slot=accordion-trigger-icon]:ml-0">
          <span className="text-sm font-medium text-foreground">
            <span className="group-aria-expanded/accordion-trigger:hidden">Abrir</span>
            <span className="hidden group-aria-expanded/accordion-trigger:inline">Fechar</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-1 pt-3 pb-1">
          <PatientBudgetOdontogram {...props} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
