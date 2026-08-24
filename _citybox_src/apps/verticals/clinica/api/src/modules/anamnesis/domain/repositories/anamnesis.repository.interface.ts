import type {
  AnamnesisQuestionRecord,
  AnamnesisTemplateStatus,
  TemplateAggregate,
} from '../../application/dtos/anamnesis.dto';

export abstract class AnamnesisTemplateRepository {
  abstract findAllAggregates(storeId: string): Promise<TemplateAggregate[]>;
  abstract findAggregateById(
    storeId: string,
    id: string,
  ): Promise<TemplateAggregate | null>;
  abstract findByName(
    storeId: string,
    name: string,
  ): Promise<TemplateAggregate | null>;
  abstract saveAggregate(
    aggregate: TemplateAggregate,
  ): Promise<TemplateAggregate>;
  abstract updateStatus(
    storeId: string,
    id: string,
    status: AnamnesisTemplateStatus,
  ): Promise<TemplateAggregate>;
  abstract delete(storeId: string, id: string): Promise<void>;
  abstract countPatientAnamneses(
    storeId: string,
    templateId: string,
  ): Promise<number>;
}

export type LibraryQuestionUpsert = {
  id: string;
  text: string;
  type: AnamnesisQuestionRecord['type'];
  auxiliaryText?: string;
  options?: AnamnesisQuestionRecord['options'];
  generatesAlert?: boolean;
  alertWhen?: AnamnesisQuestionRecord['alertWhen'];
  alertName?: string;
};

export abstract class AnamnesisQuestionRepository {
  abstract findAccessibleByIds(
    storeId: string,
    ids: string[],
  ): Promise<AnamnesisQuestionRecord[]>;
  abstract findLibrary(
    storeId: string,
    search?: string,
  ): Promise<AnamnesisQuestionRecord[]>;
  abstract upsertLibraryQuestions(
    storeId: string,
    questions: LibraryQuestionUpsert[],
  ): Promise<void>;
}
