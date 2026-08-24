
import { seedClinicAnamnesis } from './seed-clinic-anamnesis';
import {
  NUTRICAO_FOLLOWUP_ANAMNESIS_TEMPLATE_NAME,
  NUTRICAO_FOLLOWUP_ANAMNESIS_QUESTIONS,
} from './seed-data/packs/nutricao/anamnesis';
import { NUTRICAO_CLINIC_SEED_PACK } from './seed-data/packs/nutricao';

type QuestionRow = {
  id: string;
  storeId: string;
  text: string;
  type: string;
  templateId: string | null;
  options: unknown;
};

function createFakePrisma() {
  const questions: QuestionRow[] = [];
  const templates: Array<{ id: string; storeId: string; name: string }> = [];
  const pivots: Array<{
    templateId: string;
    questionId: string;
    sortOrder: number;
  }> = [];
  let seq = 1;

  return {
    questions,
    templates,
    pivots,
    anamnesisQuestion: {
      findFirst: async ({
        where,
      }: {
        where: { storeId: string; text: string; type: string };
      }) =>
        questions.find(
          (row) =>
            row.storeId === where.storeId &&
            row.text === where.text &&
            row.type === where.type,
        ) ?? null,
      create: async ({ data }: { data: Omit<QuestionRow, 'id'> & { id?: string } }) => {
        const row = { ...data, id: data.id ?? `q-${seq++}` };
        questions.push(row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { options: unknown };
      }) => {
        const row = questions.find((item) => item.id === where.id);
        if (row) {
          row.options = data.options;
        }
        return row;
      },
    },
    anamnesisTemplate: {
      findFirst: async ({
        where,
      }: {
        where: { storeId: string; name: string };
      }) =>
        templates.find(
          (row) => row.storeId === where.storeId && row.name === where.name,
        ) ?? null,
      create: async ({
        data,
      }: {
        data: { storeId: string; name: string; status: string };
      }) => {
        const row = { id: `t-${seq++}`, storeId: data.storeId, name: data.name };
        templates.push(row);
        return row;
      },
    },
    anamnesisTemplateQuestion: {
      findMany: async ({
        where,
      }: {
        where: { templateId: string };
      }) => pivots.filter((row) => row.templateId === where.templateId),
      createMany: async ({
        data,
      }: {
        data: Array<{ templateId: string; questionId: string; sortOrder: number }>;
      }) => {
        pivots.push(...data);
        return { count: data.length };
      },
    },
  };
}

describe('seedClinicAnamnesis', () => {
  it('inserts the follow-up template on a new nutrition store', async () => {
    const prisma = createFakePrisma();

    await seedClinicAnamnesis(prisma as never, 'store-1', NUTRICAO_CLINIC_SEED_PACK);

    expect(
      prisma.templates.some(
        (template) => template.name === NUTRICAO_FOLLOWUP_ANAMNESIS_TEMPLATE_NAME,
      ),
    ).toBe(true);
    expect(
      prisma.questions.filter((question) => question.type === 'single_choice'),
    ).toHaveLength(
      NUTRICAO_FOLLOWUP_ANAMNESIS_QUESTIONS.filter(
        (question) => question.type === 'single_choice',
      ).length,
    );
  });

  it('is idempotent on an already provisioned store', async () => {
    const prisma = createFakePrisma();

    await seedClinicAnamnesis(prisma as never, 'store-1', NUTRICAO_CLINIC_SEED_PACK);
    const questionCount = prisma.questions.length;
    const templateCount = prisma.templates.length;
    const pivotCount = prisma.pivots.length;

    await seedClinicAnamnesis(prisma as never, 'store-1', NUTRICAO_CLINIC_SEED_PACK);

    expect(prisma.questions).toHaveLength(questionCount);
    expect(prisma.templates).toHaveLength(templateCount);
    expect(prisma.pivots).toHaveLength(pivotCount);
  });
});
