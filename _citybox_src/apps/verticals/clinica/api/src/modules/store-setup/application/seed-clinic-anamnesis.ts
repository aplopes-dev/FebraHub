import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaClient } from '../../../../generated/prisma/client';
import type {
  ClinicSeedAnamnesisQuestion,
  ClinicSeedAnamnesisTemplate,
} from './seed-data/anamnesis-templates';
import { ANAMNESIS_QUESTION_LIBRARY } from './seed-data/anamnesis-templates';
import { GLOBAL_ANAMNESIS_QUESTIONS } from './seed-data/global-anamnesis-questions';
import type { ClinicSeedPack } from './seed-data/packs/types';

type AnamnesisSeedClient = Pick<
  PrismaClient,
  'anamnesisQuestion' | 'anamnesisTemplate' | 'anamnesisTemplateQuestion'
>;

function libraryForPack(pack: ClinicSeedPack): ClinicSeedAnamnesisQuestion[] {
  if (pack.anamnesis.librarySource === 'odontologia-full') {
    return ANAMNESIS_QUESTION_LIBRARY;
  }
  return [...GLOBAL_ANAMNESIS_QUESTIONS, ...pack.anamnesis.extraLibrary];
}

function toPrismaOptions(
  options: ClinicSeedAnamnesisQuestion['options'],
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (!options || options.length === 0) {
    return Prisma.DbNull;
  }
  return options as Prisma.InputJsonValue;
}

async function ensureQuestion(
  prisma: AnamnesisSeedClient,
  storeId: string,
  question: ClinicSeedAnamnesisQuestion,
): Promise<string> {
  const existing = await prisma.anamnesisQuestion.findFirst({
    where: {
      storeId,
      text: question.text,
      type: question.type,
      templateId: null,
    },
  });

  if (existing) {
    if (question.options && question.options.length > 0 && existing.options == null) {
      await prisma.anamnesisQuestion.update({
        where: { id: existing.id },
        data: { options: toPrismaOptions(question.options) },
      });
    }
    return existing.id;
  }

  const created = await prisma.anamnesisQuestion.create({
    data: {
      storeId,
      templateId: null,
      text: question.text,
      type: question.type,
      scope: 'clinic',
      generatesAlert: question.generatesAlert,
      alertWhen: question.alertWhen,
      alertName: question.alertName,
      options: toPrismaOptions(question.options),
    },
  });
  return created.id;
}

async function ensureQuestions(
  prisma: AnamnesisSeedClient,
  storeId: string,
  questions: ClinicSeedAnamnesisQuestion[],
): Promise<Map<string, string>> {
  const textToQuestionId = new Map<string, string>();

  for (const question of questions) {
    const id = await ensureQuestion(prisma, storeId, question);
    if (!textToQuestionId.has(question.text)) {
      textToQuestionId.set(question.text, id);
    }
  }

  return textToQuestionId;
}

async function ensureTemplate(
  prisma: AnamnesisSeedClient,
  storeId: string,
  template: ClinicSeedAnamnesisTemplate,
  textToQuestionId: Map<string, string>,
): Promise<void> {
  let templateRow = await prisma.anamnesisTemplate.findFirst({
    where: { storeId, name: template.name },
  });

  if (!templateRow) {
    templateRow = await prisma.anamnesisTemplate.create({
      data: {
        storeId,
        name: template.name,
        status: 'active',
      },
    });
  }

  const existingPivots = await prisma.anamnesisTemplateQuestion.findMany({
    where: { templateId: templateRow.id },
    select: { questionId: true },
  });
  const existingQuestionIds = new Set(
    existingPivots.map((pivot) => pivot.questionId),
  );

  const pivots = template.activeQuestionTexts
    .flatMap((text, sortOrder) => {
      const questionId = textToQuestionId.get(text);
      if (questionId === undefined) {
        throw new Error(
          `Seed error: question text "${text}" not found in library for template "${template.name}"`,
        );
      }
      if (existingQuestionIds.has(questionId)) {
        return [];
      }
      return [
        {
          storeId,
          templateId: templateRow.id,
          questionId,
          sortOrder,
          active: true,
        },
      ];
    });

  if (pivots.length > 0) {
    await prisma.anamnesisTemplateQuestion.createMany({ data: pivots });
  }
}

/**
 * Semear anamneses de uma loja de forma idempotente por pergunta (texto+tipo)
 * e por modelo (nome). Não aborta quando a loja já tem templates.
 */
export async function seedClinicAnamnesis(
  prisma: AnamnesisSeedClient,
  storeId: string,
  pack: ClinicSeedPack,
): Promise<void> {
  const libraryMap = await ensureQuestions(
    prisma,
    storeId,
    libraryForPack(pack),
  );

  const followupName = pack.anamnesis.followupTemplateName;
  const followupLibrary = pack.anamnesis.followupLibrary ?? [];
  const followupMap =
    followupLibrary.length > 0
      ? await ensureQuestions(prisma, storeId, followupLibrary)
      : new Map<string, string>();

  for (const template of pack.anamnesis.templates) {
    const questionMap =
      followupName && template.name === followupName
        ? followupMap
        : libraryMap;
    await ensureTemplate(prisma, storeId, template, questionMap);
  }
}
