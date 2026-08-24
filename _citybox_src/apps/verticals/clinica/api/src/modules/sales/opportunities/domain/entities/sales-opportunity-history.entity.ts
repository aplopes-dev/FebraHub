import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

import type {
  SalesOpportunityHistoryAction,
  SalesOpportunityHistoryProps,
} from '../sales-opportunity.types';

export class SalesOpportunityHistory extends Entity<SalesOpportunityHistoryProps> {
  constructor(props: SalesOpportunityHistoryProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // history entries are append-only snapshots; light validation in use cases
  }

  public static create(
    props: Optional<
      SalesOpportunityHistoryProps,
      | 'userId'
      | 'userName'
      | 'userAvatar'
      | 'content'
      | 'metadata'
      | 'systemName'
      | 'createdAt'
    >,
    id?: string,
  ): SalesOpportunityHistory {
    return new SalesOpportunityHistory(
      {
        storeId: props.storeId,
        opportunityId: props.opportunityId,
        actionType: props.actionType,
        userId: props.userId ?? null,
        userName: props.userName ?? null,
        userAvatar: props.userAvatar ?? null,
        content: props.content ?? null,
        metadata: props.metadata ?? null,
        isSystemAction: props.isSystemAction,
        systemName: props.systemName ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  public static with(
    props: SalesOpportunityHistoryProps,
    id: string,
  ): SalesOpportunityHistory {
    return new SalesOpportunityHistory(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get opportunityId() {
    return this.props.opportunityId;
  }
  get actionType(): SalesOpportunityHistoryAction {
    return this.props.actionType;
  }
  get userId() {
    return this.props.userId;
  }
  get userName() {
    return this.props.userName;
  }
  get userAvatar() {
    return this.props.userAvatar;
  }
  get content() {
    return this.props.content;
  }
  get metadata() {
    return this.props.metadata;
  }
  get isSystemAction() {
    return this.props.isSystemAction;
  }
  get systemName() {
    return this.props.systemName;
  }
  get createdAt() {
    return this.props.createdAt;
  }
}
