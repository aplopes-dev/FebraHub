'use client';

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import {
  CLINIC_FLOATING_SHEET_CONTENT_CLASS,
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
  CLINIC_SHEET_BODY_PADDING_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_HEADER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';

type PatientFormSheetFrameProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isSubmitting?: boolean;
  saveLabel: string;
  onSave: () => void;
  children: ReactNode;
};

/** Shell de sheet compartilhado entre criação e edição de paciente. */
export function PatientFormSheetFrame({
  open,
  onOpenChange,
  title,
  isSubmitting = false,
  saveLabel,
  onSave,
  children,
}: PatientFormSheetFrameProps) {
  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          CLINIC_FLOATING_SHEET_CONTENT_CLASS,
          CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
        )}
      >
        <SheetHeader className={CLINIC_SHEET_HEADER_CLASS}>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className={cn('relative', CLINIC_SHEET_SCROLL_BODY_CLASS)}>
          {isSubmitting ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Salvando…
              </div>
            </div>
          ) : null}

          <div className={CLINIC_SHEET_BODY_PADDING_CLASS}>{children}</div>
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={onSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              saveLabel
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
