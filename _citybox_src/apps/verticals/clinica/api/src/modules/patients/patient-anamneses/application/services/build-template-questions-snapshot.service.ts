import { Injectable } from '@nestjs/common';
import { FindTemplateByIdUseCase } from '../../../../anamnesis/application/use-cases/find-template-by-id/find-template-by-id.use-case';
import { ListQuestionsUseCase } from '../../../../anamnesis/application/use-cases/list-questions/list-questions.use-case';
import { TemplateNotFoundError } from '../../../../anamnesis/domain/errors/template-not-found.error';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type { PatientAnamnesisQuestionSnapshot } from '../../domain/entities/patient-anamnesis.entity';
import {
  getFormQuestionsForValidation,
  resolveActiveTemplateQuestions,
  toQuestionSnapshots,
  type ResolvedQuestion,
} from '../utils/resolve-template-questions';

export type TemplateQuestionsSnapshotResult = {
  templateName: string;
  questionsSnapshot: PatientAnamnesisQuestionSnapshot[];
  formQuestions: ResolvedQuestion[];
};

@Injectable()
export class BuildTemplateQuestionsSnapshotService {
  constructor(
    private readonly findTemplateById: FindTemplateByIdUseCase,
    private readonly listQuestions: ListQuestionsUseCase,
  ) {}

  async execute(
    context: string,
    storeId: string,
    templateId: string,
  ): Promise<TemplateQuestionsSnapshotResult> {
    const template = await this.findTemplateById.execute({
      storeId,
      id: templateId,
    });
    if (!template) {
      throw new TemplateNotFoundError(context, templateId);
    }

    if (template.status !== 'active') {
      throw new ValidatorDomainError({
        internalMessage: `Anamnesis template is inactive: ${templateId}`,
        externalMessage: 'O modelo de anamnese selecionado está inativo',
        context,
      });
    }

    const library = await this.listQuestions.execute({ storeId });
    const libraryQuestions: ResolvedQuestion[] = library.map((question) => ({
      id: question.id,
      text: question.text,
      type: question.type,
      ...(question.auxiliaryText
        ? { auxiliaryText: question.auxiliaryText }
        : {}),
      ...(question.options && question.options.length > 0
        ? { options: question.options }
        : {}),
      ...(question.generatesAlert ? { generatesAlert: true } : {}),
      ...(question.alertWhen ? { alertWhen: question.alertWhen } : {}),
      ...(question.alertName ? { alertName: question.alertName } : {}),
    }));

    const customQuestions: ResolvedQuestion[] = template.customQuestions.map(
      (question) => ({
        id: question.id,
        text: question.text,
        type: question.type,
        ...(question.auxiliaryText
          ? { auxiliaryText: question.auxiliaryText }
          : {}),
        ...(question.options && question.options.length > 0
          ? { options: question.options }
          : {}),
        ...(question.generatesAlert ? { generatesAlert: true } : {}),
        ...(question.alertWhen ? { alertWhen: question.alertWhen } : {}),
        ...(question.alertName ? { alertName: question.alertName } : {}),
      }),
    );

    const activeQuestions = resolveActiveTemplateQuestions(
      template.templateQuestions,
      customQuestions,
      libraryQuestions,
    );

    return {
      templateName: template.name,
      questionsSnapshot: toQuestionSnapshots(activeQuestions),
      formQuestions: getFormQuestionsForValidation(activeQuestions),
    };
  }
}
