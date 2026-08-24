import { z } from 'zod';

export const TICKET_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
] as const;

export const TICKET_MAX_FILES = 4;
export const TICKET_MAX_FILE_BYTES = 4 * 1024 * 1024;

export const supportTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, 'Informe um assunto com pelo menos 3 caracteres.'),
  description: z
    .string()
    .trim()
    .min(12, 'Descreva o problema com pelo menos 12 caracteres.'),
});

export type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;

export function firstTicketFieldError(
  error: z.ZodError,
): { field: string; message: string } {
  const issue = error.issues[0];
  const field = String(issue?.path[0] ?? 'subject');
  return { field, message: issue?.message ?? 'Revise os campos do chamado.' };
}
