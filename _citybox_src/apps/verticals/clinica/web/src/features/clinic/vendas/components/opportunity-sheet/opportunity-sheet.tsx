"use client";

import { useCallback } from "react";

import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";
import { ScrollArea } from "@citybox/ui/atoms";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@citybox/ui/atoms";

import { CLINIC_FLOATING_SHEET_CONTENT_CLASS } from "@/features/clinic/lib/clinic-sheet-styles";

import { OpportunityForm } from "./opportunity-form";
import type { OpportunityFormData } from "./opportunity-form-schema";

interface OpportunitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OpportunityFormData) => void;
}

const FORM_ID = "opportunity-form";

export function OpportunitySheet({
  open,
  onOpenChange,
  onSubmit,
}: OpportunitySheetProps) {
  const handleSubmit = useCallback(
    (data: OpportunityFormData) => {
      onSubmit(data);
      onOpenChange(false);
    },
    [onSubmit, onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          "flex flex-col gap-0 p-0",
          CLINIC_FLOATING_SHEET_CONTENT_CLASS,
          "data-[side=right]:sm:max-w-2xl",
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
          <SheetTitle className="text-base font-semibold">
            Nova Oportunidade
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-6 py-5">
            <OpportunityForm onSubmit={handleSubmit} formId={FORM_ID} />
          </div>
        </ScrollArea>

        <SheetFooter className="shrink-0 flex-row justify-end gap-3 border-t px-6 py-4">
          <SheetClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </SheetClose>
          <Button type="submit" form={FORM_ID} className="px-12">
            Criar oportunidade
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
