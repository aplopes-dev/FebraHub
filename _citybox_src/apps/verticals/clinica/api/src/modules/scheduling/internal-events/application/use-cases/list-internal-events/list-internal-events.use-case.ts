import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { InternalEventRepository } from '../../../domain/repositories/internal-event.repository.interface';
import type {
  ListInternalEventsDto,
  InternalEventPresentation,
} from '../../dtos/internal-event.dto';
import { toInternalEventPresentation } from '../../dtos/internal-event.dto';

@Injectable()
export class ListInternalEventsUseCase implements IUseCase<
  ListInternalEventsDto,
  InternalEventPresentation[]
> {
  constructor(private readonly repository: InternalEventRepository) {}

  async execute(
    dto: ListInternalEventsDto,
  ): Promise<InternalEventPresentation[]> {
    const events = await this.repository.findMany(dto.storeId, {
      startDate: dto.startDate,
      endDate: dto.endDate,
      professionalIds: dto.professionalIds,
    });

    return events.map((event) => toInternalEventPresentation(event));
  }
}
