"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";

import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";
import { ScrollArea } from "@citybox/ui/atoms";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@citybox/ui/atoms";

/**
 * Vendorizado no lugar de `@/components/modals/dialog-modal` do OdontoTech.
 * Mesma API pública, agora composto com os atoms de Dialog do @citybox/ui.
 */

type DialogModalAction = {
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
  isLoading?: boolean;
};

type DialogModalSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl";

type DialogModalBaseProps = {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  actions?: DialogModalAction[];
  cancelLabel?: string;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: DialogModalSize;
  className?: string;
  scrollable?: boolean;
  isLoading?: boolean;
};

type DialogModalWithTitleProps = DialogModalBaseProps & {
  title: string;
  description?: string;
  header?: never;
  showCloseButton?: boolean;
};

type DialogModalWithCustomHeaderProps = DialogModalBaseProps & {
  title?: never;
  description?: never;
  header: React.ReactNode;
  showCloseButton?: never;
};

type DialogModalProps =
  | DialogModalWithTitleProps
  | DialogModalWithCustomHeaderProps;

const SIZE_CLASSES: Record<DialogModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
};

function DialogModal(props: DialogModalProps) {
  const {
    trigger,
    children,
    actions = [],
    cancelLabel = "Cancelar",
    onCancel,
    open,
    onOpenChange,
    size = "lg",
    className,
    scrollable = false,
    isLoading = false,
  } = props;

  const hasCustomHeader = "header" in props && props.header !== undefined;
  const title = hasCustomHeader ? undefined : props.title;
  const description = hasCustomHeader ? undefined : props.description;
  const showCloseButton = hasCustomHeader
    ? false
    : (props.showCloseButton ?? true);
  const header = hasCustomHeader ? props.header : undefined;

  const anyActionLoading = isLoading || actions.some((a) => a.isLoading);

  const handleCancel = () => {
    if (anyActionLoading) return;
    onCancel?.();
    onOpenChange?.(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && anyActionLoading) return;
    onOpenChange?.(nextOpen);
  };

  const content = scrollable ? (
    <ScrollArea className="min-h-0 flex-1">
      <div className="px-6 py-3">{children}</div>
    </ScrollArea>
  ) : (
    <div className="min-h-0 flex-1 overflow-auto px-4 py-3">{children}</div>
  );

  const renderHeader = () => {
    if (hasCustomHeader) {
      return (
        <DialogHeader className="shrink-0 border-b px-6 pb-3">
          {header}
        </DialogHeader>
      );
    }

    return (
      <DialogHeader className="shrink-0 border-b px-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-base">{title}</DialogTitle>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <Button
              variant="secondary"
              size="icon-sm"
              className="rounded-full text-muted-foreground hover:bg-secondary-foreground/10 hover:text-foreground"
              onClick={() => handleOpenChange(false)}
              disabled={anyActionLoading}
            >
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          )}
        </div>
      </DialogHeader>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn("flex flex-col px-0 py-2", SIZE_CLASSES[size], className)}
        showCloseButton={false}
      >
        {renderHeader()}

        {content}

        <DialogFooter className="shrink-0 border-t px-4 pt-2 pb-1">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={anyActionLoading}
          >
            {cancelLabel}
          </Button>
          {actions.map((action, index) => {
            const loading =
              action.isLoading ?? (isLoading && index === actions.length - 1);
            return (
              <Button
                className="min-w-24 px-8"
                key={index}
                type={action.type ?? "button"}
                variant={action.variant ?? "default"}
                form={action.form}
                onClick={action.onClick}
                disabled={action.disabled || anyActionLoading}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  action.label
                )}
              </Button>
            );
          })}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DialogModal };
export type { DialogModalProps, DialogModalAction, DialogModalSize };
