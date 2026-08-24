import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { resolveScopedAgentId } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { GlobalSearchUseCase } from '../../../../application/use-cases/global-search/global-search.use-case';
import { GlobalSearchPresenter } from './global-search.presenter';

@ApiTags('search')
@ApiBearerAuth()
@Controller('v1/search')
export class GlobalSearchRoute {
  constructor(private readonly globalSearch: GlobalSearchUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Dashboard')
  @ApiOperation({
    summary:
      'Busca global FTS (leads, imóveis, negócios, agenda) — escopo do corretor',
  })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'perType', required: false })
  @ApiQuery({
    name: 'agentId',
    required: false,
    description: 'Só admin/dono — filtro opcional',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('q') q?: string,
    @Query('perType') perTypeRaw?: string,
    @Query('agentId') agentId?: string,
  ) {
    if (typeof q !== 'string') {
      throw new BadRequestException('q é obrigatório.');
    }
    if (q.length > 200) {
      throw new BadRequestException('q deve ter no máximo 200 caracteres.');
    }

    let perType: number | undefined;
    if (perTypeRaw !== undefined && perTypeRaw !== '') {
      const parsed = Number(perTypeRaw);
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new BadRequestException('perType deve ser um inteiro ≥ 1.');
      }
      perType = parsed;
    }

    const scopedAgentId = resolveScopedAgentId({
      user,
      scope,
      requestedAgentId: typeof agentId === 'string' ? agentId : undefined,
    });

    const result = await this.globalSearch.execute({
      storeId,
      q,
      perType,
      agentId: scopedAgentId,
    });

    return GlobalSearchPresenter.toHttp(result);
  }
}
