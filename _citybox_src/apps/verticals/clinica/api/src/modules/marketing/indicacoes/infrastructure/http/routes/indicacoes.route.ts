import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetIndicacoesKpisUseCase } from '../../../application/use-cases/get-indicacoes-kpis/get-indicacoes-kpis.use-case';
import { ListIndicacoesReferredPatientsUseCase } from '../../../application/use-cases/list-indicacoes-referred-patients/list-indicacoes-referred-patients.use-case';
import { ListIndicacoesReferrersUseCase } from '../../../application/use-cases/list-indicacoes-referrers/list-indicacoes-referrers.use-case';
import {
  IndicacoesPeriodQueryDto,
  ListIndicacoesReferrersQueryDto,
  ListIndicacoesReferredPatientsQueryDto,
} from './indicacoes.query.dto';

@ApiTags('indicacoes')
@Controller('v1/indicacoes')
@RequirePermission('read', 'Marketing')
export class IndicacoesRoute {
  constructor(
    private readonly getIndicacoesKpis: GetIndicacoesKpisUseCase,
    private readonly listIndicacoesReferredPatients: ListIndicacoesReferredPatientsUseCase,
    private readonly listIndicacoesReferrers: ListIndicacoesReferrersUseCase,
  ) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs da tela Indicações (Marketing)' })
  async kpis(
    @StoreId() storeId: string,
    @Query() query: IndicacoesPeriodQueryDto,
  ) {
    const data = await this.getIndicacoesKpis.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
    });
    return { data };
  }

  @Get('referred-patients')
  @ApiOperation({ summary: 'Pacientes indicados (paginado)' })
  async referredPatients(
    @StoreId() storeId: string,
    @Query() query: ListIndicacoesReferredPatientsQueryDto,
  ) {
    const result = await this.listIndicacoesReferredPatients.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
      page: query.page,
      perPage: query.perPage,
      sortOrder: query.sortOrder,
      referrerKind: query.referrerKind,
      referrerId: query.referrerId,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('referrers')
  @ApiOperation({ summary: 'Pacientes e profissionais indicadores (paginado)' })
  async referrers(
    @StoreId() storeId: string,
    @Query() query: ListIndicacoesReferrersQueryDto,
  ) {
    const result = await this.listIndicacoesReferrers.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
      page: query.page,
      perPage: query.perPage,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
