import { toast } from '@citybox/mui/molecules';
import { ImoveisApiError } from '@/lib/imoveis-api';
import {
  mailtoHref,
  type LeadContactInfo,
} from '@/features/shared/utils/lead-contact';
import type { ContactLeadDetail, LeadDocument } from '../types';
import { sendLeadDocumentWhatsApp } from './leads-service';
import {
  downloadLeadDocumentFile,
  ensureLeadDocumentFile,
  shareLeadDocumentFile,
} from '../utils/lead-document-share';

export type LeadDocumentDeliveryInput = {
  leadId?: string;
  doc: LeadDocument;
  contact: LeadContactInfo;
};

export type LeadDocumentEmailDeliveryResult = {
  channel: 'email';
  mode: 'share' | 'mailto';
};

export type LeadDocumentWhatsAppDeliveryResult = {
  channel: 'whatsapp';
  mode: 'link';
  shareUrl: string;
  whatsappUrl: string;
  lead: ContactLeadDetail;
};

function buildLeadDocumentEmailMessage(
  doc: LeadDocument,
  contact: LeadContactInfo,
): string {
  const greeting = contact.name.trim() || 'cliente';
  return `Olá ${greeting},\n\nSegue o documento "${doc.name}" referente à negociação do imóvel. Fico à disposição para esclarecer dúvidas.\n\nAtenciosamente,`;
}

export async function deliverLeadDocumentByEmail(
  input: LeadDocumentDeliveryInput,
): Promise<LeadDocumentEmailDeliveryResult | null> {
  const email = input.contact.email?.trim();
  if (!email) {
    toast.error('Cadastre o e-mail do lead para enviar por e-mail.');
    return null;
  }

  const body = buildLeadDocumentEmailMessage(input.doc, input.contact);
  const subject = `Documento: ${input.doc.name}`;
  const file = await ensureLeadDocumentFile(input.doc);
  if (!file) return null;

  const shared = await shareLeadDocumentFile({
    file,
    title: subject,
    text: body,
  });
  if (shared) {
    return { channel: 'email', mode: 'share' };
  }

  downloadLeadDocumentFile(file);
  const params = new URLSearchParams({
    subject,
    body: `${body}\n\n(Anexe o arquivo "${file.name}" baixado agora.)`,
  });
  window.open(`${mailtoHref(email)}?${params.toString()}`, '_self');

  toast.message('E-mail aberto com o arquivo baixado', {
    description: `Anexe "${file.name}" na mensagem se o cliente não incluir automaticamente.`,
  });

  return { channel: 'email', mode: 'mailto' };
}

export async function deliverLeadDocumentByWhatsApp(
  input: LeadDocumentDeliveryInput,
): Promise<LeadDocumentWhatsAppDeliveryResult | null> {
  const phone = input.contact.phone?.trim();
  if (!phone) {
    toast.error('Cadastre o telefone do lead para enviar por WhatsApp.');
    return null;
  }
  if (!input.leadId) {
    toast.error('Salve o lead antes de enviar documentos pelo WhatsApp.');
    return null;
  }

  try {
    const sent = await sendLeadDocumentWhatsApp(input.leadId, input.doc.id);
    window.open(sent.whatsappUrl, '_blank', 'noopener,noreferrer');
    return {
      channel: 'whatsapp',
      mode: 'link',
      shareUrl: sent.shareUrl,
      whatsappUrl: sent.whatsappUrl,
      lead: sent.lead,
    };
  } catch (error) {
    const description =
      error instanceof ImoveisApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : undefined;
    toast.error('Não foi possível gerar o link do documento.', {
      description,
    });
    return null;
  }
}

export function leadDocumentDeliveryAvailability(contact: LeadContactInfo): {
  email: boolean;
  whatsapp: boolean;
} {
  return {
    email: Boolean(contact.email?.trim()),
    whatsapp: Boolean(contact.phone?.trim()),
  };
}
