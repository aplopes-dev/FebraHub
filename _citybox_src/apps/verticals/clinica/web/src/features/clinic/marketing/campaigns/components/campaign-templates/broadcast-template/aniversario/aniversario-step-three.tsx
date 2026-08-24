'use client';

import { WhatsappMessagePhonePreview } from '../whatsapp-message-phone-preview';
import type { AniversarioStepTwoFormData } from './aniversario-form.schema';

type AniversarioStepThreeProps = {
  stepTwoData?: Partial<AniversarioStepTwoFormData>;
};

export function AniversarioStepThree({
  stepTwoData,
}: AniversarioStepThreeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold">Pré-visualização</h2>
        <p className="text-muted-foreground text-sm">
          Veja como a mensagem de aniversário aparecerá no WhatsApp do paciente.
        </p>
      </div>

      <WhatsappMessagePhonePreview
        messageBody={stepTwoData?.messageBody?.trim() || ''}
      />
    </div>
  );
}
