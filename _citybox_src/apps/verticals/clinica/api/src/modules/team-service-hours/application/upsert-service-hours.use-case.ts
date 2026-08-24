import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../shared/core/use-case.interface';
import type { ServiceHoursConfig } from '../domain/service-hours.types';
import {
  ServiceHoursZodValidator,
  parseMemberId,
} from '../domain/service-hours.validator';
import { ProfessionalServiceHoursRepository } from '../domain/professional-service-hours.repository';

export type UpsertServiceHoursInput = {
  storeId: string;
  memberId: string;
  config: ServiceHoursConfig;
};

@Injectable()
export class UpsertServiceHoursUseCase implements IUseCase<
  UpsertServiceHoursInput,
  ServiceHoursConfig
> {
  private readonly validator = ServiceHoursZodValidator.create();

  constructor(
    private readonly repository: ProfessionalServiceHoursRepository,
  ) {}

  async execute(input: UpsertServiceHoursInput): Promise<ServiceHoursConfig> {
    const memberId = parseMemberId(input.memberId);
    const config = this.validator.validate(input.config);
    return this.repository.upsert(input.storeId, memberId, config);
  }
}
