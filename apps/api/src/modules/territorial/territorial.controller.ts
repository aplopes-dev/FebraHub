/**
 * Rotas da Inteligência Territorial — porte dos três controllers do
 * aplopes-dev/hub (companies, niches, locations) unificados sob /territorial.
 *
 * A diferença que importa contra a origem: o hub rodava SEM autenticação
 * nenhuma (CORS + throttle e nada mais). Aqui TODA rota exige sessão (guard
 * global) e o setor 'geral' — que na prática significa diretoria/admin, a
 * mesma trava de /integracoes. Menu e rota do front escondem; quem manda é
 * este guard.
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { PrismaService } from '../../database/prisma.service';
import {
  CompanyFiltersDto,
  ConnectionsQueryDto,
  ExportCompaniesDto,
  ListCompaniesDto,
  UFS,
} from './territorial.dto';
import { TerritorialService } from './territorial.service';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

const CANONICAL_ORDER = [
  'tecnologia', 'saude', 'varejo', 'automotivo', 'construcao',
  'financeiro', 'educacao', 'industria', 'agronegocio', 'outros',
];

class CitiesQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : String(value).split(',').map((v: string) => v.trim()).filter(Boolean),
  )
  @IsIn(UFS as readonly string[], { each: true })
  states?: string[];
}

@ApiTags('territorial')
@Controller('territorial')
@ExigePermissao('territorial.ver')
export class TerritorialController {
  constructor(
    private readonly service: TerritorialService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('companies')
  @ApiOperation({ summary: 'Lista paginada de empresas do território' })
  @ApiOkResponse({ description: '{ data: Company[], pagination: { page, limit, total, totalPages } }' })
  list(@Query() query: ListCompaniesDto) {
    return this.service.list(query);
  }

  @Get('companies/map')
  @ApiOperation({ summary: 'Pontos do mapa (projeção leve, sem sócios/contatos)' })
  mapPoints(@Query() query: CompanyFiltersDto) {
    return this.service.mapPoints(query);
  }

  @Get('companies/metrics')
  @ApiOperation({ summary: 'Indicadores agregados do recorte' })
  metrics(@Query() query: CompanyFiltersDto) {
    return this.service.metrics(query);
  }

  @Get('companies/connections')
  @ApiOperation({ summary: 'Conexões entre empresas visíveis no recorte (teto com flag truncated)' })
  connections(@Query() query: ConnectionsQueryDto) {
    return this.service.connections(query);
  }

  @Get('companies/export')
  @ApiOperation({ summary: 'Registros completos do recorte para exportação (teto 5000)' })
  export(@Query() query: ExportCompaniesDto) {
    return this.service.export(query);
  }

  @Get('niches')
  @ApiOperation({
    summary: 'Nichos com contagem no recorte',
    description:
      'As contagens ignoram o próprio filtro de nicho — a legenda mostra o potencial de cada nicho dentro dos demais filtros.',
  })
  async niches(@Query() query: CompanyFiltersDto) {
    const [niches, counts] = await Promise.all([
      this.prisma.niche.findMany(),
      this.service.nicheCounts({ ...query, nicheIds: undefined }),
    ]);
    const countMap = new Map(counts.map((c) => [c.nicheId, c.count]));
    return niches
      .sort((a, b) => CANONICAL_ORDER.indexOf(a.slug) - CANONICAL_ORDER.indexOf(b.slug))
      .map((n) => ({
        id: n.id,
        slug: n.slug,
        name: n.name,
        color: n.color,
        icon: n.icon,
        count: countMap.get(n.id) ?? 0,
      }));
  }

  @Get('locations/states')
  @ApiOperation({ summary: 'Estados cobertos com contagem de empresas' })
  states() {
    return this.service.statesSummary();
  }

  @Get('locations/cities')
  @ApiOperation({ summary: 'Cidades com contagem de empresas (filtrável por UF)' })
  cities(@Query() query: CitiesQueryDto) {
    return this.service.citiesSummary(query.states);
  }

  // Por último de propósito: rota com parâmetro não pode engolir /map, /metrics etc.
  @Get('companies/:id')
  @ApiOperation({ summary: 'Detalhe da empresa com sócios, contatos e conexões' })
  @ApiParam({ name: 'id', example: 'r00001' })
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }
}
