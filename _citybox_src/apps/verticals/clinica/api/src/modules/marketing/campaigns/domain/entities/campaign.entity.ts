import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

import type {
  CampaignChannel,
  CampaignSegment,
  CampaignStatus,
  CampaignStatusType,
  CampaignStrategy,
  CampaignType,
} from '../campaign.types';
import type { FormLeadContent } from '../content/form-lead.content';
import { isCampaignPeriodExpired } from '../utils/campaign-period.utils';
import { CampaignZodValidator } from '../validators/campaign.zod.validator';

export type CampaignProps = {
  storeId: string;
  name: string;
  slug: string;
  segment: CampaignSegment;
  type: CampaignType;
  strategy: CampaignStrategy;
  status: CampaignStatus;
  channel: CampaignChannel;
  statusType: CampaignStatusType;
  startDate?: Date | null;
  endDate?: Date | null;
  leadLimit?: number | null;
  views: number;
  submissions: number;
  funnelId?: string | null;
  stageId?: string | null;
  content: FormLeadContent | Record<string, unknown>;
  publicUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Campaign extends Entity<CampaignProps> {
  constructor(props: CampaignProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    CampaignZodValidator.create().validate(this);
  }

  public static create(
    props: Optional<
      CampaignProps,
      'createdAt' | 'updatedAt' | 'views' | 'submissions' | 'status'
    >,
    id?: string,
  ): Campaign {
    return new Campaign(
      {
        ...props,
        status: props.status ?? 'active',
        views: props.views ?? 0,
        submissions: props.submissions ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: CampaignProps, id: string): Campaign {
    return new Campaign(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get name() {
    return this.props.name;
  }
  get slug() {
    return this.props.slug;
  }
  get segment() {
    return this.props.segment;
  }
  get type() {
    return this.props.type;
  }
  get strategy() {
    return this.props.strategy;
  }
  get status() {
    return this.props.status;
  }
  get channel() {
    return this.props.channel;
  }
  get statusType() {
    return this.props.statusType;
  }
  get startDate() {
    return this.props.startDate ?? null;
  }
  get endDate() {
    return this.props.endDate ?? null;
  }
  get leadLimit() {
    return this.props.leadLimit ?? null;
  }
  get views() {
    return this.props.views;
  }
  get submissions() {
    return this.props.submissions;
  }
  get funnelId() {
    return this.props.funnelId ?? null;
  }
  get stageId() {
    return this.props.stageId ?? null;
  }
  get content() {
    return this.props.content;
  }
  get publicUrl() {
    return this.props.publicUrl ?? null;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  public withStatus(input: {
    status: CampaignStatus;
    endDate?: Date | null;
  }): Campaign {
    return Campaign.create(
      {
        ...this.props,
        status: input.status,
        endDate:
          input.endDate !== undefined ? input.endDate : this.props.endDate,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  public withCounters(input: {
    views?: number;
    submissions?: number;
  }): Campaign {
    return Campaign.create(
      {
        ...this.props,
        views: input.views ?? this.props.views,
        submissions: input.submissions ?? this.props.submissions,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /** Repara status quando o limite foi atingido mas a campanha não está finalizada. */
  public syncLeadLimitStatus(): Campaign {
    if (
      this.statusType === 'limit' &&
      this.hasReachedLeadLimit() &&
      this.status !== 'finished'
    ) {
      return this.withStatus({
        status: 'finished',
        endDate: this.endDate ?? new Date(),
      });
    }
    return this;
  }

  /**
   * Repara status quando o período expirou (a partir de 00:00 BRT do dia da data fim).
   */
  public syncPeriodStatus(now: Date = new Date()): Campaign {
    if (
      this.statusType === 'period' &&
      this.endDate &&
      this.status !== 'finished' &&
      isCampaignPeriodExpired(this.endDate, now)
    ) {
      return this.withStatus({
        status: 'finished',
        endDate: this.endDate,
      });
    }
    return this;
  }

  /** Aplica sincronizações derivadas (limite de leads + período). */
  public syncDerivedStatus(now: Date = new Date()): Campaign {
    return this.syncLeadLimitStatus().syncPeriodStatus(now);
  }

  public hasReachedLeadLimit(): boolean {
    return (
      this.statusType === 'limit' &&
      this.leadLimit != null &&
      this.submissions >= this.leadLimit
    );
  }

  public hasPeriodExpired(now: Date = new Date()): boolean {
    return (
      this.statusType === 'period' &&
      this.endDate != null &&
      isCampaignPeriodExpired(this.endDate, now)
    );
  }

  /** Incrementa submissions e finaliza quando o limite de leads é atingido. */
  public afterSubmissionRecorded(): Campaign {
    const submissions = this.submissions + 1;
    const limitReached =
      this.statusType === 'limit' &&
      this.leadLimit != null &&
      submissions >= this.leadLimit;

    return Campaign.create(
      {
        ...this.props,
        submissions,
        status: limitReached ? 'finished' : this.props.status,
        endDate: limitReached ? new Date() : this.props.endDate,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
