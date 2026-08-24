import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ClientCategoryEntity } from '../../domain/entities/client-category.entity';
import { ClientCategoryRepository } from '../../domain/repositories/client-category.repository.interface';
import { ClientCategory as PrismaClientCategory } from '../../../../../generated/prisma/client';

@Injectable()
export class PrismaClientCategoryRepository implements ClientCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaClientCategory): ClientCategoryEntity {
    return ClientCategoryEntity.create(
      {
        storeId: raw.storeId,
        name: raw.name,
        colorId: raw.colorId,
        isProtected: raw.isProtected,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  async save(category: ClientCategoryEntity): Promise<void> {
    await this.prisma.clientCategory.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        storeId: category.storeId,
        name: category.name,
        colorId: category.colorId,
        isProtected: category.isProtected,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      update: {
        name: category.name,
        colorId: category.colorId,
        isProtected: category.isProtected,
        updatedAt: category.updatedAt,
      },
    });
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<ClientCategoryEntity | null> {
    const raw = await this.prisma.clientCategory.findFirst({
      where: { id, storeId },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<ClientCategoryEntity | null> {
    const raw = await this.prisma.clientCategory.findFirst({
      where: { storeId, name },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findAll(storeId: string): Promise<ClientCategoryEntity[]> {
    const list = await this.prisma.clientCategory.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
    return list.map((item) => this.toDomain(item));
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.clientCategory.deleteMany({ where: { id, storeId } });
  }
}
