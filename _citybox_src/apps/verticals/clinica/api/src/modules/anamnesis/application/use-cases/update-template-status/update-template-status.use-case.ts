import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  TemplateAggregate,
  UpdateTemplateStatusDto,
} from '../../dtos/anamnesis.dto';
import { AnamnesisTemplateRepository } from '../../../domain/repositories/anamnesis.repository.interface';
import { TemplateNotFoundError } from '../../../domain/errors/template-not-found.error';

@Injectable()
export class UpdateTemplateStatusUseCase implements IUseCase<
  UpdateTemplateStatusDto,
  TemplateAggregate
> {
  constructor(
    private readonly templateRepository: AnamnesisTemplateRepository,
  ) {}

  async execute(dto: UpdateTemplateStatusDto): Promise<TemplateAggregate> {
    const existing = await this.templateRepository.findAggregateById(
      dto.storeId,
      dto.id,
    );
    if (!existing) {
      throw new TemplateNotFoundError(UpdateTemplateStatusUseCase.name, dto.id);
    }

    return this.templateRepository.updateStatus(
      dto.storeId,
      dto.id,
      dto.status,
    );
  }
}
