import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ClinicaApiError,
  clinicaFetch,
  clinicaMutationErrorMessage,
} from './clinica-client';
import * as authFetch from '@/lib/auth-fetch';
import { CLINICA_PERMISSION_DENIED_MESSAGE } from './handle-clinica-forbidden';
import {
  closePermissionDeniedDialog,
  getPermissionDeniedDialogState,
} from './permission-denied-dialog-store';

function jsonResponse(body: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response;
}

describe('clinicaFetch', () => {
  beforeEach(() => {
    closePermissionDeniedDialog();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    closePermissionDeniedDialog();
  });

  it('preserva a mensagem do envelope `error` (AppExceptionFilter)', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse(
        { error: { code: 'MemberNotFound', message: 'Membro não encontrado' } },
        404,
      ),
    );

    await expect(clinicaFetch('clinic-1', '/v1/members/x')).rejects.toMatchObject({
      status: 404,
      message: 'Membro não encontrado',
    });
  });

  it('preserva 403 de organização suspensa sem modal (mutation)', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse(
        {
          statusCode: 403,
          message: 'Organização suspensa. Regularize o pagamento para continuar.',
        },
        403,
      ),
    );

    await expect(
      clinicaFetch('clinic-1', '/v1/members', { method: 'POST', body: '{}' }),
    ).rejects.toMatchObject({
      status: 403,
      message: 'Organização suspensa. Regularize o pagamento para continuar.',
      handled: false,
    });
    expect(getPermissionDeniedDialogState().open).toBe(false);
  });

  it('GET 403 não abre modal', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse(
        {
          statusCode: 403,
          message: 'Você não tem permissão para manage Settings',
        },
        403,
      ),
    );

    await expect(
      clinicaFetch('clinic-1', '/v1/team/x/commission-rules'),
    ).rejects.toMatchObject({
      status: 403,
      message: 'Você não tem permissão para manage Settings',
    });
    expect(getPermissionDeniedDialogState().open).toBe(false);
  });

  it('PUT 403 de permissão: modal + handled (sem toast duplicado)', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse({ statusCode: 403, message: 'Forbidden' }, 403),
    );

    const error: unknown = await clinicaFetch('clinic-1', '/v1/members/x', {
      method: 'PUT',
      body: '{}',
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ClinicaApiError);
    expect(error).toMatchObject({
      status: 403,
      message: CLINICA_PERMISSION_DENIED_MESSAGE,
      handled: true,
    });
    expect(getPermissionDeniedDialogState().open).toBe(true);
    expect(clinicaMutationErrorMessage(error, 'fallback')).toBeNull();
  });

  it('junta as violações do ValidationPipe numa mensagem', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse(
        {
          statusCode: 400,
          message: ['username inválido', 'clinics não pode ser vazio'],
        },
        400,
      ),
    );

    await expect(clinicaFetch('clinic-1', '/v1/members')).rejects.toMatchObject({
      message: 'username inválido, clinics não pode ser vazio',
    });
  });

  it('cai na mensagem genérica quando a resposta não tem corpo JSON', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response);

    const error: unknown = await clinicaFetch('clinic-1', '/v1/members').catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ClinicaApiError);
    expect((error as ClinicaApiError).message).toBe(
      'Erro na API de clínica (502)',
    );
  });
});
