import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  ListTemplatesDto,
  TemplateAggregate,
} from '../../dtos/anamnesis.dto';
import { AnamnesisTemplateRepository } from '../../../domain/repositories/anamnesis.repository.interface';

@Injectable()
export class ListTemplatesUseCase implements IUseCase<
  ListTemplatesDto,
  TemplateAggregate[]
> {
  constructor(
    private readonly templateRepository: AnamnesisTemplateRepository,
  ) {}

  async execute(dto: ListTemplatesDto): Promise<TemplateAggregate[]> {
    return this.templateRepository.findAllAggregates(dto.storeId);
  }
}
