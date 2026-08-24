import { Injectable } from '@nestjs/common';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import {
  isHtmlFilled,
  selectedChoiceAllowsOther,
} from '../../../../anamnesis/domain/anamnesis-question-options';
import type {
  PatientAnamnesisAnswer,
  PatientAnamnesisFillingMode,
  PatientAnamnesisQuestionSnapshot,
} from '../../domain/entities/patient-anamnesis.entity';
import type { ResolvedQuestion } from '../utils/resolve-template-questions';

function requiresTriStateAnswer(
  question: ResolvedQuestion | PatientAnamnesisQuestionSnapshot,
): boolean {
  return (
    question.type === 'yes_no_unknown' ||
    question.type === 'yes_no_unknown_text' ||
    question.type === 'left_right_unknown'
  );
}

function isAnswerComplete(
  question: PatientAnamnesisQuestionSnapshot,
  answer: PatientAnamnesisAnswer | undefined,
): boolean {
  if (!answer) {
    return false;
  }

  if (question.type === 'text') {
    return Boolean(answer.text?.trim());
  }

  if (question.type === 'rich_text') {
    return isHtmlFilled(answer.text);
  }

  if (question.type === 'left_right_unknown') {
    return Boolean(answer.lateral);
  }

  if (question.type === 'yes_no_unknown') {
    return Boolean(answer.triState);
  }

  if (question.type === 'yes_no_unknown_text') {
    if (!answer.triState) {
      return false;
    }

    if (answer.triState === 'yes') {
      return Boolean(answer.auxiliaryText?.trim());
    }

    return true;
  }

  if (question.type === 'single_choice') {
    if (!answer.choiceValue?.trim()) {
      return false;
    }

    const validValues = new Set(
      (question.options ?? []).map((o) => o.value),
    );
    if (validValues.size > 0 && !validValues.has(answer.choiceValue)) {
      return false;
    }

    if (selectedChoiceAllowsOther(question.options, answer.choiceValue)) {
      return Boolean(answer.auxiliaryText?.trim());
    }

    return true;
  }

  return false;
}

@Injectable()
export class ValidatePatientAnamnesisAnswersService {
  validateProfessionalCreate(
    context: string,
    consultationReason: string | undefined,
    answers: PatientAnamnesisAnswer[] | undefined,
    formQuestions: ResolvedQuestion[],
  ): PatientAnamnesisAnswer[] {
    if (!consultationReason || !isHtmlFilled(consultationReason)) {
      throw new ValidatorDomainError({
        internalMessage:
          'consultationReason is required for professional filling',
        externalMessage: 'Informe o motivo da consulta',
        context,
      });
    }

    const answersByQuestionId = new Map(
      (answers ?? []).map((answer) => [answer.questionId, answer]),
    );

    for (const question of formQuestions) {
      const answer = answersByQuestionId.get(question.id);

      if (question.type === 'text' && !answer?.text?.trim()) {
        throw new ValidatorDomainError({
          internalMessage: `Missing text answer for question ${question.id}`,
          externalMessage: 'Preencha todas as perguntas obrigatórias',
          context,
        });
      }

      if (question.type === 'rich_text' && !isHtmlFilled(answer?.text)) {
        throw new ValidatorDomainError({
          internalMessage: `Missing rich text answer for question ${question.id}`,
          externalMessage: 'Preencha todas as perguntas obrigatórias',
          context,
        });
      }

      if (question.type === 'single_choice') {
        if (!answer?.choiceValue?.trim()) {
          throw new ValidatorDomainError({
            internalMessage: `Missing choice for question ${question.id}`,
            externalMessage: 'Preencha todas as perguntas obrigatórias',
            context,
          });
        }

        const validValues = new Set(
          (question.options ?? []).map((option) => option.value),
        );
        if (!validValues.has(answer.choiceValue)) {
          throw new ValidatorDomainError({
            internalMessage: `Invalid choice for question ${question.id}`,
            externalMessage: 'Selecione uma opção válida',
            context,
          });
        }

        if (
          selectedChoiceAllowsOther(question.options, answer.choiceValue) &&
          !answer.auxiliaryText?.trim()
        ) {
          throw new ValidatorDomainError({
            internalMessage: `Missing other text for question ${question.id}`,
            externalMessage: 'Descreva a resposta',
            context,
          });
        }
      }

      if (requiresTriStateAnswer(question)) {
        if (question.type === 'left_right_unknown') {
          if (!answer?.lateral) {
            throw new ValidatorDomainError({
              internalMessage: `Missing lateral answer for question ${question.id}`,
              externalMessage: 'Preencha todas as perguntas obrigatórias',
              context,
            });
          }
          continue;
        }

        if (!answer?.triState) {
          throw new ValidatorDomainError({
            internalMessage: `Missing tri-state answer for question ${question.id}`,
            externalMessage: 'Preencha todas as perguntas obrigatórias',
            context,
          });
        }

        if (
          question.type === 'yes_no_unknown_text' &&
          answer.triState === 'yes' &&
          !answer.auxiliaryText?.trim()
        ) {
          throw new ValidatorDomainError({
            internalMessage: `Missing auxiliary text for question ${question.id}`,
            externalMessage: 'Descreva a resposta',
            context,
          });
        }
      }
    }

    return this.buildAnswersList(
      consultationReason,
      answers ?? [],
      formQuestions,
    );
  }

  validatePublicSubmit(
    context: string,
    questionsSnapshot: PatientAnamnesisQuestionSnapshot[],
    answers: PatientAnamnesisAnswer[],
  ): { answers: PatientAnamnesisAnswer[]; consultationReason: string | null } {
    const publicQuestions = [
      {
        id: 'consultation-reason',
        text: 'Qual o motivo da sua consulta?',
        type: 'text' as const,
      },
      ...questionsSnapshot.filter(
        (question) => !/queixa\s+principal/i.test(question.text.trim()),
      ),
    ];

    const answersByQuestionId = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );

    for (const question of publicQuestions) {
      if (!isAnswerComplete(question, answersByQuestionId.get(question.id))) {
        throw new ValidatorDomainError({
          internalMessage: `Incomplete public answer for question ${question.id}`,
          externalMessage: 'Preencha todas as perguntas antes de enviar',
          context,
        });
      }
    }

    const consultationAnswer = answersByQuestionId.get('consultation-reason');
    const consultationReason = consultationAnswer?.text?.trim() || null;

    const normalizedAnswers = publicQuestions
      .map((question) => answersByQuestionId.get(question.id))
      .filter(
        (answer): answer is PatientAnamnesisAnswer => answer !== undefined,
      );

    return {
      answers: normalizedAnswers,
      consultationReason,
    };
  }

  validateFillingMode(
    context: string,
    fillingMode: PatientAnamnesisFillingMode,
  ): void {
    if (fillingMode !== 'professional' && fillingMode !== 'patient') {
      throw new ValidatorDomainError({
        internalMessage: `Invalid filling mode: ${String(fillingMode)}`,
        externalMessage: 'Tipo de preenchimento inválido',
        context,
      });
    }
  }

  private buildAnswersList(
    consultationReason: string,
    answers: PatientAnamnesisAnswer[],
    formQuestions: ResolvedQuestion[],
  ): PatientAnamnesisAnswer[] {
    const formQuestionIds = new Set(
      formQuestions.map((question) => question.id),
    );
    const filteredAnswers = answers.filter((answer) =>
      formQuestionIds.has(answer.questionId),
    );

    const consultationAnswer: PatientAnamnesisAnswer = {
      questionId: 'consultation-reason',
      text: consultationReason.trim(),
    };

    return [consultationAnswer, ...filteredAnswers];
  }
}
