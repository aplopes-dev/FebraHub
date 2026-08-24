import { randomUUID } from 'crypto';
import type {
  CustomQuestionInput,
  SaveTemplateInput,
  TemplateAggregate,
  TemplateQuestionRef,
} from '../dtos/anamnesis.dto';
import { QuestionNotFoundError } from '../../domain/errors/question-not-found.error';
import { InvalidAnamnesisQuestionError } from '../../domain/errors/invalid-anamnesis-question.error';
import {
  validateCustomQuestionInput,
  normalizeAlertWhen,
} from '../../domain/validators/anamnesis-question.validator';
import { AnamnesisQuestionRepository } from '../../domain/repositories/anamnesis.repository.interface';
import { mergeTemplateWithLibrary } from './merge-template-with-library';

function isClientGeneratedQuestionRef(id: string): boolean {
  return id.startsWith('q-custom-');
}

/**
 * Alinha refs `q-custom-*` do template com os IDs resolvidos das perguntas custom
 * (quando o cliente omitiu `id` no body mas manteve a ref temporária).
 */
function remapTemplateQuestionRefs(
  input: SaveTemplateInput,
  customQuestions: TemplateAggregate['customQuestions'],
): TemplateQuestionRef[] {
  const idRemap = new Map<string, string>();
  const customIds = new Set(customQuestions.map((question) => question.id));

  for (let index = 0; index < input.customQuestions.length; index++) {
    const inputId = input.customQuestions[index]?.id?.trim();
    if (inputId) {
      idRemap.set(inputId, customQuestions[index].id);
    }
  }

  const orphanRefs = [
    ...new Set(
      input.templateQuestions
        .map((item) => item.questionId)
        .filter((id) => !customIds.has(id) && isClientGeneratedQuestionRef(id)),
    ),
  ];

  for (const refId of orphanRefs) {
    const inputIndex = input.customQuestions.findIndex(
      (question) => question.id?.trim() === refId,
    );
    if (inputIndex >= 0) {
      const resolvedId = customQuestions[inputIndex].id;
      idRemap.set(refId, resolvedId);
      customIds.add(resolvedId);
    }
  }

  const unresolvedOrphanRefs = orphanRefs.filter(
    (refId) => !idRemap.has(refId),
  );

  const customIndicesWithoutId = input.customQuestions
    .map((question, index) => (!question.id?.trim() ? index : -1))
    .filter((index) => index >= 0);

  if (unresolvedOrphanRefs.length > 0) {
    if (unresolvedOrphanRefs.length !== customIndicesWithoutId.length) {
      throw new QuestionNotFoundError(
        'remapTemplateQuestionRefs',
        unresolvedOrphanRefs[0],
      );
    }

    unresolvedOrphanRefs.forEach((refId, index) => {
      const resolvedId = customQuestions[customIndicesWithoutId[index]].id;
      idRemap.set(refId, resolvedId);
      customIds.add(resolvedId);
    });
  }

  return input.templateQuestions.map((item) => ({
    questionId: idRemap.get(item.questionId) ?? item.questionId,
    active: item.active,
  }));
}

export async function validateTemplatePayload(
  input: SaveTemplateInput,
  questionRepository: AnamnesisQuestionRepository,
  context: string,
): Promise<{
  templateQuestions: TemplateQuestionRef[];
  customQuestions: TemplateAggregate['customQuestions'];
}> {
  const name = input.name.trim();
  if (!name) {
    throw new InvalidAnamnesisQuestionError(
      context,
      'Nome do modelo é obrigatório',
    );
  }

  const customQuestions = input.customQuestions.map(
    (question: CustomQuestionInput) => {
      validateCustomQuestionInput(question, context);
      const generatesAlert = question.generatesAlert ?? false;
      const options =
        question.type === 'single_choice'
          ? (question.options ?? []).filter(
              (option) => option.value.trim() && option.label.trim(),
            )
          : undefined;
      return {
        id: question.id?.trim() || randomUUID(),
        text: question.text.trim(),
        type: question.type,
        scope: 'clinic' as const,
        auxiliaryText: question.auxiliaryText?.trim() || undefined,
        ...(options && options.length > 0 ? { options } : {}),
        generatesAlert,
        alertWhen: normalizeAlertWhen(
          question.type,
          generatesAlert,
          question.alertWhen,
        ),
        alertName:
          generatesAlert && question.alertName?.trim()
            ? question.alertName.trim()
            : undefined,
      };
    },
  );

  const templateQuestions = remapTemplateQuestionRefs(input, customQuestions);
  const customIds = new Set(customQuestions.map((question) => question.id));
  const externalIds = templateQuestions
    .map((item) => item.questionId)
    .filter((id) => !customIds.has(id));

  if (externalIds.length > 0) {
    const accessible = await questionRepository.findAccessibleByIds(
      input.storeId,
      externalIds,
    );
    const accessibleIds = new Set(accessible.map((question) => question.id));
    const missing = externalIds.filter((id) => !accessibleIds.has(id));
    if (missing.length > 0) {
      throw new QuestionNotFoundError(context, missing[0]);
    }
  }

  const library = await questionRepository.findLibrary(input.storeId);
  const mergedTemplateQuestions = mergeTemplateWithLibrary(
    library,
    templateQuestions,
    customQuestions,
  );

  return { templateQuestions: mergedTemplateQuestions, customQuestions };
}
