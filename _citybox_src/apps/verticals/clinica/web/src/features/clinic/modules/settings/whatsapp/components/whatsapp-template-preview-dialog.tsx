'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';
import { WhatsappMessagePhonePreview } from '@/features/clinic/marketing/campaigns/components/campaign-templates/broadcast-template/whatsapp-message-phone-preview';
import {
  WHATSAPP_TEMPLATE_LABELS,
  type WhatsappTemplateItem,
} from '../types/whatsapp';

type WhatsappTemplatePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: WhatsappTemplateItem | null;
};

export function WhatsappTemplatePreviewDialog({
  open,
  onOpenChange,
  template,
}: WhatsappTemplatePreviewDialogProps) {
  const title = template
    ? WHATSAPP_TEMPLATE_LABELS[template.key]
    : 'Preview do template';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Visualização de como a mensagem aparece no WhatsApp do paciente.
          </DialogDescription>
        </DialogHeader>

        {template ? (
          <WhatsappMessagePhonePreview messageBody={template.body} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
