import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type CampaignSubmissionProps = {
  storeId: string;
  campaignId: string;
  campaignType: string;
  source: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  phoneKey?: string | null;
  isDuplicate: boolean;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class CampaignSubmission extends Entity<CampaignSubmissionProps> {
  constructor(props: CampaignSubmissionProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (!this.props.storeId?.trim()) {
      throw new Error('storeId is required');
    }
    if (!this.props.campaignId?.trim()) {
      throw new Error('campaignId is required');
    }
    if (!this.props.payload || typeof this.props.payload !== 'object') {
      throw new Error('payload is required');
    }
  }

  public static create(
    props: Optional<
      CampaignSubmissionProps,
      | 'createdAt'
      | 'updatedAt'
      | 'submittedAt'
      | 'source'
      | 'metadata'
      | 'isDuplicate'
    >,
    id?: string,
  ): CampaignSubmission {
    const now = new Date();
    return new CampaignSubmission(
      {
        ...props,
        source: props.source ?? 'web',
        metadata: props.metadata ?? {},
        isDuplicate: props.isDuplicate ?? false,
        submittedAt: props.submittedAt ?? now,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(
    props: CampaignSubmissionProps,
    id: string,
  ): CampaignSubmission {
    return new CampaignSubmission(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get campaignId() {
    return this.props.campaignId;
  }
  get campaignType() {
    return this.props.campaignType;
  }
  get source() {
    return this.props.source;
  }
  get payload() {
    return this.props.payload;
  }
  get metadata() {
    return this.props.metadata;
  }
  get phoneKey() {
    return this.props.phoneKey ?? null;
  }
  get isDuplicate() {
    return this.props.isDuplicate;
  }
  get submittedAt() {
    return this.props.submittedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  public withPayload(payload: Record<string, unknown>): CampaignSubmission {
    return CampaignSubmission.create(
      {
        ...this.props,
        payload,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
