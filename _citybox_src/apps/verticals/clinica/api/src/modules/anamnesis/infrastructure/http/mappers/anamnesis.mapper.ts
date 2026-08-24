import type {
  AnamnesisQuestionRecord,
  TemplateAggregate,
} from '../../../application/dtos/anamnesis.dto';
import { parseAnamnesisQuestionOptions } from '../../../domain/anamnesis-question-options';

type TemplateQuestionRow = {
  questionId: string;
  active: boolean;
  sortOrder: number;
};

type QuestionRow = {
  id: string;
  storeId: string | null;
  templateId: string | null;
  text: string;
  type: AnamnesisQuestionRecord['type'];
  scope: AnamnesisQuestionRecord['scope'];
  auxiliaryText: string | null;
  options?: unknown;
  generatesAlert: boolean;
  alertWhen: AnamnesisQuestionRecord['alertWhen'] | null;
  alertName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TemplateRow = {
  id: string;
  storeId: string;
  name: string;
  status: TemplateAggregate['status'];
  createdAt: Date;
  updatedAt: Date;
  templateQuestions: TemplateQuestionRow[];
  customQuestions: QuestionRow[];
};

function optionsFields(raw: unknown) {
  const options = parseAnamnesisQuestionOptions(raw);
  return options ? { options } : {};
}

export function toQuestionRecord(row: QuestionRow): AnamnesisQuestionRecord {
  return {
    id: row.id,
    storeId: row.storeId,
    templateId: row.templateId,
    text: row.text,
    type: row.type,
    scope: row.scope,
    auxiliaryText: row.auxiliaryText ?? undefined,
    ...optionsFields(row.options),
    generatesAlert: row.generatesAlert,
    alertWhen: row.alertWhen ?? undefined,
    alertName: row.alertName ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toQuestionResponse(row: QuestionRow) {
  return {
    id: row.id,
    text: row.text,
    type: row.type,
    scope: row.scope,
    ...(row.auxiliaryText ? { auxiliaryText: row.auxiliaryText } : {}),
    ...optionsFields(row.options),
    ...(row.generatesAlert ? { generatesAlert: true } : {}),
    ...(row.alertWhen ? { alertWhen: row.alertWhen } : {}),
    ...(row.alertName ? { alertName: row.alertName } : {}),
  };
}

export function toTemplateAggregate(template: TemplateRow): TemplateAggregate {
  const customQuestions = template.customQuestions.map((question) => ({
    id: question.id,
    text: question.text,
    type: question.type,
    scope: 'clinic' as const,
    ...(question.auxiliaryText
      ? { auxiliaryText: question.auxiliaryText }
      : {}),
    ...optionsFields(question.options),
    ...(question.generatesAlert ? { generatesAlert: true } : {}),
    ...(question.alertWhen ? { alertWhen: question.alertWhen } : {}),
    ...(question.alertName ? { alertName: question.alertName } : {}),
  }));

  return {
    id: template.id,
    storeId: template.storeId,
    name: template.name,
    status: template.status,
    templateQuestions: template.templateQuestions
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        questionId: item.questionId,
        active: item.active,
      })),
    customQuestions,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

export function toTemplateResponse(aggregate: TemplateAggregate) {
  return {
    id: aggregate.id,
    name: aggregate.name,
    status: aggregate.status,
    templateQuestions: aggregate.templateQuestions,
    ...(aggregate.customQuestions.length > 0
      ? { customQuestions: aggregate.customQuestions }
      : {}),
  };
}

export function toQuestionLibraryResponse(record: AnamnesisQuestionRecord) {
  return {
    id: record.id,
    text: record.text,
    type: record.type,
    scope: record.scope,
    ...(record.auxiliaryText ? { auxiliaryText: record.auxiliaryText } : {}),
    ...(record.options && record.options.length > 0
      ? { options: record.options }
      : {}),
    ...(record.generatesAlert ? { generatesAlert: true } : {}),
    ...(record.alertWhen ? { alertWhen: record.alertWhen } : {}),
    ...(record.alertName ? { alertName: record.alertName } : {}),
  };
}
