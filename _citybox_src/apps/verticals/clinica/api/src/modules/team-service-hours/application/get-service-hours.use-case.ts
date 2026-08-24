import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../shared/core/use-case.interface';
import { createDefaultServiceHours } from '../domain/service-hours.types';
import { parseMemberId } from '../domain/service-hours.validator';
import { ProfessionalServiceHoursRepository } from '../domain/professional-service-hours.repository';

export type GetServiceHoursInput = {
  storeId: string;
  memberId: string;
};

@Injectable()
export class GetServiceHoursUseCase implements IUseCase<
  GetServiceHoursInput,
  ReturnType<typeof createDefaultServiceHours>
> {
  constructor(
    private readonly repository: ProfessionalServiceHoursRepository,
  ) {}

  async execute(input: GetServiceHoursInput) {
    const memberId = parseMemberId(input.memberId);
    const saved = await this.repository.findByMember(input.storeId, memberId);
    return saved ?? createDefaultServiceHours();
  }
}
