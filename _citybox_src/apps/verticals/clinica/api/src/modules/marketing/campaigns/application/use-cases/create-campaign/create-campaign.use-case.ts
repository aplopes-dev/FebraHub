import { Injectable, Optional } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';

import { SalesFunnelRepository } from '../../../../../sales/funnels/domain/repositories/sales-funnel.repository';
import {
  assertTypeImplemented,
  assertValidSegmentTypePair,
  defaultChannelForType,
  resolveStrategy,
} from '../../../domain/campaign-type-catalog';
import type {
  CampaignSegment,
  CampaignStatusType,
  CampaignStrategy,
  CampaignType,
} from '../../../domain/campaign.types';
import { parseAniversarioContent } from '../../../domain/content/aniversario.content';
import { parseFormLeadContent } from '../../../domain/content/form-lead.content';
import { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignInvalidFunnelError } from '../../../domain/errors/campaign-invalid-funnel.error';
import { CampaignSlugTakenError } from '../../../domain/errors/campaign-slug-taken.error';
import { CampaignRepository } from '../../../domain/repositories/campaign.repository';
import {
  buildCampaignPublicUrl,
  slugifyCampaignName,
} from '../../../domain/utils/campaign-slug.utils';
import { isCampaignPeriodExpired } from '../../../domain/utils/campaign-period.utils';
import { DispatchDueBirthdayCampaignsUseCase } from '../../../../../whatsapp/application/use-cases/dispatch-due-birthday-campaigns/dispatch-due-birthday-campaigns.use-case';

export type CreateCampaignDto = {
  storeId: string;
  name: string;
  segment: CampaignSegment;
  type: CampaignType;
  strategy?: CampaignStrategy;
  statusType?: CampaignStatusType;
  endDate?: string;
  leadLimit?: number;
  funnelId?: string;
  stageId?: string;
  content: unknown;
};

@Injectable()
export class CreateCampaignUseCase implements IUseCase<
  CreateCampaignDto,
  Campaign
> {
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly funnels: SalesFunnelRepository,
    @Optional()
    private readonly dispatchBirthdayCampaigns?: DispatchDueBirthdayCampaignsUseCase,
  ) {}

  async execute(dto: CreateCampaignDto): Promise<Campaign> {
    assertValidSegmentTypePair(dto.segment, dto.type, CreateCampaignUseCase.name);
    assertTypeImplemented(dto.type, CreateCampaignUseCase.name);

    const strategy = resolveStrategy(dto.type);
    if (dto.strategy && dto.strategy !== strategy) {
      throw new ValidatorDomainError({
        internalMessage: `Strategy mismatch: expected ${strategy}, got ${dto.strategy}`,
        externalMessage: 'Estratégia incompatível com o tipo de campanha',
        context: CreateCampaignUseCase.name,
      });
    }

    const statusType = dto.statusType ?? 'always_active';
    this.assertSchedule(statusType, dto.endDate, dto.leadLimit);

    const funnelId = dto.funnelId?.trim() || undefined;
    const stageId = dto.stageId?.trim() || undefined;
    if (funnelId || stageId) {
      await this.assertFunnelStage(dto.storeId, funnelId, stageId);
    }

    const content =
      dto.type === 'form_lead'
        ? parseFormLeadContent(dto.content, CreateCampaignUseCase.name)
        : dto.type === 'aniversario'
          ? parseAniversarioContent(dto.content, CreateCampaignUseCase.name)
          : (dto.content as Record<string, unknown>);

    const baseSlug = slugifyCampaignName(dto.name) || 'campanha';
    const slug = await this.allocateSlug(dto.storeId, baseSlug);

    const endDate = dto.endDate ? new Date(dto.endDate) : null;
    // Data fim = dia civil; a partir de 00:00 BRT desse dia a campanha já está expirada.
    // Na criação exige dia estritamente futuro (não aceita "hoje").
    if (
      statusType === 'period' &&
      endDate &&
      isCampaignPeriodExpired(endDate, new Date())
    ) {
      throw new ValidatorDomainError({
        internalMessage: 'endDate must be a future calendar day',
        externalMessage: 'A data final deve ser uma data futura',
        context: CreateCampaignUseCase.name,
      });
    }

    const campaign = Campaign.create({
      storeId: dto.storeId,
      name: dto.name.trim(),
      slug,
      segment: dto.segment,
      type: dto.type,
      strategy,
      channel: defaultChannelForType(dto.type),
      statusType,
      startDate: new Date(),
      endDate,
      leadLimit: statusType === 'limit' ? dto.leadLimit : null,
      funnelId: funnelId ?? null,
      stageId: stageId ?? null,
      content,
      publicUrl: buildCampaignPublicUrl(dto.storeId, slug),
    });

    const created = await this.campaigns.create(campaign);

    if (
      created.type === 'aniversario' &&
      created.status === 'active' &&
      this.dispatchBirthdayCampaigns
    ) {
      await this.dispatchBirthdayCampaigns.execute({
        storeId: created.storeId,
        campaignId: created.id,
        softFail: true,
      });
    }

    return created;
  }

  private assertSchedule(
    statusType: CampaignStatusType,
    endDate?: string,
    leadLimit?: number,
  ): void {
    if (statusType === 'period' && !endDate) {
      throw new ValidatorDomainError({
        internalMessage: 'endDate required for period',
        externalMessage: 'Data final é obrigatória para campanha por período',
        context: CreateCampaignUseCase.name,
      });
    }
    if (
      statusType === 'limit' &&
      (leadLimit === undefined || leadLimit === null || leadLimit <= 0)
    ) {
      throw new ValidatorDomainError({
        internalMessage: 'leadLimit required for limit',
        externalMessage: 'Limite de leads deve ser maior que zero',
        context: CreateCampaignUseCase.name,
      });
    }
  }

  private async assertFunnelStage(
    storeId: string,
    funnelId?: string,
    stageId?: string,
  ): Promise<void> {
    if (!funnelId) {
      throw new CampaignInvalidFunnelError(
        CreateCampaignUseCase.name,
        'stage without funnel',
      );
    }
    const funnel = await this.funnels.findById(storeId, funnelId);
    if (!funnel) {
      throw new CampaignInvalidFunnelError(
        CreateCampaignUseCase.name,
        `funnel ${funnelId}`,
      );
    }
    if (stageId) {
      const stage = funnel.stages.find((s) => s.id === stageId);
      if (!stage) {
        throw new CampaignInvalidFunnelError(
          CreateCampaignUseCase.name,
          `stage ${stageId} not in funnel ${funnelId}`,
        );
      }
    }
  }

  private async allocateSlug(storeId: string, base: string): Promise<string> {
    let candidate = base;
    for (let i = 0; i < 20; i += 1) {
      const existing = await this.campaigns.findBySlug(storeId, candidate);
      if (!existing) return candidate;
      candidate = `${base}-${i + 2}`;
    }
    throw new CampaignSlugTakenError(CreateCampaignUseCase.name, base);
  }
}
