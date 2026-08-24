import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  MovementCategory,
  type MovementCategoryType,
} from '../../domain/entities/movement-category.entity';
import {
  formatMovementCategoryCode,
  parseMovementCategoryCodeNumber,
} from '../../domain/movement-category-code';
import {
  MovementCategoryRepository,
  type MovementCategoryListCriteria,
} from '../../domain/repositories/movement-category.repository.interface';
import { MovementCategoryCodeTakenError } from '../../domain/errors/movement-category-code-taken.error';

/** `P2002` no unique `(organizationId, code)` — corrida de geração de código. */
function isCodeUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== 'P2002') return false;
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.map(String) : [String(target)];
  return fields.some((field) => field.includes('code'));
}

const WITH_BRANCHES = {
  branches: { select: { branchId: true } },
} as const;

type MovementCategoryRow = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: string;
  systemKey: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  branches: Array<{ branchId: string }>;
};

@Injectable()
export class PrismaMovementCategoryRepository extends MovementCategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<MovementCategory | null> {
    const row = await this.prisma.scoped.movementCategory.findFirst({
      where: { id, organizationId },
      include: WITH_BRANCHES,
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: MovementCategoryListCriteria = {},
  ): Promise<MovementCategory[]> {
    const rows = await this.prisma.scoped.movementCategory.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: WITH_BRANCHES,
      orderBy: { code: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: { search?: string; type?: MovementCategoryType } = {},
  ): Promise<number> {
    return this.prisma.scoped.movementCategory.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async nextCode(organizationId: string): Promise<string> {
    const rows = await this.prisma.scoped.movementCategory.findMany({
      where: { organizationId },
      select: { code: true },
    });

    let max = 0;
    for (const row of rows) {
      const n = parseMovementCategoryCodeNumber(row.code);
      if (n !== null && n > max) max = n;
    }
    return formatMovementCategoryCode(max + 1);
  }

  async save(category: MovementCategory): Promise<MovementCategory> {
    const data = {
      organizationId: category.organizationId,
      code: category.code,
      name: category.name,
      type: category.type,
      systemKey: category.systemKey,
      isSystem: category.isSystem,
      updatedAt: category.updatedAt,
    };

    const row = await this.runSaveTransaction(category, data).catch(
      (error: unknown) => {
        // Traduz a violação de unique para erro de domínio — o use-case
        // recalcula o código e tenta de novo, em vez de devolver 500.
        if (isCodeUniqueViolation(error)) {
          throw new MovementCategoryCodeTakenError(category.code);
        }
        throw error;
      },
    );

    return this.toEntity(row);
  }

  private async runSaveTransaction(
    category: MovementCategory,
    data: {
      organizationId: string;
      code: string;
      name: string;
      type: MovementCategoryType;
      systemKey: string | null;
      isSystem: boolean;
      updatedAt: Date;
    },
  ) {
    return this.prisma.scoped.$transaction(async (tx) => {
      const saved = await tx.movementCategory.upsert({
        where: { id: category.id },
        create: {
          id: category.id,
          ...data,
          createdAt: category.createdAt,
        },
        update: {
          name: data.name,
          type: data.type,
          isSystem: data.isSystem,
          updatedAt: data.updatedAt,
          // code e systemKey não entram no update — imutáveis após create
        },
      });

      await tx.movementCategoryBranch.deleteMany({
        where: {
          movementCategoryId: saved.id,
          organizationId: category.organizationId,
        },
      });

      if (category.branchIds.length > 0) {
        await tx.movementCategoryBranch.createMany({
          data: category.branchIds.map((branchId) => ({
            organizationId: category.organizationId,
            movementCategoryId: saved.id,
            branchId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.movementCategory.findFirstOrThrow({
        where: { id: saved.id },
        include: WITH_BRANCHES,
      });
    });
  }

  async isInUse(organizationId: string, id: string): Promise<boolean> {
    const used = await this.prisma.scoped.stockMovement.findFirst({
      where: { organizationId, categoryId: id },
      select: { id: true },
    });
    return used !== null;
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.scoped.movementCategory.deleteMany({
      where: { id, organizationId },
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: { search?: string; type?: MovementCategoryType },
  ): Prisma.MovementCategoryWhereInput {
    const search = criteria.search?.trim();
    return {
      organizationId,
      ...(criteria.type ? { type: criteria.type } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { code: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
  }

  private toEntity(row: MovementCategoryRow): MovementCategory {
    return MovementCategory.with(
      {
        organizationId: row.organizationId,
        code: row.code,
        name: row.name,
        type: row.type as MovementCategoryType,
        systemKey: row.systemKey,
        isSystem: row.isSystem,
        branchIds: row.branches.map((b) => b.branchId),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
