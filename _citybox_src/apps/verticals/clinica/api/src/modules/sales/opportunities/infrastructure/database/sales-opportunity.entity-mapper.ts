import { Prisma } from '../../../../../../generated/prisma/client';

import { SalesOpportunity } from '../../domain/entities/sales-opportunity.entity';
import { SalesOpportunityHistory } from '../../domain/entities/sales-opportunity-history.entity';
import type {
  SalesOpportunityHistoryAction,
  SalesOpportunityOrigin,
} from '../../domain/sales-opportunity.types';

type OpportunityRow = {
  id: string;
  storeId: string;
  funnelId: string;
  stageId: string;
  title: string;
  description: string | null;
  phone: string | null;
  origin: SalesOpportunityOrigin | null;
  nextContact: Date | null;
  patientId: string | null;
  labelId: string | null;
  submissionId: string | null;
  budgetId: string | null;
  sortOrder: number;
  lastInteractionAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  stage?: { type: 'others' | 'won' | 'lost' };
  patient?: {
    name: string;
    phone: string;
    email: string;
  } | null;
};

type HistoryRow = {
  id: string;
  storeId: string;
  opportunityId: string;
  actionType: SalesOpportunityHistoryAction;
  userId: string | null;
  userName: string | null;
  userAvatar: string | null;
  content: string | null;
  metadata: Prisma.JsonValue | null;
  isSystemAction: boolean;
  systemName: string | null;
  createdAt: Date;
};

export class SalesOpportunityEntityMapper {
  static toDomain(row: OpportunityRow): SalesOpportunity {
    return SalesOpportunity.with(
      {
        storeId: row.storeId,
        funnelId: row.funnelId,
        stageId: row.stageId,
        title: row.title,
        description: row.description,
        phone: row.phone,
        origin: row.origin,
        nextContact: row.nextContact,
        patientId: row.patientId,
        labelId: row.labelId,
        submissionId: row.submissionId,
        budgetId: row.budgetId,
        sortOrder: row.sortOrder,
        lastInteractionAt: row.lastInteractionAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        stageType: row.stage?.type,
        patient: row.patient
          ? {
              name: row.patient.name,
              phone: row.patient.phone || undefined,
              email: row.patient.email || undefined,
            }
          : null,
      },
      row.id,
    );
  }

  static toHistoryDomain(row: HistoryRow): SalesOpportunityHistory {
    const metadata =
      row.metadata &&
      typeof row.metadata === 'object' &&
      !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null;

    return SalesOpportunityHistory.with(
      {
        storeId: row.storeId,
        opportunityId: row.opportunityId,
        actionType: row.actionType,
        userId: row.userId,
        userName: row.userName,
        userAvatar: row.userAvatar,
        content: row.content,
        metadata,
        isSystemAction: row.isSystemAction,
        systemName: row.systemName,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }

  static toHistoryPersistence(entry: SalesOpportunityHistory) {
    return {
      id: entry.id,
      storeId: entry.storeId,
      opportunityId: entry.opportunityId,
      actionType: entry.actionType,
      userId: entry.userId,
      userName: entry.userName,
      userAvatar: entry.userAvatar,
      content: entry.content,
      metadata:
        entry.metadata === null
          ? Prisma.DbNull
          : (entry.metadata as Prisma.InputJsonValue),
      isSystemAction: entry.isSystemAction,
      systemName: entry.systemName,
      createdAt: entry.createdAt,
    };
  }
}
