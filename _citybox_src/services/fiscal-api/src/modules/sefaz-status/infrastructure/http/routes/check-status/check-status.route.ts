import { Controller, Get, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CompanyId } from '../../../../../../shared/infra/http/decorators/company-id.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { CheckSefazStatusUseCase } from '../../../../application/use-cases/check-sefaz-status/check-sefaz-status.use-case';
import type {
  ModelStatus,
  StatusResponse,
} from '../../../../domain/status-response';
import { CheckStatusQueryDto } from './check-status.dto';

/// Serializa datas em ISO-8601 para a resposta HTTP (o contrato usa strings).
function toHttp(response: StatusResponse) {
  return {
    overall: response.overall,
    checkedForCompanyId: response.checkedForCompanyId,
    environment: response.environment,
    results: response.results.map((result: ModelStatus) => ({
      model: result.model,
      authority: result.authority,
      status: result.status,
      authorityMessage: result.authorityMessage,
      expectedReturnAt: result.expectedReturnAt?.toISOString() ?? null,
      checkedAt: result.checkedAt.toISOString(),
      ageSeconds: result.ageSeconds,
      nextCheckAt: result.nextCheckAt?.toISOString() ?? null,
    })),
  };
}

/// US1 — `GET /api/v1/sefaz-status`. Consulta de disponibilidade dos órgãos,
/// separada de qualquer emissão (FR-001).
@ApiTags('sefaz-status')
@Controller('v1/sefaz-status')
@RequirePermission('fiscal.documents.view')
export class CheckStatusRoute {
  constructor(private readonly checkStatus: CheckSefazStatusUseCase) {}

  @Get()
  @ApiHeader({
    name: 'X-Company-Id',
    required: true,
    description:
      'Emitente para o qual se consulta. Validado contra a participação do usuário na loja — empresa de outro tenant responde 404.',
  })
  @ApiOperation({
    summary: 'Consultar disponibilidade dos órgãos (NF-e, NFC-e, NFS-e)',
    description:
      'Distingue "o órgão respondeu que está fora" de "não obtivemos resposta". Um órgão inalcançável dá 200 com o detalhe em results[].status — não derruba a consulta. Não consome numeração nem cria documento.',
  })
  @ApiResponse({
    status: 200,
    description: 'Consulta concluída (ver overall e results[]).',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa inexistente ou de outro tenant.',
  })
  @ApiResponse({
    status: 422,
    description: 'Falha local (ex.: certificado) que afeta toda a consulta.',
  })
  @ApiResponse({
    status: 424,
    description:
      'PRODUCTION solicitado sem configuração — recusado antes de qualquer contato.',
  })
  async handle(
    @Query() query: CheckStatusQueryDto,
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const response = await this.checkStatus.execute({
      companyId,
      user,
      models: query.models,
      environment: query.environment,
    });
    return toHttp(response);
  }
}
