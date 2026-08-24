import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

import { CreateCampaignUseCase } from '../../../application/use-cases/create-campaign/create-campaign.use-case';
import { GetCampaignSubmissionUseCase } from '../../../application/use-cases/get-campaign-submission/get-campaign-submission.use-case';
import { GetCampaignUseCase } from '../../../application/use-cases/get-campaign/get-campaign.use-case';
import { ListCampaignSubmissionsUseCase } from '../../../application/use-cases/list-campaign-submissions/list-campaign-submissions.use-case';
import { ListCampaignWhatsappMessagesUseCase } from '../../../application/use-cases/list-campaign-whatsapp-messages/list-campaign-whatsapp-messages.use-case';
import { ListCampaignsUseCase } from '../../../application/use-cases/list-campaigns/list-campaigns.use-case';
import { UpdateCampaignStatusUseCase } from '../../../application/use-cases/update-campaign-status/update-campaign-status.use-case';
import type {
  CampaignChannel,
  CampaignSegment,
  CampaignStatus,
  CampaignStatusType,
  CampaignStrategy,
  CampaignType,
} from '../../../domain/campaign.types';
import type { Campaign } from '../../../domain/entities/campaign.entity';
import type { CampaignSubmission } from '../../../domain/entities/campaign-submission.entity';

const SEGMENTS: CampaignSegment[] = [
  'captacao_leads',
  'operacional_atendimento',
  'relacionamento_pos_venda',
];

const TYPES: CampaignType[] = [
  'form_lead',
  'mgm',
  'debito_atraso',
  'retorno_tratamento',
  'aniversario',
  'nps',
];

const STRATEGIES: CampaignStrategy[] = ['PAGE', 'BROADCAST', 'AUTOMATION'];

const STATUS_TYPES: CampaignStatusType[] = [
  'always_active',
  'period',
  'limit',
];

const STATUSES: CampaignStatus[] = [
  'draft',
  'active',
  'inactive',
  'paused',
  'finished',
];

class ListCampaignsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: CampaignStatus;

  @IsOptional()
  @IsIn(SEGMENTS)
  segment?: CampaignSegment;
}

class CreateCampaignBodyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @IsIn(SEGMENTS)
  segment!: CampaignSegment;

  @IsIn(TYPES)
  type!: CampaignType;

  @IsOptional()
  @IsIn(STRATEGIES)
  strategy?: CampaignStrategy;

  @IsOptional()
  @IsIn(STATUS_TYPES)
  statusType?: CampaignStatusType;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadLimit?: number;

  @IsOptional()
  @IsUUID()
  funnelId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsObject()
  content!: Record<string, unknown>;
}

class ListCampaignMessagesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;

  @ApiPropertyOptional({
    description: 'Quando true, só mensagens que já receberam resposta do paciente',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1' || value === 1) {
      return true;
    }
    if (value === false || value === 'false' || value === '0' || value === 0) {
      return false;
    }
    return value;
  })
  @IsBoolean()
  withReplies?: boolean;

  @ApiPropertyOptional({ description: 'Busca por nome do paciente' })
  @IsOptional()
  @IsString()
  search?: string;
}

class UpdateCampaignStatusBodyDto {
  @IsIn(STATUSES)
  newStatus!: CampaignStatus;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

function toCampaignResponse(campaign: Campaign) {
  return {
    id: campaign.id,
    storeId: campaign.storeId,
    name: campaign.name,
    slug: campaign.slug,
    segment: campaign.segment,
    type: campaign.type,
    strategy: campaign.strategy,
    status: campaign.status,
    channel: campaign.channel as CampaignChannel,
    statusType: campaign.statusType,
    startDate: campaign.startDate?.toISOString() ?? null,
    endDate: campaign.endDate?.toISOString() ?? null,
    leadLimit: campaign.leadLimit,
    views: campaign.views,
    submissions: campaign.submissions,
    funnelId: campaign.funnelId,
    stageId: campaign.stageId,
    content: campaign.content,
    publicUrl: campaign.publicUrl,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

function toSubmissionResponse(submission: CampaignSubmission) {
  return {
    id: submission.id,
    campaignId: submission.campaignId,
    campaignType: submission.campaignType,
    submittedAt: submission.submittedAt.toISOString(),
    source: submission.source,
    payload: submission.payload,
    metadata: submission.metadata,
    isDuplicate: submission.isDuplicate,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
  };
}

@ApiTags('campaigns')
@Controller('v1/campaigns')
export class CampaignsRoute {
  constructor(
    private readonly createCampaign: CreateCampaignUseCase,
    private readonly listCampaigns: ListCampaignsUseCase,
    private readonly getCampaign: GetCampaignUseCase,
    private readonly getCampaignSubmission: GetCampaignSubmissionUseCase,
    private readonly updateCampaignStatus: UpdateCampaignStatusUseCase,
    private readonly listCampaignSubmissions: ListCampaignSubmissionsUseCase,
    private readonly listCampaignWhatsappMessages: ListCampaignWhatsappMessagesUseCase,
  ) {}

  @Get()
  @RequirePermission('read', 'Marketing')
  @ApiOperation({ summary: 'Listar campanhas da loja' })
  async list(
    @StoreId() storeId: string,
    @Query() query: ListCampaignsQueryDto,
  ) {
    const result = await this.listCampaigns.execute({
      storeId,
      page: query.page,
      perPage: query.perPage,
      search: query.search,
      status: query.status,
      segment: query.segment,
    });

    return {
      data: result.items.map(toCampaignResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('submissions/:submissionId')
  @RequirePermission('read', 'Marketing')
  @ApiOperation({ summary: 'Detalhe de uma resposta do formulário' })
  async findSubmission(
    @StoreId() storeId: string,
    @Param('submissionId') submissionId: string,
  ) {
    const result = await this.getCampaignSubmission.execute({
      storeId,
      submissionId,
    });
    return {
      data: {
        submission: toSubmissionResponse(result.submission),
        campaign: toCampaignResponse(result.campaign),
      },
    };
  }

  @Get(':id/submissions')
  @RequirePermission('read', 'Marketing')
  @ApiOperation({ summary: 'Listar respostas do formulário da campanha' })
  async listSubmissions(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Query() query: ListCampaignsQueryDto,
  ) {
    const result = await this.listCampaignSubmissions.execute({
      storeId,
      campaignId: id,
      page: query.page,
      perPage: query.perPage ?? 50,
    });
    return {
      data: result.items.map(toSubmissionResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id/messages')
  @RequirePermission('read', 'Marketing')
  @ApiOperation({
    summary: 'Listar mensagens WhatsApp disparadas pela campanha (broadcast)',
  })
  async listMessages(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Query() query: ListCampaignMessagesQueryDto,
  ) {
    const withRepliesOnly = query.withReplies === true;
    const result = await this.listCampaignWhatsappMessages.execute({
      storeId,
      campaignId: id,
      page: query.page,
      perPage: query.perPage ?? 50,
      withRepliesOnly,
      search: query.search,
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

  @Get(':id')
  @RequirePermission('read', 'Marketing')
  @ApiOperation({ summary: 'Detalhe da campanha' })
  async findOne(@StoreId() storeId: string, @Param('id') id: string) {
    const campaign = await this.getCampaign.execute({ storeId, id });
    return { data: toCampaignResponse(campaign) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('create', 'Marketing')
  @ApiOperation({
    summary: 'Criar campanha',
    description:
      'Nesta fase: type=form_lead (PAGE) ou type=aniversario (BROADCAST WhatsApp). Content form_lead aceita shape canônico ou wizard; aniversario usa planIds/specialtyIds/genders/messageBody.',
  })
  async create(
    @StoreId() storeId: string,
    @Body() body: CreateCampaignBodyDto,
  ) {
    const campaign = await this.createCampaign.execute({
      storeId,
      name: body.name,
      segment: body.segment,
      type: body.type,
      strategy: body.strategy,
      statusType: body.statusType,
      endDate: body.endDate,
      leadLimit: body.leadLimit,
      funnelId: body.funnelId,
      stageId: body.stageId,
      content: body.content,
    });
    return { data: toCampaignResponse(campaign) };
  }

  @Patch(':id/status')
  @RequirePermission('delete', 'Marketing')
  @ApiOperation({ summary: 'Atualizar status da campanha (finalizar)' })
  async updateStatus(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() body: UpdateCampaignStatusBodyDto,
  ) {
    const campaign = await this.updateCampaignStatus.execute({
      storeId,
      id,
      newStatus: body.newStatus,
      endDate: body.endDate,
    });
    return { data: toCampaignResponse(campaign) };
  }
}
