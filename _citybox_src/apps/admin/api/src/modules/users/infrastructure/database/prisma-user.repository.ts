import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  UserRepository,
  type UserListCriteria,
} from '../../domain/repositories/user.repository.interface';
import {
  User,
  type PlatformRole,
  type UserProps,
} from '../../domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByKeycloakSub(keycloakSub: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { keycloakSub } });
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({ where: { email } });
    return row ? this.toEntity(row) : null;
  }

  async findAll(criteria?: UserListCriteria): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      where: this.buildWhere(criteria),
      skip: criteria?.skip,
      take: criteria?.take,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row: Parameters<typeof this.toEntity>[0]) =>
      this.toEntity(row),
    );
  }

  async count(criteria?: UserListCriteria): Promise<number> {
    return this.prisma.user.count({ where: this.buildWhere(criteria) });
  }

  async save(user: User): Promise<User> {
    const row = await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        keycloakSub: user.keycloakSub,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        photoKey: user.photoKey,
        photoMimeType: user.photoMimeType,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      update: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        photoKey: user.photoKey,
        photoMimeType: user.photoMimeType,
        updatedAt: user.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private buildWhere(criteria?: UserListCriteria): Prisma.UserWhereInput {
    const conditions: Prisma.UserWhereInput[] = [];

    if (criteria?.roles?.length) {
      conditions.push({ role: { in: criteria.roles } });
    }

    const search = criteria?.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { displayName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (!conditions.length) return {};
    return { AND: conditions };
  }

  private toEntity(row: {
    id: string;
    keycloakSub: string;
    email: string | null;
    displayName: string | null;
    role: string;
    photoKey: string | null;
    photoMimeType: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const props: UserProps = {
      keycloakSub: row.keycloakSub,
      email: row.email,
      displayName: row.displayName,
      role: (row.role as PlatformRole) ?? 'platform_operator',
      photoKey: row.photoKey,
      photoMimeType: row.photoMimeType,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return User.with(props, row.id);
  }
}
