"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@citybox/ui/atoms";

/**
 * Vendorizado no lugar de `@/components/ui/modal` do OdontoTech. Mesma API
 * (`title` / `description` / `isOpen` / `onClose`), composto com os atoms de
 * Dialog do @citybox/ui.
 */

interface ModalProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  description,
  isOpen,
  onClose,
  children,
  hideCloseButton = false,
}) => {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent showCloseButton={!hideCloseButton}>
        <DialogHeader className="gap-3 pr-10 text-left">
          <DialogTitle className="leading-snug">{title}</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
};
