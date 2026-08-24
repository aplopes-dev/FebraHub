import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

/// Extrai o Emitente (Company) do header `X-Company-Id` — equivalente ao
/// @StoreId() de food/clinica, nomeado para o domínio fiscal (FR-014).
///
/// ⚠️ NÃO USADO por design no v1 (decisão explícita registrada em
/// research.md §8, achado G1 de `/speckit-analyze`, 2026-08-04): nenhuma rota
/// de fiscal-documents/nfe liga este decorator a uma checagem de autorização
/// por Emitente hoje — a autorização do v1 é só por role/sistema chamador
/// (`PermissionGuard`), confiando que os sistemas internos do CityBox
/// (FR-015) já controlam o acesso por Loja/Emitente antes de chamar esta API.
/// Reservado para quando FR-015 for reaberto (onboarding externo/multi-tenant
/// de verdade) e checagem por Emitente por requisição passar a ser necessária.
export const CompanyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const raw = req.headers['x-company-id'] ?? req.headers['X-Company-Id'];
    const companyId = Array.isArray(raw) ? raw[0] : raw;
    if (!companyId?.trim())
      throw new BadRequestException('Header X-Company-Id obrigatório');
    return companyId.trim();
  },
);
