'use client';

import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@citybox/ui/atoms";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tabs, TabsList, TabsTrigger } from "@citybox/ui/atoms";

import {
  CLINIC_FLOATING_SHEET_CONTENT_CLASS,
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
} from "@/features/clinic/lib/clinic-sheet-styles";

import { SchedulingFormContent } from "../scheduling-form";
import { useSchedulingSheet } from "../contexts/scheduling-sheet-context";

const tabsTriggerClassName =
  "rounded-full border px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground";

export function SchedulingSheet() {
  const { isOpen, initialData, mode, closeSheet } = useSchedulingSheet();

  const editType =
    mode === "edit" && initialData && "type" in initialData
      ? (initialData.type as "appointment" | "commitment")
      : null;

  const editTitle =
    editType === "commitment" ? "Editar Compromisso" : "Editar Consulta";

  const tabsDefaultValue = editType ?? "appointment";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent
        className={cn(
          CLINIC_FLOATING_SHEET_CONTENT_CLASS,
          CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
          // Tablet 768: max-w-3xl (768px) + right-4 estourava a viewport.
          "data-[side=right]:w-[calc(100%-2rem)] data-[side=right]:max-w-[min(48rem,calc(100%-2rem))]",
        )}
      >
        <Tabs
          defaultValue={tabsDefaultValue}
          key={isOpen ? "open" : "closed"}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <SheetHeader className="shrink-0 border-b border-border/50 px-4 py-4 sm:px-6 sm:py-5">
            {mode === "edit" ? (
              <SheetTitle className="text-base font-semibold">
                {editTitle}
              </SheetTitle>
            ) : (
              <>
                <VisuallyHidden>
                  <SheetTitle>Novo Agendamento</SheetTitle>
                </VisuallyHidden>
                <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
                  <TabsTrigger
                    value="appointment"
                    className={tabsTriggerClassName}
                  >
                    Nova Consulta
                  </TabsTrigger>
                  <TabsTrigger
                    value="commitment"
                    className={tabsTriggerClassName}
                  >
                    Novo Compromisso
                  </TabsTrigger>
                </TabsList>
              </>
            )}
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <SchedulingFormContent mode={mode} initialData={initialData} />
            </div>
          </div>

          <SheetFooter className="shrink-0 flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
            <SheetClose asChild>
              <Button variant="ghost" className="w-full sm:w-auto">
                Fechar
              </Button>
            </SheetClose>
            <Button
              type="submit"
              form="scheduling-form"
              className="w-full px-12 sm:w-auto"
            >
              Salvar
            </Button>
          </SheetFooter>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
