import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ServiceRepository,
  ListServicesFilter,
} from '../../domain/repositories/service.repository.interface';
import { ServiceEntity } from '../../domain/entities/service.entity';
import {
  Prisma,
  Service as PrismaServiceItem,
} from '../../../../../generated/prisma/client';

type ServiceWithMembers = PrismaServiceItem & {
  memberServices: { memberId: string }[];
};

@Injectable()
export class PrismaServiceRepository implements ServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: ServiceWithMembers): ServiceEntity {
    return ServiceEntity.create(
      {
        storeId: raw.storeId,
        name: raw.name,
        categories: raw.categories,
        durationMinutes: raw.durationMinutes,
        price: raw.price,
        description: raw.description,
        active: raw.active,
        professionalIds: raw.memberServices.map((ms) => ms.memberId),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  async save(service: ServiceEntity): Promise<void> {
    // Vínculos M2M são gravados apenas via Member.serviceIds — não tocar no join aqui.
    await this.prisma.service.upsert({
      where: { id: service.id },
      create: {
        id: service.id,
        storeId: service.storeId,
        name: service.name,
        categories: service.categories,
        durationMinutes: service.durationMinutes,
        price: service.price,
        description: service.description,
        active: service.active,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
      update: {
        name: service.name,
        categories: service.categories,
        durationMinutes: service.durationMinutes,
        price: service.price,
        description: service.description,
        active: service.active,
        updatedAt: service.updatedAt,
      },
    });
  }

  async findById(storeId: string, id: string): Promise<ServiceEntity | null> {
    const raw = await this.prisma.service.findFirst({
      where: { id, storeId },
      include: { memberServices: true },
    });

    if (!raw) return null;

    return this.toDomain(raw);
  }

  private buildWhere(
    storeId: string,
    filter?: ListServicesFilter,
  ): Prisma.ServiceWhereInput {
    const where: Prisma.ServiceWhereInput = { storeId };

    if (filter?.active !== undefined) {
      where.active = filter.active;
    }

    if (filter?.category && filter.category !== 'all') {
      where.categories = { has: filter.category };
    }

    if (filter?.search) {
      const search = filter.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { categories: { has: search } },
      ];
    }

    return where;
  }

  async findAll(
    storeId: string,
    filter?: ListServicesFilter,
  ): Promise<ServiceEntity[]> {
    const list = await this.prisma.service.findMany({
      where: this.buildWhere(storeId, filter),
      include: { memberServices: true },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((item) => this.toDomain(item));
  }

  async findPaginated(
    storeId: string,
    filter: ListServicesFilter,
    pagination: { page: number; perPage: number },
  ): Promise<{ items: ServiceEntity[]; total: number }> {
    const where = this.buildWhere(storeId, filter);
    const skip = (pagination.page - 1) * pagination.perPage;

    const [list, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        include: { memberServices: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.perPage,
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      items: list.map((item) => this.toDomain(item)),
      total,
    };
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.service.deleteMany({
      where: { id, storeId },
    });
  }
}
