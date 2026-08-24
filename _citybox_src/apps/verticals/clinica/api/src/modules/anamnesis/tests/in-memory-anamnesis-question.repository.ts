import type {
  AnamnesisQuestionRecord,
  AnamnesisTemplateStatus,
  TemplateAggregate,
} from '../application/dtos/anamnesis.dto';
import { AnamnesisQuestionRepository } from '../domain/repositories/anamnesis.repository.interface';

export class InMemoryAnamnesisQuestionRepository extends AnamnesisQuestionRepository {
  private questions: AnamnesisQuestionRecord[] = [];

  seed(questions: AnamnesisQuestionRecord[]): void {
    this.questions = [...questions];
  }

  async findAccessibleByIds(
    storeId: string,
    ids: string[],
  ): Promise<AnamnesisQuestionRecord[]> {
    return this.questions.filter(
      (question) =>
        ids.includes(question.id) &&
        (question.storeId === null ||
          question.storeId === storeId ||
          question.templateId !== null),
    );
  }

  async findLibrary(
    storeId: string,
    search?: string,
  ): Promise<AnamnesisQuestionRecord[]> {
    const term = search?.trim().toLowerCase();
    return this.questions
      .filter(
        (question) =>
          question.templateId === null &&
          (question.storeId === null || question.storeId === storeId) &&
          (!term || question.text.toLowerCase().includes(term)),
      )
      .sort((a, b) => a.text.localeCompare(b.text));
  }

  async upsertLibraryQuestions(
    storeId: string,
    questions: Array<{
      id: string;
      text: string;
      type: AnamnesisQuestionRecord['type'];
      auxiliaryText?: string;
      generatesAlert?: boolean;
      alertWhen?: AnamnesisQuestionRecord['alertWhen'];
      alertName?: string;
    }>,
  ): Promise<void> {
    const now = new Date();

    for (const question of questions) {
      const index = this.questions.findIndex((item) => item.id === question.id);
      const record: AnamnesisQuestionRecord = {
        id: question.id,
        storeId,
        templateId: null,
        text: question.text,
        type: question.type,
        scope: 'clinic',
        auxiliaryText: question.auxiliaryText,
        generatesAlert: question.generatesAlert ?? false,
        alertWhen: question.alertWhen,
        alertName: question.alertName,
        createdAt: index >= 0 ? this.questions[index].createdAt : now,
        updatedAt: now,
      };

      if (index >= 0) {
        this.questions[index] = record;
      } else {
        this.questions.push(record);
      }
    }
  }

  getAll(): AnamnesisQuestionRecord[] {
    return [...this.questions];
  }

  clear(): void {
    this.questions = [];
  }
}
