import type { AnamnesisQuestionRecord } from '../../../../application/dtos/anamnesis.dto';
import { toQuestionLibraryResponse } from '../../mappers/anamnesis.mapper';

export class QuestionListPresenter {
  static toHttp(questions: AnamnesisQuestionRecord[]) {
    return {
      data: questions.map((question) => toQuestionLibraryResponse(question)),
    };
  }
}
