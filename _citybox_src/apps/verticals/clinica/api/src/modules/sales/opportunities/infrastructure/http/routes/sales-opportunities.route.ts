import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { filterVisibleSalesFunnels } from '@citybox/clinica-permissions';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  RequireAnyPermission,
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { GetSalesFunnelUseCase } from '../../../../funnels/application/use-cases/get-sales-funnel/get-sales-funnel.use-case';
import { ListSalesFunnelsUseCase } from '../../../../funnels/application/use-cases/list-sales-funnels/list-sales-funnels.use-case';
import { assertCanViewSalesFunnel } from '../../../../shared/infra/assert-sales-funnel-visibility';

import { AddSalesOpportunityCommentUseCase } from '../../../application/use-cases/add-sales-opportunity-comment/add-sales-opportunity-comment.use-case';
import { CreateSalesOpportunityUseCase } from '../../../application/use-cases/create-sales-opportunity/create-sales-opportunity.use-case';
import { DeleteSalesOpportunityUseCase } from '../../../application/use-cases/delete-sales-opportunity/delete-sales-opportunity.use-case';
import { GetSalesOpportunityUseCase } from '../../../application/use-cases/get-sales-opportunity/get-sales-opportunity.use-case';
import { ListSalesOpportunitiesUseCase } from '../../../application/use-cases/list-sales-opportunities/list-sales-opportunities.use-case';
import { ListSalesOpportunityHistoryUseCase } from '../../../application/use-cases/list-sales-opportunity-history/list-sales-opportunity-history.use-case';
import { MoveSalesOpportunityUseCase } from '../../../application/use-cases/move-sales-opportunity/move-sales-opportunity.use-case';
import { ReorderSalesOpportunitiesUseCase } from '../../../application/use-cases/reorder-sales-opportunities/reorder-sales-opportunities.use-case';
import { UpdateSalesOpportunityUseCase } from '../../../application/use-cases/update-sales-opportunity/update-sales-opportunity.use-case';
import type { SalesOpportunity } from '../../../domain/entities/sales-opportunity.entity';
import type { SalesOpportunityHistory } from '../../../domain/entities/sales-opportunity-history.entity';
import {
  SalesOpportunityRepository,
  type SalesOpportunityCampaignLink,
} from '../../../domain/repositories/sales-opportunity.repository';
import type { SalesOpportunityOrigin } from '../../../domain/sales-opportunity.types';

const ORIGINS: SalesOpportunityOrigin[] = [
  'instagram',
  'facebook',
  'google',
  'whatsapp',
  'site',
  'indicacao',
  'retorno',
  'campaign',
  'budget',
  'outro',
];

class ListSalesOpportunitiesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  perPage?: number;

  @IsOptional()
  @IsUUID()
  funnelId?: string;

  @IsOptional()
  @ValidateIf((_, v) => typeof v === 'string' && v !== 'all')
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @ValidateIf((_, v) => typeof v === 'string' && v !== 'all')
  @IsUUID()
  labelId?: string;

  @IsOptional()
  @IsIn(ORIGINS)
  origin?: SalesOpportunityOrigin;

  @IsOptional()
  @IsDateString()
  nextContactDate?: string;

  @IsOptional()
  @IsIn(['all', 'this_week', 'this_month', 'custom'])
  period?: 'all' | 'this_week' | 'this_month' | 'custom';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

class CreateSalesOpportunityBodyDto {
  @IsUUID()
  funnelId!: string;

  @IsUUID()
  stageId!: string;

  @MinLength(1)
  @MaxLength(200)
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(ORIGINS)
  origin?: SalesOpportunityOrigin;

  @IsOptional()
  @IsDateString()
  nextContact?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  labelId?: string;

  @IsOptional()
  @IsString()
  submissionId?: string;
}

class UpdateSalesOpportunityBodyDto {
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsIn([...ORIGINS, null])
  origin?: SalesOpportunityOrigin | null;

  @IsOptional()
  @IsDateString()
  nextContact?: string | null;

  @IsOptional()
  @IsUUID()
  patientId?: string | null;

  @IsOptional()
  @IsUUID()
  labelId?: string | null;

  @IsOptional()
  @IsUUID()
  stageId?: string;
}

class MoveSalesOpportunityBodyDto {
  @IsUUID()
  stageId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

class ReorderSalesOpportunityItemDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  stageId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

class ReorderSalesOpportunitiesBodyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderSalesOpportunityItemDto)
  items!: ReorderSalesOpportunityItemDto[];
}

class AddCommentBodyDto {
  @MinLength(1)
  @MaxLength(5000)
  @IsString()
  content!: string;
}

function toOpportunityResponse(
  opportunity: SalesOpportunity,
  campaignLink?: SalesOpportunityCampaignLink,
) {
  return {
    id: opportunity.id,
    funnelId: opportunity.funnelId,
    stageId: opportunity.stageId,
    storeId: opportunity.storeId,
    title: opportunity.title,
    description: opportunity.description ?? undefined,
    phone: opportunity.phone ?? undefined,
    origin: opportunity.origin ?? undefined,
    nextContact: opportunity.nextContact?.toISOString(),
    patientId: opportunity.patientId ?? undefined,
    labelId: opportunity.labelId ?? undefined,
    submissionId: opportunity.submissionId ?? undefined,
    budgetId: opportunity.budgetId ?? undefined,
    campaign: campaignLink
      ? { id: campaignLink.campaignId, name: campaignLink.campaignName }
      : undefined,
    sortOrder: opportunity.sortOrder,
    isDeletable: true,
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
    lastInteraction: opportunity.lastInteractionAt?.toISOString(),
    patient: opportunity.patient
      ? {
          name: opportunity.patient.name,
          phone: opportunity.patient.phone,
          email: opportunity.patient.email,
        }
      : undefined,
  };
}

function toHistoryResponse(entry: SalesOpportunityHistory) {
  return {
    id: entry.id,
    actionType: entry.actionType,
    userId: entry.userId ?? undefined,
    userName: entry.userName ?? undefined,
    userAvatar: entry.userAvatar ?? undefined,
    content: entry.content ?? undefined,
    metadata: entry.metadata ?? undefined,
    isSystemAction: entry.isSystemAction,
    systemName: entry.systemName ?? undefined,
    createdAt: entry.createdAt.toISOString(),
  };
}

@ApiTags('sales-opportunities')
@Controller('v1/opportunities')
export class SalesOpportunitiesRoute {
  constructor(
    private readonly listOpportunities: ListSalesOpportunitiesUseCase,
    private readonly getOpportunity: GetSalesOpportunityUseCase,
    private readonly createOpportunity: CreateSalesOpportunityUseCase,
    private readonly updateOpportunity: UpdateSalesOpportunityUseCase,
    private readonly moveOpportunity: MoveSalesOpportunityUseCase,
    private readonly reorderOpportunities: ReorderSalesOpportunitiesUseCase,
    private readonly deleteOpportunity: DeleteSalesOpportunityUseCase,
    private readonly listHistory: ListSalesOpportunityHistoryUseCase,
    private readonly addComment: AddSalesOpportunityCommentUseCase,
    private readonly opportunityRepository: SalesOpportunityRepository,
    private readonly getFunnel: GetSalesFunnelUseCase,
    private readonly listFunnels: ListSalesFunnelsUseCase,
  ) {}

  @Get()
  @RequireAnyPermission(
    { action: 'access', subject: 'Sales' },
    { action: 'read', subject: 'Sales' },
    { action: 'readScheduleFunnel', subject: 'Sales' },
    { action: 'readSalesFunnel', subject: 'Sales' },
    { action: 'readCustomFunnel', subject: 'Sales' },
    { action: 'readClinicFunnels', subject: 'Sales' },
    { action: 'manage', subject: 'Sales' },
  )
  @ApiOperation({ summary: 'Listar oportunidades' })
  async list(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @Query() query: ListSalesOpportunitiesQueryDto,
  ) {
    let funnelId = query.funnelId;
    let funnelIds: string[] | undefined;

    if (funnelId) {
      const funnel = await this.getFunnel.execute({
        storeId,
        id: funnelId,
      });
      assertCanViewSalesFunnel(funnel, user);
    } else {
      const listed = await this.listFunnels.execute({
        storeId,
        page: 1,
        perPage: 100,
      });
      const visible = filterVisibleSalesFunnels(
        listed.items,
        user.permissions ?? [],
      );
      if (visible.length === 0) {
        return {
          data: [],
          meta: { total: 0, page: 1, perPage: query.perPage ?? 100, totalPages: 0 },
        };
      }
      funnelIds = visible.map((funnel) => funnel.id);
    }

    const result = await this.listOpportunities.execute({
      storeId,
      page: query.page,
      perPage: query.perPage ?? 100,
      funnelId,
      funnelIds,
      stageId: query.stageId,
      patientId: query.patientId,
      labelId: query.labelId,
      origin: query.origin,
      nextContactDate: query.nextContactDate
        ? new Date(query.nextContactDate)
        : undefined,
      period: query.period,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      search: query.search,
    });

    const submissionIds = result.items
      .map((item) => item.submissionId)
      .filter((id): id is string => Boolean(id));
    const campaignLinks =
      await this.opportunityRepository.findCampaignLinksBySubmissionIds(
        storeId,
        submissionIds,
      );

    return {
      data: result.items.map((item) =>
        toOpportunityResponse(
          item,
          item.submissionId ? campaignLinks[item.submissionId] : undefined,
        ),
      ),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  @RequireAnyPermission(
    { action: 'access', subject: 'Sales' },
    { action: 'read', subject: 'Sales' },
    { action: 'readScheduleFunnel', subject: 'Sales' },
    { action: 'readSalesFunnel', subject: 'Sales' },
    { action: 'readCustomFunnel', subject: 'Sales' },
    { action: 'readClinicFunnels', subject: 'Sales' },
    { action: 'manage', subject: 'Sales' },
  )
  @ApiOperation({ summary: 'Buscar oportunidade' })
  async findOne(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @Param('id') id: string,
  ) {
    const opportunity = await this.getOpportunity.execute({ storeId, id });
    const funnel = await this.getFunnel.execute({
      storeId,
      id: opportunity.funnelId,
    });
    assertCanViewSalesFunnel(funnel, user);
    const campaignLinks = opportunity.submissionId
      ? await this.opportunityRepository.findCampaignLinksBySubmissionIds(
          storeId,
          [opportunity.submissionId],
        )
      : {};
    return {
      data: toOpportunityResponse(
        opportunity,
        opportunity.submissionId
          ? campaignLinks[opportunity.submissionId]
          : undefined,
      ),
    };
  }

  @Post()
  @RequirePermission('manage', 'Sales')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar oportunidade' })
  async create(
    @StoreId() storeId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: CreateSalesOpportunityBodyDto,
  ) {
    const opportunity = await this.createOpportunity.execute({
      storeId,
      funnelId: body.funnelId,
      stageId: body.stageId,
      title: body.title,
      description: body.description,
      phone: body.phone,
      origin: body.origin,
      nextContact: body.nextContact ? new Date(body.nextContact) : undefined,
      patientId: body.patientId,
      labelId: body.labelId,
      submissionId: body.submissionId,
      actor,
    });
    return { data: toOpportunityResponse(opportunity) };
  }

  @Patch('reorder')
  @RequirePermission('manage', 'Sales')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reordenar oportunidades no kanban' })
  async reorder(
    @StoreId() storeId: string,
    @Body() body: ReorderSalesOpportunitiesBodyDto,
  ) {
    await this.reorderOpportunities.execute({
      storeId,
      items: body.items,
    });
  }

  @Patch(':id')
  @RequirePermission('manage', 'Sales')
  @ApiOperation({ summary: 'Atualizar oportunidade' })
  async update(
    @StoreId() storeId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateSalesOpportunityBodyDto,
  ) {
    const opportunity = await this.updateOpportunity.execute({
      storeId,
      id,
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.origin !== undefined ? { origin: body.origin } : {}),
      ...(body.nextContact !== undefined
        ? {
            nextContact:
              body.nextContact === null ? null : new Date(body.nextContact),
          }
        : {}),
      ...(body.patientId !== undefined ? { patientId: body.patientId } : {}),
      ...(body.labelId !== undefined ? { labelId: body.labelId } : {}),
      ...(body.stageId !== undefined ? { stageId: body.stageId } : {}),
      actor,
    });
    return { data: toOpportunityResponse(opportunity) };
  }

  @Patch(':id/move')
  @RequirePermission('manage', 'Sales')
  @ApiOperation({ summary: 'Mover oportunidade de etapa' })
  async move(
    @StoreId() storeId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: MoveSalesOpportunityBodyDto,
  ) {
    const opportunity = await this.moveOpportunity.execute({
      storeId,
      id,
      stageId: body.stageId,
      sortOrder: body.sortOrder,
      actor,
    });
    return { data: toOpportunityResponse(opportunity) };
  }

  @Delete(':id')
  @RequirePermission('manage', 'Sales')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir oportunidade' })
  async remove(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteOpportunity.execute({ storeId, id });
  }

  @Get(':id/history')
  @RequireAnyPermission(
    { action: 'access', subject: 'Sales' },
    { action: 'read', subject: 'Sales' },
    { action: 'manage', subject: 'Sales' },
  )
  @ApiOperation({ summary: 'Histórico da oportunidade' })
  async history(@StoreId() storeId: string, @Param('id') id: string) {
    const entries = await this.listHistory.execute({
      storeId,
      opportunityId: id,
    });
    return { data: entries.map(toHistoryResponse) };
  }

  @Post(':id/comments')
  @RequirePermission('manage', 'Sales')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar comentário' })
  async comment(
    @StoreId() storeId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: AddCommentBodyDto,
  ) {
    const entry = await this.addComment.execute({
      storeId,
      opportunityId: id,
      content: body.content,
      actor,
    });
    return { data: toHistoryResponse(entry) };
  }
}
