import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  AnamnesisQuestionRecord,
  ListQuestionsDto,
} from '../../dtos/anamnesis.dto';
import { AnamnesisQuestionRepository } from '../../../domain/repositories/anamnesis.repository.interface';

@Injectable()
export class ListQuestionsUseCase implements IUseCase<
  ListQuestionsDto,
  AnamnesisQuestionRecord[]
> {
  constructor(
    private readonly questionRepository: AnamnesisQuestionRepository,
  ) {}

  async execute(dto: ListQuestionsDto): Promise<AnamnesisQuestionRecord[]> {
    return this.questionRepository.findLibrary(dto.storeId, dto.search);
  }
}
