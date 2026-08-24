import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  FindTemplateByIdDto,
  TemplateAggregate,
} from '../../dtos/anamnesis.dto';
import { AnamnesisTemplateRepository } from '../../../domain/repositories/anamnesis.repository.interface';
import { TemplateNotFoundError } from '../../../domain/errors/template-not-found.error';

@Injectable()
export class FindTemplateByIdUseCase implements IUseCase<
  FindTemplateByIdDto,
  TemplateAggregate
> {
  constructor(
    private readonly templateRepository: AnamnesisTemplateRepository,
  ) {}

  async execute(dto: FindTemplateByIdDto): Promise<TemplateAggregate> {
    const template = await this.templateRepository.findAggregateById(
      dto.storeId,
      dto.id,
    );
    if (!template) {
      throw new TemplateNotFoundError(FindTemplateByIdUseCase.name, dto.id);
    }
    return template;
  }
}
