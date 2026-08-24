import { SetMetadata } from '@nestjs/common';

export const SKIP_CLINIC_SCOPE_KEY = 'citybox:skip-clinic-scope';

/**
 * Dispensa a checagem de escopo de clínica.
 *
 * Usar **só** em rotas que legitimamente não operam sobre uma clínica: descoberta de
 * acesso (`/v1/members/me`), catálogos estáticos e operação da plataforma.
 * Toda rota de domínio (paciente, agenda, financeiro) tem de passar pelo guard.
 */
export const SkipClinicScope = () => SetMetadata(SKIP_CLINIC_SCOPE_KEY, true);
