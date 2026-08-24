import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { LeadDocumentNotFoundError } from '../../../domain/errors/lead-document-not-found.error';
import { LeadRepository } from '../../../domain/repositories/lead.repository.interface';
import { isLeadDocumentShareExpired } from '../../policies/document-share.policy';

export type AckPublicLeadDocumentResult = {
  viewedAt: Date;
};

@Injectable()
export class AckPublicLeadDocumentUseCase implements IUseCase<
  { token: string; now?: Date },
  AckPublicLeadDocumentResult
> {
  constructor(private readonly leads: LeadRepository) {}

  async execute(input: {
    token: string;
    now?: Date;
  }): Promise<AckPublicLeadDocumentResult> {
    const found = await this.leads.findDocumentByShareToken(input.token);
    if (!found) {
      throw new LeadDocumentNotFoundError(input.token);
    }
    const now = input.now ?? new Date();
    if (isLeadDocumentShareExpired(found.document.shareExpiresAt, now)) {
      throw new LeadDocumentNotFoundError(input.token);
    }
    const viewedAt = await this.leads.markDocumentViewedIfUnset(
      found.document.id,
      now,
    );
    if (!viewedAt) {
      throw new LeadDocumentNotFoundError(input.token);
    }
    return { viewedAt };
  }
}
