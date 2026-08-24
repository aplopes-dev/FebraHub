import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ClientRepository,
  ListClientsFilter,
} from '../../domain/repositories/client.repository.interface';
import { ClientEntity } from '../../domain/entities/client.entity';
import {
  Prisma,
  Client as PrismaClientRow,
  ClientCategory as PrismaClientCategory,
} from '../../../../../generated/prisma/client';

type ClientRow = PrismaClientRow & {
  category: PrismaClientCategory | null;
};

@Injectable()
export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: ClientRow): ClientEntity {
    return ClientEntity.create(
      {
        storeId: raw.storeId,
        name: raw.name,
        phone: raw.phone,
        categoryId: raw.categoryId,
        categoryName: raw.category?.name ?? null,
        categoryColorId: raw.category?.colorId ?? null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  async save(client: ClientEntity): Promise<void> {
    await this.prisma.client.upsert({
      where: { id: client.id },
      create: {
        id: client.id,
        storeId: client.storeId,
        name: client.name,
        phone: client.phone,
        categoryId: client.categoryId,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      update: {
        name: client.name,
        phone: client.phone,
        categoryId: client.categoryId,
        updatedAt: client.updatedAt,
      },
    });
  }

  async findById(storeId: string, id: string): Promise<ClientEntity | null> {
    const raw = await this.prisma.client.findFirst({
      where: { id, storeId },
      include: { category: true },
    });

    if (!raw) return null;

    return this.toDomain(raw);
  }

  async findAll(
    storeId: string,
    filter?: ListClientsFilter,
  ): Promise<ClientEntity[]> {
    const where: Prisma.ClientWhereInput = { storeId };

    if (typeof filter?.search === 'string' && filter.search.trim()) {
      const search = filter.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const list = await this.prisma.client.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((item) => this.toDomain(item));
  }

  async findPaginated(
    storeId: string,
    filter?: ListClientsFilter,
    pagination?: { page: number; perPage: number },
  ): Promise<{ items: ClientEntity[]; total: number }> {
    const where: Prisma.ClientWhereInput = { storeId };

    if (typeof filter?.search === 'string' && filter.search.trim()) {
      const search = filter.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const page = pagination?.page ?? 1;
    const perPage = pagination?.perPage ?? 10;
    const skip = (page - 1) * perPage;

    const [total, list] = await Promise.all([
      this.prisma.client.count({ where }),
      this.prisma.client.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
    ]);

    return {
      items: list.map((item) => this.toDomain(item)),
      total,
    };
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.client.deleteMany({
      where: { id, storeId },
    });
  }
}
