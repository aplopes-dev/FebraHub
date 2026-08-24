import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';

import { CreateSalesOpportunityUseCase } from '../../../../../sales/opportunities/application/use-cases/create-sales-opportunity/create-sales-opportunity.use-case';
import { SalesOpportunityHistory } from '../../../../../sales/opportunities/domain/entities/sales-opportunity-history.entity';
import { SalesOpportunityRepository } from '../../../../../sales/opportunities/domain/repositories/sales-opportunity.repository';
import type { FormLeadContent } from '../../../domain/content/form-lead.content';
import type { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignSubmission } from '../../../domain/entities/campaign-submission.entity';
import { CampaignNotAcceptingSubmissionsError } from '../../../domain/errors/campaign-not-accepting.error';
import { CampaignNotFoundError } from '../../../domain/errors/campaign-not-found.error';
import { CampaignRepository } from '../../../domain/repositories/campaign.repository';
import { CampaignSubmissionRepository } from '../../../domain/repositories/campaign-submission.repository';
import { extractPhoneFromPayload } from '../../../domain/utils/campaign-phone.utils';

export type SubmitPublicCampaignDto = {
  storeId: string;
  slug: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type SubmitPublicCampaignResult = {
  submission: CampaignSubmission;
  successAction: 'message' | 'redirect';
  successMessage?: string;
  redirectUrl?: string;
  opportunityId?: string;
};

@Injectable()
export class SubmitPublicCampaignUseCase implements IUseCase<
  SubmitPublicCampaignDto,
  SubmitPublicCampaignResult
> {
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly submissions: CampaignSubmissionRepository,
    private readonly createOpportunity: CreateSalesOpportunityUseCase,
    private readonly opportunities: SalesOpportunityRepository,
  ) {}

  async execute(
    dto: SubmitPublicCampaignDto,
  ): Promise<SubmitPublicCampaignResult> {
    let campaign = await this.campaigns.findBySlug(dto.storeId, dto.slug);
    if (!campaign || campaign.type !== 'form_lead') {
      throw new CampaignNotFoundError(
        SubmitPublicCampaignUseCase.name,
        dto.slug,
      );
    }

    const synced = campaign.syncDerivedStatus();
    if (synced.status !== campaign.status) {
      campaign = await this.campaigns.save(synced);
    }

    if (campaign.status !== 'active') {
      throw new CampaignNotAcceptingSubmissionsError(
        SubmitPublicCampaignUseCase.name,
        campaign.id,
      );
    }
    if (campaign.hasReachedLeadLimit()) {
      throw new CampaignNotAcceptingSubmissionsError(
        SubmitPublicCampaignUseCase.name,
        campaign.id,
      );
    }

    const content = campaign.content as FormLeadContent;
    this.assertRequiredQuestions(content, dto.payload);

    const phoneKey = extractPhoneFromPayload(dto.payload);
    const duplicityRule = content.duplicityRule ?? 'block';
    const title = this.resolveLeadTitle(dto.payload, campaign.name);
    const phone =
      typeof dto.payload['field-phone'] === 'string'
        ? dto.payload['field-phone']
        : (phoneKey ?? undefined);

    // --- update: nova submission duplicada + atualiza card do kanban existente ---
    if (phoneKey && duplicityRule === 'update') {
      const existing = await this.submissions.findLatestByPhone(
        dto.storeId,
        campaign.id,
        phoneKey,
      );
      if (existing) {
        const submission = await this.submissions.create(
          CampaignSubmission.create({
            storeId: dto.storeId,
            campaignId: campaign.id,
            campaignType: campaign.type,
            source: 'web',
            payload: { ...dto.payload },
            metadata: { ...(dto.metadata ?? {}) },
            phoneKey,
            isDuplicate: true,
          }),
        );

        await this.campaigns.save(campaign.afterSubmissionRecorded());

        const opportunityId = await this.syncOpportunityOnUpdate({
          campaign,
          submission: existing,
          title,
          phone,
        });

        return {
          submission,
          successAction: content.successAction,
          successMessage: content.successMessage,
          redirectUrl: content.redirectUrl,
          opportunityId,
        };
      }
    }

    // --- block / create_new / primeiro lead: sempre cria submission ---
    // block + duplicado → isDuplicate e NÃO cria card no CRM
    // create_new + duplicado → isDuplicate mas AINDA cria card no CRM
    let isDuplicate = false;
    if (
      phoneKey &&
      (duplicityRule === 'block' || duplicityRule === 'create_new')
    ) {
      const existing = await this.submissions.findLatestByPhone(
        dto.storeId,
        campaign.id,
        phoneKey,
      );
      isDuplicate = Boolean(existing);
    }

    const submission = await this.submissions.create(
      CampaignSubmission.create({
        storeId: dto.storeId,
        campaignId: campaign.id,
        campaignType: campaign.type,
        source: 'web',
        payload: { ...dto.payload },
        metadata: { ...(dto.metadata ?? {}) },
        phoneKey,
        isDuplicate,
      }),
    );

    await this.campaigns.save(campaign.afterSubmissionRecorded());

    const skipKanbanForDuplicate =
      duplicityRule === 'block' && isDuplicate;
    const opportunityId = skipKanbanForDuplicate
      ? undefined
      : await this.createKanbanCard({
          campaign,
          submissionId: submission.id,
          title,
          phone,
        });

    return {
      submission,
      successAction: content.successAction,
      successMessage: content.successMessage,
      redirectUrl: content.redirectUrl,
      opportunityId,
    };
  }

  /**
   * Atualiza o card ligado à submission; se não existir e a campanha tem funil,
   * cria um novo (ex.: lead antigo sem CRM).
   */
  private async syncOpportunityOnUpdate(input: {
    campaign: Campaign;
    submission: CampaignSubmission;
    title: string;
    phone?: string;
  }): Promise<string | undefined> {
    const existingOpp = await this.opportunities.findBySubmissionId(
      input.campaign.storeId,
      input.submission.id,
    );

    if (existingOpp && !existingOpp.isTerminal) {
      const history = SalesOpportunityHistory.create({
        storeId: input.campaign.storeId,
        opportunityId: existingOpp.id,
        actionType: 'updated',
        isSystemAction: true,
        systemName: `Campanha · ${input.campaign.name}`,
        metadata: {
          reason: 'duplicity_update',
          submissionId: input.submission.id,
        },
      });
      const saved = await this.opportunities.save(
        existingOpp.withUpdate({
          title: input.title,
          phone: input.phone ?? null,
        }),
        [history],
      );
      return saved.id;
    }

    if (existingOpp?.isTerminal) {
      // Card já ganho/perdido: cria novo card no funil da campanha
      return this.createKanbanCard({
        campaign: input.campaign,
        submissionId: input.submission.id,
        title: input.title,
        phone: input.phone,
      });
    }

    // Sem card ainda (campanha passou a ter funil depois, etc.)
    return this.createKanbanCard({
      campaign: input.campaign,
      submissionId: input.submission.id,
      title: input.title,
      phone: input.phone,
    });
  }

  private async createKanbanCard(input: {
    campaign: Campaign;
    submissionId: string;
    title: string;
    phone?: string;
  }): Promise<string | undefined> {
    if (!input.campaign.funnelId || !input.campaign.stageId) {
      return undefined;
    }

    const opportunity = await this.createOpportunity.execute({
      storeId: input.campaign.storeId,
      funnelId: input.campaign.funnelId,
      stageId: input.campaign.stageId,
      title: input.title,
      phone: input.phone,
      origin: 'campaign',
      submissionId: input.submissionId,
      asSystem: true,
      systemName: `Campanha · ${input.campaign.name}`,
    });
    return opportunity.id;
  }

  private resolveLeadTitle(
    payload: Record<string, unknown>,
    campaignName: string,
  ): string {
    const name = payload['field-name'];
    if (typeof name === 'string' && name.trim()) {
      return name.trim();
    }
    return `Lead · ${campaignName}`;
  }

  private assertRequiredQuestions(
    content: FormLeadContent,
    payload: Record<string, unknown>,
  ): void {
    for (const question of content.questions ?? []) {
      if (!question.required) continue;
      const value = payload[question.id];
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        throw new ValidatorDomainError({
          internalMessage: `Missing required field ${question.id}`,
          externalMessage: `Campo obrigatório: ${question.label}`,
          context: SubmitPublicCampaignUseCase.name,
        });
      }
    }
  }
}
