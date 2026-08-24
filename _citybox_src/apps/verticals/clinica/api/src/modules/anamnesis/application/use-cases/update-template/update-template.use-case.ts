import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  TemplateAggregate,
  UpdateTemplateDto,
} from '../../dtos/anamnesis.dto';
import {
  AnamnesisQuestionRepository,
  AnamnesisTemplateRepository,
} from '../../../domain/repositories/anamnesis.repository.interface';
import { TemplateNotFoundError } from '../../../domain/errors/template-not-found.error';
import { TemplateNameTakenError } from '../../../domain/errors/template-name-taken.error';
import { validateTemplatePayload } from '../../services/validate-template-payload';

@Injectable()
export class UpdateTemplateUseCase implements IUseCase<
  UpdateTemplateDto,
  TemplateAggregate
> {
  constructor(
    private readonly templateRepository: AnamnesisTemplateRepository,
    private readonly questionRepository: AnamnesisQuestionRepository,
  ) {}

  async execute(dto: UpdateTemplateDto): Promise<TemplateAggregate> {
    const existing = await this.templateRepository.findAggregateById(
      dto.storeId,
      dto.id,
    );
    if (!existing) {
      throw new TemplateNotFoundError(UpdateTemplateUseCase.name, dto.id);
    }

    const name = dto.name.trim();
    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      const taken = await this.templateRepository.findByName(dto.storeId, name);
      if (taken && taken.id !== dto.id) {
        throw new TemplateNameTakenError(UpdateTemplateUseCase.name, name);
      }
    }

    const { templateQuestions, customQuestions } =
      await validateTemplatePayload(
        dto,
        this.questionRepository,
        UpdateTemplateUseCase.name,
      );

    const aggregate: TemplateAggregate = {
      ...existing,
      name,
      status: dto.status,
      templateQuestions,
      customQuestions,
      updatedAt: new Date(),
    };

    return this.templateRepository.saveAggregate(aggregate);
  }
}
