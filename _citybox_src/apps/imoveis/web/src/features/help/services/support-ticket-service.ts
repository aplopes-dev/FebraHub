import {
  TICKET_ALLOWED_MIME_TYPES,
  TICKET_MAX_FILE_BYTES,
  TICKET_MAX_FILES,
  firstTicketFieldError,
  supportTicketSchema,
  type SupportTicketFormValues,
} from '../schemas/support-ticket-schema';

export type SubmitSupportTicketInput = SupportTicketFormValues & {
  files?: readonly File[];
};

export type SubmitSupportTicketResult = {
  protocol: string;
};

export class SupportTicketValidationError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'SupportTicketValidationError';
    this.field = field;
  }
}

const ALLOWED_MIME = new Set<string>(TICKET_ALLOWED_MIME_TYPES);

export function generateSupportProtocol(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const suffix = String(Math.floor(Math.random() * 10_000)).padStart(4, '0');
  return `IMO-${year}${month}${day}-${suffix}`;
}

export function assertTicketFiles(files: readonly File[]): void {
  if (files.length > TICKET_MAX_FILES) {
    throw new SupportTicketValidationError(
      'files',
      `Envie no máximo ${TICKET_MAX_FILES} arquivos.`,
    );
  }

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      throw new SupportTicketValidationError(
        'files',
        'Use imagens (PNG, JPG, WebP), PDF ou texto.',
      );
    }
    if (file.size > TICKET_MAX_FILE_BYTES) {
      throw new SupportTicketValidationError(
        'files',
        'Cada arquivo deve ter no máximo 4 MB.',
      );
    }
  }
}

/**
 * Envio do chamado. Hoje gera protocolo localmente; trocar o corpo
 * por `imoveisFetch` quando a API de suporte existir.
 */
export async function submitSupportTicket(
  input: SubmitSupportTicketInput,
): Promise<SubmitSupportTicketResult> {
  const parsed = supportTicketSchema.safeParse(input);
  if (!parsed.success) {
    const { field, message } = firstTicketFieldError(parsed.error);
    throw new SupportTicketValidationError(field, message);
  }

  assertTicketFiles(input.files ?? []);

  await new Promise((resolve) => {
    setTimeout(resolve, 350);
  });

  return { protocol: generateSupportProtocol() };
}
