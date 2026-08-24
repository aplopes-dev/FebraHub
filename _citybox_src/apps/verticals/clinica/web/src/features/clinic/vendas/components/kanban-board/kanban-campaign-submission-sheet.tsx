"use client";

import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

import { cn } from "@citybox/ui";
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@citybox/ui/atoms";
import { SubmissionDetailContent } from "@/features/clinic/marketing/campaigns/components/campaign-view/submission-detail-sheet";
import {
  CLINIC_NESTED_SHEET_BACKDROP_CLASS,
  CLINIC_NESTED_SHEET_CONTENT_CLASS,
  CLINIC_NESTED_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_HEADER_CLASS,
} from "@/features/clinic/lib/clinic-sheet-styles";

import { useCampaignSubmission } from "../../hooks/use-campaign-submission";

type KanbanCampaignSubmissionSheetProps = {
  submissionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function KanbanCampaignSubmissionSheet({
  submissionId,
  open,
  onOpenChange,
}: KanbanCampaignSubmissionSheetProps) {
  const { data, isPending, isError } = useCampaignSubmission(
    submissionId,
    open,
  );

  if (!submissionId) {
    return null;
  }

  return (
    <>
      {open && typeof document !== "undefined"
        ? createPortal(
            <button
              type="button"
              className={cn(
                CLINIC_NESTED_SHEET_BACKDROP_CLASS,
                "cursor-default border-0 p-0",
              )}
              aria-label="Fechar detalhes da resposta"
              onClick={() => onOpenChange(false)}
            />,
            document.body,
          )
        : null}

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          {...CLINIC_NESTED_SHEET_CONTENT_PROPS}
          className={cn(
            "flex flex-col gap-0 p-0",
            CLINIC_NESTED_SHEET_CONTENT_CLASS,
            "data-[side=right]:top-[calc(1rem+24px)] data-[side=right]:bottom-[calc(1rem+24px)] data-[side=right]:h-auto data-[side=right]:max-h-[calc(100dvh-2rem-20px)]",
          )}
        >
          <SheetHeader className={CLINIC_SHEET_HEADER_CLASS}>
            <SheetTitle>Detalhes da Resposta</SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {isPending ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando resposta...
              </div>
            ) : isError || !data ? (
              <p className="text-sm text-destructive">
                Não foi possível carregar a resposta do formulário.
              </p>
            ) : (
              <SubmissionDetailContent
                submission={data.submission}
                campaign={data.campaign}
                compact
              />
            )}
          </div>

          <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
            <Button
              type="button"
              variant="ghost"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
