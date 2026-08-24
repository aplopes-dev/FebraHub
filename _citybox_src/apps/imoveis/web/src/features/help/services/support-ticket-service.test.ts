import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  firstTicketFieldError,
  supportTicketSchema,
} from '../schemas/support-ticket-schema';
import {
  assertTicketFiles,
  generateSupportProtocol,
  SupportTicketValidationError,
  submitSupportTicket,
} from './support-ticket-service';

describe('supportTicketSchema', () => {
  it('accepts a complete payload', () => {
    const parsed = supportTicketSchema.safeParse({
      subject: 'Kanban travado',
      description: 'Não consigo arrastar o card para pagamento.',
    });
    assert.equal(parsed.success, true);
  });

  it('rejects a short subject with a Portuguese message', () => {
    const parsed = supportTicketSchema.safeParse({
      subject: 'oi',
      description: 'Descrição longa o suficiente.',
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      const { field, message } = firstTicketFieldError(parsed.error);
      assert.equal(field, 'subject');
      assert.match(message, /assunto/i);
    }
  });
});

describe('generateSupportProtocol', () => {
  it('uses IMO-YYYYMMDD-NNNN', () => {
    const protocol = generateSupportProtocol(new Date('2026-08-17T12:00:00Z'));
    assert.match(protocol, /^IMO-20260817-\d{4}$/);
  });
});

describe('assertTicketFiles', () => {
  it('rejects more than four files', () => {
    const files = Array.from(
      { length: 5 },
      (_, index) => new File(['x'], `a${index}.png`, { type: 'image/png' }),
    );
    assert.throws(
      () => assertTicketFiles(files),
      (error: unknown) =>
        error instanceof SupportTicketValidationError && error.field === 'files',
    );
  });
});

describe('submitSupportTicket', () => {
  it('returns a protocol for a valid ticket', async () => {
    const result = await submitSupportTicket({
      subject: 'Erro ao salvar lead',
      description: 'Cliquei em salvar e a tela ficou em branco.',
    });
    assert.match(result.protocol, /^IMO-\d{8}-\d{4}$/);
  });

  it('throws a field error when the description is too short', async () => {
    await assert.rejects(
      () =>
        submitSupportTicket({
          subject: 'Erro no painel',
          description: 'curto',
        }),
      (error: unknown) =>
        error instanceof SupportTicketValidationError &&
        error.field === 'description',
    );
  });
});
