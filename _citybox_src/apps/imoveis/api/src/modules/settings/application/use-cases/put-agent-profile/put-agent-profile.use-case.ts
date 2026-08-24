import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { AgentProfileEntity } from '../../../domain/entities/agent-profile.entity';
import {
  AgentProfileRepository,
  type AgentProfileWritePayload,
} from '../../../domain/repositories/agent-profile.repository.interface';

export type PutAgentProfileInput = {
  storeId: string;
  agentId: string;
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  region?: string;
  stateId?: string;
  taxId?: string;
};

function normalizeProvided(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value.trim();
}

/** Atualiza só os campos enviados; omitidos preservam o valor atual. */
@Injectable()
export class PutAgentProfileUseCase implements IUseCase<
  PutAgentProfileInput,
  AgentProfileEntity
> {
  constructor(private readonly profiles: AgentProfileRepository) {}

  async execute(input: PutAgentProfileInput): Promise<AgentProfileEntity> {
    const payload: AgentProfileWritePayload = {};
    const name = normalizeProvided(input.name);
    const role = normalizeProvided(input.role);
    const email = normalizeProvided(input.email);
    const phone = normalizeProvided(input.phone);
    const region = normalizeProvided(input.region);
    const stateId = normalizeProvided(input.stateId);
    const taxId = normalizeProvided(input.taxId);

    if (name !== undefined) payload.name = name;
    if (role !== undefined) payload.role = role;
    if (email !== undefined) payload.email = email;
    if (phone !== undefined) payload.phone = phone;
    if (region !== undefined) payload.region = region;
    if (stateId !== undefined) payload.stateId = stateId;
    if (taxId !== undefined) payload.taxId = taxId;

    return this.profiles.upsert(input.storeId, input.agentId, payload);
  }
}
