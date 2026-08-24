import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { LeadRepository } from '../../../../leads/domain/repositories/lead.repository.interface';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import { TransactionNotFoundError } from '../../../domain/errors/transaction-not-found.error';
import { TransactionRepository } from '../../../domain/repositories/transaction.repository.interface';
import {
  buildTransactionDocumentChecklist,
  dedupePackDocuments,
  type TransactionDocumentChecklistItem,
  type TransactionPackDocument,
} from '../../policies/transaction-document-checklist.policy';

export type ListTransactionDocumentsInput = {
  storeId: string;
  id: string;
};

export type ListTransactionDocumentsResult = {
  items: TransactionPackDocument[];
  checklist: TransactionDocumentChecklistItem[];
};

@Injectable()
export class ListTransactionDocumentsUseCase implements IUseCase<
  ListTransactionDocumentsInput,
  ListTransactionDocumentsResult
> {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly leads: LeadRepository,
    private readonly properties: PropertyRepository,
  ) {}

  async execute(
    input: ListTransactionDocumentsInput,
  ): Promise<ListTransactionDocumentsResult> {
    const transaction = await this.transactions.findById(input.storeId, input.id);
    if (!transaction) throw new TransactionNotFoundError(input.id);

    const collected: TransactionPackDocument[] = [];
    let propertyDocumentCount = 0;

    if (transaction.leadId) {
      const lead = await this.leads.findById(input.storeId, transaction.leadId);
      for (const document of lead?.documents ?? []) {
        collected.push({
          id: document.id,
          name: document.name,
          sizeLabel: document.sizeLabel,
          kind: document.kind,
          source: 'lead',
          sentAt: document.sentAt,
          sentChannel: document.sentChannel,
          objectKey: document.objectKey,
          path: document.objectKey
            ? `/v1/leads/${transaction.leadId}/documents/${document.id}`
            : undefined,
        });
      }
    }

    if (transaction.propertyId) {
      const property = await this.properties.findById(
        input.storeId,
        transaction.propertyId,
      );
      const propertyDocs = property?.documents ?? [];
      propertyDocumentCount = propertyDocs.length;
      for (const document of propertyDocs) {
        collected.push({
          id: document.id,
          name: document.name,
          sizeLabel: document.sizeLabel,
          kind: 'other',
          source: 'property',
          sentAt: null,
          sentChannel: null,
          objectKey: document.objectKey,
          path: document.objectKey
            ? `/v1/properties/${transaction.propertyId}/documents/${document.id}`
            : undefined,
        });
      }
    }

    const propertyObjectKeys = new Set(
      collected
        .filter((item) => item.source === 'property' && item.objectKey)
        .map((item) => item.objectKey as string),
    );
    const items = dedupePackDocuments(collected);
    return {
      items,
      checklist: buildTransactionDocumentChecklist(
        transaction.type,
        items,
        propertyDocumentCount,
        propertyObjectKeys,
      ),
    };
  }
}
