import { globalQuestionUuid } from '../../../../prisma/global-anamnesis-questions';
import type { AnamnesisQuestionRecord } from '../application/dtos/anamnesis.dto';

export const STORE_ID = '11111111-1111-4111-8111-111111111111';

export const GLOBAL_QUESTION_1: AnamnesisQuestionRecord = {
  id: globalQuestionUuid(1),
  storeId: null,
  templateId: null,
  text: 'Possui alergia a medicamentos?',
  type: 'yes_no_unknown_text',
  scope: 'global',
  auxiliaryText: 'Qual medicamento ou substância?',
  generatesAlert: true,
  alertWhen: 'yes',
  alertName: 'Alergia medicamentosa',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

export const GLOBAL_QUESTION_4: AnamnesisQuestionRecord = {
  id: globalQuestionUuid(4),
  storeId: null,
  templateId: null,
  text: 'Queixa principal',
  type: 'text',
  scope: 'global',
  generatesAlert: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
