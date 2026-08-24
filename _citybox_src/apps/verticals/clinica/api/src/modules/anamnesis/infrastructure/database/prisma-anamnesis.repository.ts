import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type {
  AnamnesisQuestionOption,
  AnamnesisQuestionRecord,
  AnamnesisTemplateStatus,
  TemplateAggregate,
} from '../../application/dtos/anamnesis.dto';
import {
  AnamnesisQuestionRepository,
  AnamnesisTemplateRepository,
} from '../../domain/repositories/anamnesis.repository.interface';
import {
  toQuestionRecord,
  toTemplateAggregate,
} from '../http/mappers/anamnesis.mapper';

function toPrismaOptions(
  options: AnamnesisQuestionOption[] | undefined,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (!options || options.length === 0) {
    return Prisma.DbNull;
  }
  return options as Prisma.InputJsonValue;
}

type QuestionRow = {
  id: string;
  storeId: string | null;
  templateId: string | null;
  text: string;
  type: AnamnesisQuestionRecord['type'];
  scope: AnamnesisQuestionRecord['scope'];
  auxiliaryText: string | null;
  generatesAlert: boolean;
  alertWhen: AnamnesisQuestionRecord['alertWhen'] | null;
  alertName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaAnamnesisQuestionRepository extends AnamnesisQuestionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAccessibleByIds(
    storeId: string,
    ids: string[],
  ): Promise<AnamnesisQuestionRecord[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.anamnesisQuestion.findMany({
      where: {
        id: { in: ids },
        OR: [
          { storeId: null },
          { storeId },
          { storeId, templateId: { not: null } },
        ],
      },
    });

    return rows.map((row) => toQuestionRecord(row as QuestionRow));
  }

  async findLibrary(
    storeId: string,
    search?: string,
  ): Promise<AnamnesisQuestionRecord[]> {
    const term = search?.trim();
    const rows = await this.prisma.anamnesisQuestion.findMany({
      where: {
        templateId: null,
        OR: [{ storeId: null }, { storeId }],
        ...(term
          ? {
              text: { contains: term, mode: 'insensitive' as const },
            }
          : {}),
      },
      orderBy: [{ scope: 'asc' }, { text: 'asc' }],
    });

    return rows.map((row) => toQuestionRecord(row as QuestionRow));
  }

  async upsertLibraryQuestions(
    storeId: string,
    questions: Array<{
      id: string;
      text: string;
      type: AnamnesisQuestionRecord['type'];
      auxiliaryText?: string;
      options?: AnamnesisQuestionOption[];
      generatesAlert?: boolean;
      alertWhen?: AnamnesisQuestionRecord['alertWhen'];
      alertName?: string;
    }>,
  ): Promise<void> {
    if (questions.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      questions.map((question) =>
        this.prisma.anamnesisQuestion.upsert({
          where: { id: question.id },
          create: {
            id: question.id,
            storeId,
            templateId: null,
            text: question.text,
            type: question.type,
            scope: 'clinic',
            auxiliaryText: question.auxiliaryText ?? null,
            options: toPrismaOptions(question.options),
            generatesAlert: question.generatesAlert ?? false,
            alertWhen: question.alertWhen ?? null,
            alertName: question.alertName ?? null,
          },
          update: {
            storeId,
            templateId: null,
            text: question.text,
            type: question.type,
            scope: 'clinic',
            auxiliaryText: question.auxiliaryText ?? null,
            options: toPrismaOptions(question.options),
            generatesAlert: question.generatesAlert ?? false,
            alertWhen: question.alertWhen ?? null,
            alertName: question.alertName ?? null,
          },
        }),
      ),
    );
  }
}

@Injectable()
export class PrismaAnamnesisTemplateRepository extends AnamnesisTemplateRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAllAggregates(storeId: string): Promise<TemplateAggregate[]> {
    const templates = await this.prisma.anamnesisTemplate.findMany({
      where: { storeId },
      include: this.includeRelations(),
      orderBy: { name: 'asc' },
    });

    return templates.map((template) => toTemplateAggregate(template));
  }

  async findAggregateById(
    storeId: string,
    id: string,
  ): Promise<TemplateAggregate | null> {
    const template = await this.prisma.anamnesisTemplate.findFirst({
      where: { id, storeId },
      include: this.includeRelations(),
    });

    return template ? toTemplateAggregate(template) : null;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<TemplateAggregate | null> {
    const template = await this.prisma.anamnesisTemplate.findFirst({
      where: {
        storeId,
        name: { equals: name, mode: 'insensitive' },
      },
      include: this.includeRelations(),
    });

    return template ? toTemplateAggregate(template) : null;
  }

  async saveAggregate(
    aggregate: TemplateAggregate,
  ): Promise<TemplateAggregate> {
    await this.prisma.$transaction(async (tx) => {
      for (const question of aggregate.customQuestions) {
        await tx.anamnesisQuestion.upsert({
          where: { id: question.id },
          create: {
            id: question.id,
            storeId: aggregate.storeId,
            templateId: null,
            text: question.text,
            type: question.type,
            scope: 'clinic',
            auxiliaryText: question.auxiliaryText ?? null,
            options: toPrismaOptions(question.options),
            generatesAlert: question.generatesAlert ?? false,
            alertWhen: question.alertWhen ?? null,
            alertName: question.alertName ?? null,
          },
          update: {
            storeId: aggregate.storeId,
            templateId: null,
            text: question.text,
            type: question.type,
            scope: 'clinic',
            auxiliaryText: question.auxiliaryText ?? null,
            options: toPrismaOptions(question.options),
            generatesAlert: question.generatesAlert ?? false,
            alertWhen: question.alertWhen ?? null,
            alertName: question.alertName ?? null,
          },
        });
      }

      await tx.anamnesisTemplate.upsert({
        where: { id: aggregate.id },
        create: {
          id: aggregate.id,
          storeId: aggregate.storeId,
          name: aggregate.name,
          status: aggregate.status,
          createdAt: aggregate.createdAt,
          updatedAt: aggregate.updatedAt,
        },
        update: {
          name: aggregate.name,
          status: aggregate.status,
          updatedAt: aggregate.updatedAt,
        },
      });

      await tx.anamnesisTemplateQuestion.deleteMany({
        where: { templateId: aggregate.id, storeId: aggregate.storeId },
      });

      if (aggregate.templateQuestions.length > 0) {
        await tx.anamnesisTemplateQuestion.createMany({
          data: aggregate.templateQuestions.map((item, index) => ({
            id: randomUUID(),
            storeId: aggregate.storeId,
            templateId: aggregate.id,
            questionId: item.questionId,
            sortOrder: index,
            active: item.active,
          })),
        });
      }
    });

    const saved = await this.findAggregateById(aggregate.storeId, aggregate.id);
    if (!saved) {
      throw new Error('Failed to reload saved anamnesis template');
    }
    return saved;
  }

  async updateStatus(
    storeId: string,
    id: string,
    status: AnamnesisTemplateStatus,
  ): Promise<TemplateAggregate> {
    await this.prisma.anamnesisTemplate.updateMany({
      where: { id, storeId },
      data: { status },
    });

    const updated = await this.findAggregateById(storeId, id);
    if (!updated) {
      throw new Error('Failed to reload template after status update');
    }
    return updated;
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.anamnesisTemplate.deleteMany({ where: { id, storeId } });
  }

  async countPatientAnamneses(
    storeId: string,
    templateId: string,
  ): Promise<number> {
    return this.prisma.patientAnamnesis.count({
      where: { storeId, templateId },
    });
  }

  private includeRelations() {
    return {
      templateQuestions: {
        orderBy: { sortOrder: 'asc' as const },
      },
      customQuestions: {
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }
}
