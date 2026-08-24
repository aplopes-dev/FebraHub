import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { toUserEntity } from './membership.mapper';

/**
 * `User` é global — a mesma pessoa pode ser membro de várias organizações —,
 * então este repositório usa o cliente cru: não há tenant a recortar.
 */
@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUserEntity(row) : null;
  }

  async findByKeycloakSub(keycloakSub: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { keycloakSub } });
    return row ? toUserEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    const row = await this.prisma.user.findFirst({
      where: { email: { equals: normalized, mode: 'insensitive' } },
    });
    return row ? toUserEntity(row) : null;
  }

  async save(user: User): Promise<User> {
    const data = {
      keycloakSub: user.keycloakSub,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      active: user.active,
      updatedAt: user.updatedAt,
    };

    const row = await this.prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, ...data, createdAt: user.createdAt },
      update: data,
    });

    return toUserEntity(row);
  }

  async delete(id: string): Promise<void> {
    // `deleteMany` não lança quando não há linha — mantém a compensação
    // idempotente, que é o que se quer num caminho de rollback.
    await this.prisma.user.deleteMany({ where: { id } });
  }
}
