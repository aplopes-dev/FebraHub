import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { AgentDeviceSessionEntity } from '../../domain/entities/agent-device-session.entity';
import {
  AgentDeviceSessionRepository,
  type AgentDeviceSessionCreatePayload,
} from '../../domain/repositories/agent-device-session.repository.interface';

type AgentDeviceSessionRow = Prisma.AgentDeviceSessionGetPayload<object>;

@Injectable()
export class PrismaAgentDeviceSessionRepository extends AgentDeviceSessionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(
    storeId: string,
    agentId: string,
  ): Promise<AgentDeviceSessionEntity[]> {
    const rows = await this.prisma.agentDeviceSession.findMany({
      where: { storeId, agentId },
      orderBy: [
        { isCurrent: Prisma.SortOrder.desc },
        { createdAt: Prisma.SortOrder.asc },
      ],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findById(
    storeId: string,
    agentId: string,
    sessionId: string,
  ): Promise<AgentDeviceSessionEntity | null> {
    const row = await this.prisma.agentDeviceSession.findFirst({
      where: { id: sessionId, storeId, agentId },
    });
    return row ? this.toEntity(row) : null;
  }

  async create(
    storeId: string,
    agentId: string,
    payload: AgentDeviceSessionCreatePayload,
  ): Promise<AgentDeviceSessionEntity> {
    const row = await this.prisma.agentDeviceSession.create({
      data: { id: randomUUID(), storeId, agentId, ...payload },
    });
    return this.toEntity(row);
  }

  async delete(
    storeId: string,
    agentId: string,
    sessionId: string,
  ): Promise<boolean> {
    const { count } = await this.prisma.agentDeviceSession.deleteMany({
      where: { id: sessionId, storeId, agentId },
    });
    return count > 0;
  }

  async deleteAllForAgent(storeId: string, agentId: string): Promise<number> {
    const { count } = await this.prisma.agentDeviceSession.deleteMany({
      where: { storeId, agentId },
    });
    return count;
  }

  private toEntity(row: AgentDeviceSessionRow): AgentDeviceSessionEntity {
    return AgentDeviceSessionEntity.create(
      {
        storeId: row.storeId,
        agentId: row.agentId,
        device: row.device,
        location: row.location,
        lastActiveLabel: row.lastActiveLabel,
        isCurrent: row.isCurrent,
      },
      row.id,
    );
  }
}
