import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLINICA_PERMISSION_DENIED_MESSAGE,
  promptPermissionDenied,
  resolveForbiddenClientMessage,
  shouldPromptPermissionDenied,
} from './handle-clinica-forbidden';
import {
  closePermissionDeniedDialog,
  getPermissionDeniedDialogState,
} from './permission-denied-dialog-store';

describe('handle-clinica-forbidden', () => {
  beforeEach(() => {
    closePermissionDeniedDialog();
  });

  afterEach(() => {
    closePermissionDeniedDialog();
  });

  it('não abre modal em GET', () => {
    expect(shouldPromptPermissionDenied('Forbidden', 'GET')).toBe(false);
  });

  it('não abre modal em 403 de pagamento (mutation)', () => {
    expect(
      shouldPromptPermissionDenied(
        'Organização suspensa. Regularize o pagamento para continuar.',
        'PUT',
      ),
    ).toBe(false);
  });

  it('abre modal em Forbidden / permissão CASL só em mutations', () => {
    expect(shouldPromptPermissionDenied('Forbidden', 'PUT')).toBe(true);
    expect(
      shouldPromptPermissionDenied(
        'Você não tem permissão para update Team',
        'POST',
      ),
    ).toBe(true);
  });

  it('usa mensagem padrão', () => {
    expect(resolveForbiddenClientMessage('Forbidden')).toBe(
      CLINICA_PERMISSION_DENIED_MESSAGE,
    );
  });

  it('preserva mensagem específica de habilitação da API', () => {
    expect(
      resolveForbiddenClientMessage(
        'Você não está habilitado para criar consultas',
      ),
    ).toBe('Você não está habilitado para criar consultas');
  });

  it('promptPermissionDenied abre o estado do modal', () => {
    promptPermissionDenied();
    expect(getPermissionDeniedDialogState()).toEqual({
      open: true,
      message: CLINICA_PERMISSION_DENIED_MESSAGE,
    });
  });
});
