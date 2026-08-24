"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

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
  SheetTrigger,
} from "@citybox/ui/atoms";

/**
 * Vendorizado no lugar de `@/components/modals/sheet-modal` do OdontoTech.
 * Mesma API pública; composto com os atoms de Sheet do @citybox/ui.
 * `hideCloseButton` do original vira `showCloseButton={!isPending}`.
 */

type SheetModalAction = {
  label: string;
  onClick?: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  type?: "button" | "submit";
  form?: string;
  disabled?: boolean;
  isPending?: boolean;
};

type SheetModalProps = {
  trigger?: React.ReactNode;
  title?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  actions?: SheetModalAction[];
  cancelLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  isPending?: boolean;
};

function SheetModal({
  trigger,
  title,
  header,
  children,
  actions = [],
  cancelLabel = "Fechar",
  open,
  onOpenChange,
  className,
  isPending,
}: SheetModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
        showCloseButton={!isPending}
        className={cn(
          "my-auto flex w-full flex-col rounded-xl data-[side=right]:sm:max-w-5xl md:mr-4 md:h-[95vh]",
          className,
        )}
      >
        <SheetHeader className="shrink-0 border-b">
          {header ?? <SheetTitle>{title}</SheetTitle>}
        </SheetHeader>

        <div className="-mb-4 flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="h-full flex-1">
            <div className="mb-8 px-4 py-2">{children}</div>
          </ScrollArea>
        </div>

        <SheetFooter className="flex-row justify-end gap-8 border-t pt-4 shadow-2xl">
          <SheetClose asChild>
            <Button variant="ghost" disabled={isPending}>
              {cancelLabel}
            </Button>
          </SheetClose>
          {actions.map((action, index) => (
            <Button
              className="px-8"
              key={index}
              type={action.type ?? "button"}
              variant={action.variant ?? "default"}
              form={action.form}
              onClick={action.onClick}
              disabled={action.disabled || action.isPending}
            >
              {action.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                action.label
              )}
            </Button>
          ))}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { SheetModal };
export type { SheetModalProps, SheetModalAction };
