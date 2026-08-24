"use client";

import * as React from "react";
import { Loader2, XIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "../../atoms/dialog";
import { Button } from "../../atoms/button";
import { ScrollArea } from "../../atoms/scroll-area";

export interface ModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSave?: () => void;
  onClose?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  saveDisabled?: boolean;
  /** Oculta o rodapé de ações (salvar/cancelar). */
  hideFooter?: boolean;
  contentClassName?: string;
  footerClassName?: string;
}

export function ModalForm({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  onSave,
  onClose,
  saveLabel = "Salvar",
  cancelLabel = "Cancelar",
  isSaving,
  saveDisabled,
  hideFooter,
  contentClassName,
  footerClassName,
}: ModalFormProps) {
  const handleClose = () => {
    if (isSaving) return;
    onOpenChange(false);
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isSaving) return;
        onOpenChange(nextOpen);
        if (!nextOpen) onClose?.();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "gap-0 overflow-hidden p-2 sm:max-w-[640px] bg-muted",
          contentClassName,
        )}
      >
        <DialogDescription className="sr-only">
          {subtitle ?? "Formulário para preenchimento dos dados."}
        </DialogDescription>
        <div className="flex max-h-[min(580px,90vh)] flex-col overflow-hidden rounded-[10px] bg-background border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold leading-none">{title}</DialogTitle>
              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            <DialogClose asChild>
              <Button
                variant="secondary"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                onClick={handleClose}
                disabled={isSaving}
              >
                <XIcon size={16} />
                <span className="sr-only">Fechar</span>
              </Button>
            </DialogClose>
          </div>

          <div className="min-h-0 flex-1">
            <ScrollArea className="h-full">
              <div className="px-6 py-5">{children}</div>
            </ScrollArea>
          </div>

          {hideFooter ? null : (
            <div className={cn("flex items-center justify-end gap-2 border-t px-6 py-3", footerClassName)}>
              <Button variant="ghost" type="button" onClick={handleClose} disabled={isSaving}>
                {cancelLabel}
              </Button>
              <Button
                type="button"
                onClick={onSave}
                disabled={isSaving || saveDisabled}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {saveLabel}
                  </>
                ) : (
                  saveLabel
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
