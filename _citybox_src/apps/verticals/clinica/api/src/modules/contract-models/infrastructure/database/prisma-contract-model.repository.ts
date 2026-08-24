import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ContractModelRepository } from '../../domain/repositories/contract-model.repository.interface';
import {
  ContractModel,
  type ContractModelProps,
} from '../../domain/entities/contract-model.entity';

type ContractModelRow = {
  id: string;
  storeId: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaContractModelRepository extends ContractModelRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(storeId: string, id: string): Promise<ContractModel | null> {
    const row = await this.prisma.contractModel.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<ContractModel | null> {
    const row = await this.prisma.contractModel.findFirst({
      where: { storeId, name: { equals: name, mode: 'insensitive' } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(storeId: string): Promise<ContractModel[]> {
    const rows = await this.prisma.contractModel.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async clearDefaultExcept(storeId: string, exceptId?: string): Promise<void> {
    await this.prisma.contractModel.updateMany({
      where: {
        storeId,
        isDefault: true,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { isDefault: false },
    });
  }

  async save(model: ContractModel): Promise<ContractModel> {
    const row = await this.prisma.contractModel.upsert({
      where: { id: model.id },
      create: {
        id: model.id,
        storeId: model.storeId,
        name: model.name,
        content: model.content,
        isDefault: model.isDefault,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      },
      update: {
        name: model.name,
        content: model.content,
        isDefault: model.isDefault,
        updatedAt: model.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.contractModel.deleteMany({ where: { id, storeId } });
  }

  async countEmissions(storeId: string, templateId: string): Promise<number> {
    return this.prisma.patientContractEmission.count({
      where: { storeId, templateId },
    });
  }

  private toEntity(row: ContractModelRow): ContractModel {
    const props: ContractModelProps = {
      storeId: row.storeId,
      name: row.name,
      content: row.content,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ContractModel.with(props, row.id);
  }
}
