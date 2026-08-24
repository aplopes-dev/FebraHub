import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';

import { GetPublicCampaignUseCase } from '../../../application/use-cases/get-public-campaign/get-public-campaign.use-case';
import { SubmitPublicCampaignUseCase } from '../../../application/use-cases/submit-public-campaign/submit-public-campaign.use-case';
import { TrackPublicCampaignViewUseCase } from '../../../application/use-cases/track-public-campaign-view/track-public-campaign-view.use-case';
import type { FormLeadContent } from '../../../domain/content/form-lead.content';

class SubmitPublicCampaignBodyDto {
  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

function toPublicCampaignResponse(
  storeId: string,
  campaign: {
    id: string;
    name: string;
    status: string;
  },
  content: FormLeadContent,
) {
  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    clinicName: 'Clínica',
    storeId,
    status: campaign.status,
    formDescription: content.formDescription,
    introText: content.introText,
    questions: content.questions,
    lgpdConsent: content.lgpdConsent,
    primaryColor: content.primaryColor,
    logoUrl: content.logoUrl,
    successAction: content.successAction,
    successMessage: content.successMessage,
    redirectUrl: content.redirectUrl,
  };
}

@ApiTags('public-campaigns')
@Controller('v1/public/campaigns')
export class PublicCampaignsRoute {
  constructor(
    private readonly getPublicCampaign: GetPublicCampaignUseCase,
    private readonly trackPublicCampaignView: TrackPublicCampaignViewUseCase,
    private readonly submitPublicCampaign: SubmitPublicCampaignUseCase,
  ) {}

  @Get(':storeId/:slug')
  @Public()
  @ApiOperation({ summary: 'Obter campanha pública (form_lead)' })
  async get(
    @Param('storeId') storeId: string,
    @Param('slug') slug: string,
  ) {
    const result = await this.getPublicCampaign.execute({ storeId, slug });
    return {
      data: toPublicCampaignResponse(
        storeId,
        result.campaign,
        result.content,
      ),
    };
  }

  @Post(':storeId/:slug/views')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Registrar visualização da campanha (dedupe via cookie 30min no client)',
  })
  async trackView(
    @Param('storeId') storeId: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    await this.trackPublicCampaignView.execute({ storeId, slug });
  }

  @Post(':storeId/:slug/submissions')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar resposta do formulário público' })
  async submit(
    @Param('storeId') storeId: string,
    @Param('slug') slug: string,
    @Body() body: SubmitPublicCampaignBodyDto,
  ) {
    const result = await this.submitPublicCampaign.execute({
      storeId,
      slug,
      payload: body.payload,
      metadata: body.metadata,
    });
    return {
      data: {
        id: result.submission.id,
        campaignId: result.submission.campaignId,
        submittedAt: result.submission.submittedAt.toISOString(),
        successAction: result.successAction,
        successMessage: result.successMessage,
        redirectUrl: result.redirectUrl,
        opportunityId: result.opportunityId,
      },
    };
  }
}
