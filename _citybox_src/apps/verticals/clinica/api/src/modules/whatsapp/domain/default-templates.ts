import type { WhatsappTemplateKey } from './whatsapp.types';

export const DEFAULT_WHATSAPP_TEMPLATES: Record<WhatsappTemplateKey, string> = {
  appointment_confirmation: `Olá, {nome_paciente}. 👋

Gostaríamos de confirmar sua consulta na {nome_clinica}, que está agendada para {dia_semana}, {data}, às {hora}.

Responda:
1 - Confirmar
2 - Cancelar

Esta é uma mensagem automática.
Em caso de dúvidas, entre em contato pelo telefone {telefone_clinica}.`,

  mgm: `Olá, {nome_paciente}! 🎁

Indique amigos para a {nome_clinica} e ganhe benefícios.

Em caso de dúvidas: {telefone_clinica}.`,

  debit_overdue: `Olá, {nome_paciente}.

Identificamos um débito em atraso na {nome_clinica}.

Entre em contato pelo telefone {telefone_clinica} para regularizar.`,

  treatment_return: `Olá, {nome_paciente}.

É hora do seu retorno na {nome_clinica}.

Entre em contato pelo telefone {telefone_clinica} para agendar.`,

  birthday: `Olá {nome_paciente}! Como está??

A equipe do(a) {nome_clinica} está passando por aqui para te desejar um feliz aniversário!
Que seu dia seja repleto de amor, paz e muitos sorrisos!`,

  nps: `Olá, {nome_paciente}!

Como foi seu atendimento na {nome_clinica}? Sua opinião é muito importante.

Responda de 0 a 10.

Dúvidas: {telefone_clinica}.`,
};

export const CONFIRMATION_ACK_TEMPLATE = `Olá {nome_paciente}, agradecemos por confirmar sua consulta. Esperamos você em nossa clínica na data e horário confirmado.`;

export const CANCELLATION_ACK_TEMPLATE = `Olá {nome_paciente}, sua consulta foi cancelada conforme solicitado. Se desejar reagendar, entre em contato com a clínica.`;

export const UNKNOWN_REPLY_TEMPLATE = `Olá! Este canal é utilizado apenas para confirmações automáticas. Em caso de dúvidas, entre em contato com a clínica pelo telefone {telefone_clinica}.`;

/** Resposta quando a consulta ainda aguarda 1/2 e o paciente mandou outra coisa. */
export const INVALID_CONFIRMATION_REPLY_TEMPLATE = `Resposta inválida. Responda:
1 - Confirmar
2 - Cancelar`;

/** Lembrete automático (~2h se confirmada, ou ~5min se ainda sem resposta 1/2). */
export const APPOINTMENT_REMINDER_TEMPLATE = `Não se esqueça! Sua consulta na {nome_clinica} já está confirmada para hoje, {data}, às {hora}. Esperamos por você.`;

export function appointmentReminderCorrelationId(appointmentId: string): string {
  return `appointment-reminder:${appointmentId}`;
}

/** Lembrete T-5min quando a consulta segue `scheduled` (sem reply 1/2). */
export function appointmentPendingReminderCorrelationId(
  appointmentId: string,
): string {
  return `appointment-pending-reminder:${appointmentId}`;
}
