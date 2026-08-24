import type {
  AnamnesisAlertTrigger,
  AnamnesisQuestionScope,
  AnamnesisQuestionType,
} from '../generated/prisma/client';

export type GlobalAnamnesisQuestionSeed = {
  mockId: string;
  id: string;
  text: string;
  type: AnamnesisQuestionType;
  scope: AnamnesisQuestionScope;
  auxiliaryText?: string;
  generatesAlert?: boolean;
  alertWhen?: AnamnesisAlertTrigger;
  alertName?: string;
};

/** UUID estável por índice (q-001 → …000001). */
export function globalQuestionUuid(index: number): string {
  return `018f0001-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

const QUESTION_COUNT = 15;

/** Mapa legado mockId → UUID (compatibilidade com ambientes já semeados). */
export const MOCK_QUESTION_ID_TO_UUID: Record<string, string> =
  Object.fromEntries(
    Array.from({ length: QUESTION_COUNT }, (_, i) => [
      `q-${String(i + 1).padStart(3, '0')}`,
      globalQuestionUuid(i + 1),
    ]),
  );

/**
 * Biblioteca global semeada (~15 perguntas gerais comuns).
 * Seed idempotente via createMany skipDuplicates.
 */
export const GLOBAL_ANAMNESIS_QUESTIONS: GlobalAnamnesisQuestionSeed[] = [
  {
    mockId: 'q-001',
    id: globalQuestionUuid(1),
    text: 'Possui alergia a medicamentos?',
    type: 'yes_no_unknown_text',
    scope: 'global',
    auxiliaryText: 'Qual medicamento ou substância?',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Alergia medicamentosa',
  },
  {
    mockId: 'q-002',
    id: globalQuestionUuid(2),
    text: 'Faz uso contínuo de medicação?',
    type: 'yes_no_unknown_text',
    scope: 'global',
    auxiliaryText: 'Quais medicamentos e dosagens?',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Medicação de uso contínuo',
  },
  {
    mockId: 'q-003',
    id: globalQuestionUuid(3),
    text: 'Está gestante?',
    type: 'yes_no_unknown',
    scope: 'global',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Paciente gestante',
  },
  {
    mockId: 'q-004',
    id: globalQuestionUuid(4),
    text: 'Possui diabetes mellitus?',
    type: 'yes_no_unknown',
    scope: 'global',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Diabetes mellitus',
  },
  {
    mockId: 'q-005',
    id: globalQuestionUuid(5),
    text: 'Possui hipertensão arterial?',
    type: 'yes_no_unknown',
    scope: 'global',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Hipertensão arterial',
  },
  {
    mockId: 'q-006',
    id: globalQuestionUuid(6),
    text: 'Fuma atualmente?',
    type: 'yes_no_unknown',
    scope: 'global',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Tabagismo ativo',
  },
  {
    mockId: 'q-007',
    id: globalQuestionUuid(7),
    text: 'Consome bebidas alcoólicas?',
    type: 'yes_no_unknown_text',
    scope: 'global',
    auxiliaryText: 'Com que frequência?',
  },
  {
    mockId: 'q-008',
    id: globalQuestionUuid(8),
    text: 'Possui restrição alimentar?',
    type: 'yes_no_unknown_text',
    scope: 'global',
    auxiliaryText: 'Qual restrição alimentar?',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Restrição alimentar',
  },
  {
    mockId: 'q-009',
    id: globalQuestionUuid(9),
    text: 'Histórico familiar de doenças cardíacas',
    type: 'yes_no_unknown',
    scope: 'global',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Histórico cardíaco familiar',
  },
  {
    mockId: 'q-010',
    id: globalQuestionUuid(10),
    text: 'Usa anticoagulante?',
    type: 'yes_no_unknown_text',
    scope: 'global',
    auxiliaryText: 'Qual anticoagulante e há quanto tempo?',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Uso de anticoagulante',
  },
  {
    mockId: 'q-011',
    id: globalQuestionUuid(11),
    text: 'Possui epilepsia ou convulsões?',
    type: 'yes_no_unknown',
    scope: 'global',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Epilepsia ou convulsões',
  },
  {
    mockId: 'q-012',
    id: globalQuestionUuid(12),
    text: 'Já teve reação adversa a anestesia local?',
    type: 'yes_no_unknown_text',
    scope: 'global',
    auxiliaryText: 'Descreva a reação observada',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Reação a anestesia local',
  },
  {
    mockId: 'q-013',
    id: globalQuestionUuid(13),
    text: 'Possui marcapasso, stent ou implante metálico?',
    type: 'yes_no_unknown_text',
    scope: 'global',
    auxiliaryText: 'Qual dispositivo e desde quando?',
    generatesAlert: true,
    alertWhen: 'yes',
    alertName: 'Dispositivo implantado',
  },
  {
    mockId: 'q-014',
    id: globalQuestionUuid(14),
    text: 'Queixa principal',
    type: 'text',
    scope: 'global',
  },
  {
    mockId: 'q-015',
    id: globalQuestionUuid(15),
    text: 'Observações adicionais do paciente',
    type: 'text',
    scope: 'global',
  },
];
