import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { DeleteTemplateDto } from '../../dtos/anamnesis.dto';
import { AnamnesisTemplateRepository } from '../../../domain/repositories/anamnesis.repository.interface';
import { TemplateNotFoundError } from '../../../domain/errors/template-not-found.error';
import { AnamnesisTemplateHasPatientsError } from '../../../domain/errors/anamnesis-template-has-patients.error';

@Injectable()
export class DeleteTemplateUseCase implements IUseCase<
  DeleteTemplateDto,
  void
> {
  constructor(
    private readonly templateRepository: AnamnesisTemplateRepository,
  ) {}

  async execute(dto: DeleteTemplateDto): Promise<void> {
    const existing = await this.templateRepository.findAggregateById(
      dto.storeId,
      dto.id,
    );
    if (!existing) {
      throw new TemplateNotFoundError(DeleteTemplateUseCase.name, dto.id);
    }

    const filled = await this.templateRepository.countPatientAnamneses(
      dto.storeId,
      dto.id,
    );
    if (filled > 0) {
      throw new AnamnesisTemplateHasPatientsError(
        DeleteTemplateUseCase.name,
        dto.id,
      );
    }

    await this.templateRepository.delete(dto.storeId, dto.id);
  }
}
