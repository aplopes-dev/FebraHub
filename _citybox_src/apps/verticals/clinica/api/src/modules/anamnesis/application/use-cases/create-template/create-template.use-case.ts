import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  CreateTemplateDto,
  TemplateAggregate,
} from '../../dtos/anamnesis.dto';
import {
  AnamnesisQuestionRepository,
  AnamnesisTemplateRepository,
} from '../../../domain/repositories/anamnesis.repository.interface';
import { TemplateNameTakenError } from '../../../domain/errors/template-name-taken.error';
import { validateTemplatePayload } from '../../services/validate-template-payload';

@Injectable()
export class CreateTemplateUseCase implements IUseCase<
  CreateTemplateDto,
  TemplateAggregate
> {
  constructor(
    private readonly templateRepository: AnamnesisTemplateRepository,
    private readonly questionRepository: AnamnesisQuestionRepository,
  ) {}

  async execute(dto: CreateTemplateDto): Promise<TemplateAggregate> {
    const name = dto.name.trim();
    const existing = await this.templateRepository.findByName(
      dto.storeId,
      name,
    );
    if (existing) {
      throw new TemplateNameTakenError(CreateTemplateUseCase.name, name);
    }

    const { templateQuestions, customQuestions } =
      await validateTemplatePayload(
        dto,
        this.questionRepository,
        CreateTemplateUseCase.name,
      );

    const now = new Date();
    const aggregate: TemplateAggregate = {
      id: randomUUID(),
      storeId: dto.storeId,
      name,
      status: dto.status,
      templateQuestions,
      customQuestions,
      createdAt: now,
      updatedAt: now,
    };

    return this.templateRepository.saveAggregate(aggregate);
  }
}
