import { toast } from 'sonner';
import { buildPatientWhatsAppUrl } from '@/features/clinic/modules/dashboard/lib/build-patient-whatsapp-url';

export function openIndicacoesWhatsApp(phone: string, name: string): void {
  const url = buildPatientWhatsAppUrl(phone, name);
  if (!url) {
    toast.error('Telefone inválido para WhatsApp.');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
