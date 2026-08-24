'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getEmptyAnswerForQuestion } from '@/features/clinic/modules/patients/lib/patient-anamnesis-form';
import {
  getPublicPatientAnamnesisByToken,
  PublicPatientAnamnesisError,
  submitPublicPatientAnamnesis,
} from '@/features/clinic/modules/patients/services/public-patient-anamnesis.service';
import type {
  PatientAnamnesisAnswer,
  PatientAnamnesisQuestionSnapshot,
} from '@/features/clinic/modules/patients/types/patient-anamnesis';
import type { PublicPatientAnamnesisApiDetail } from '@/features/clinic/modules/patients/types/patient-anamnesis-api';
import type { ClinicAnamnesisQuestion } from '@/features/clinic/modules/settings/anamneses/types/clinic-anamnesis';
import {
  buildPublicAnamnesisAnswersList,
  buildPublicAnamnesisQuestions,
  computePublicAnamnesisProgress,
  isPublicAnamnesisAnswerComplete,
  isPublicAnamnesisLinkExpired,
  PUBLIC_CLINIC_DISPLAY_NAME_FALLBACK,
} from './lib/public-anamnesis-fill-utils';
import { PublicAnamnesisFooter } from './components/public-anamnesis-footer';
import { PublicAnamnesisHeader } from './components/public-anamnesis-header';
import { PublicAnamnesisQuestionCard } from './components/public-anamnesis-question-card';

type PublicAnamnesisFillViewProps = {
  token: string;
};

type PublicAnamnesisFillState = 'loading' | 'not-found' | 'expired' | 'submitted' | 'ready';

function toQuestionFieldModel(question: PatientAnamnesisQuestionSnapshot): ClinicAnamnesisQuestion {
  return {
    ...question,
    scope: 'clinic',
  };
}

function buildInitialAnswers(
  questions: PatientAnamnesisQuestionSnapshot[],
): Record<string, PatientAnamnesisAnswer> {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      getEmptyAnswerForQuestion(toQuestionFieldModel(question)),
    ]),
  );
}

function PublicAnamnesisStatusMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-3 rounded-2xl border border-primary/20 bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-primary">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </main>
  );
}

function resolveFillState(record: PublicPatientAnamnesisApiDetail): PublicAnamnesisFillState {
  if (isPublicAnamnesisLinkExpired(record.linkExpiresAt)) {
    return 'expired';
  }

  if (record.status === 'issued' && record.answers?.length) {
    return 'submitted';
  }

  return 'ready';
}

export function PublicAnamnesisFillView({ token }: PublicAnamnesisFillViewProps) {
  const [fillState, setFillState] = useState<PublicAnamnesisFillState>('loading');
  const [anamnesis, setAnamnesis] = useState<PublicPatientAnamnesisApiDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, PatientAnamnesisAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = useMemo(
    () => buildPublicAnamnesisQuestions(anamnesis?.questionsSnapshot),
    [anamnesis?.questionsSnapshot],
  );

  const progress = useMemo(
    () => computePublicAnamnesisProgress(questions, answers),
    [answers, questions],
  );

  const canSubmit = useMemo(
    () =>
      questions.length > 0 &&
      questions.every((question) => isPublicAnamnesisAnswerComplete(question, answers[question.id])),
    [answers, questions],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const record = await getPublicPatientAnamnesisByToken(token);
        if (cancelled) return;

        const nextState = resolveFillState(record);
        setAnamnesis(record);

        if (nextState === 'ready') {
          const formQuestions = buildPublicAnamnesisQuestions(record.questionsSnapshot);
          setAnswers(buildInitialAnswers(formQuestions));
        }

        setFillState(nextState);
      } catch (error) {
        if (cancelled) return;

        if (error instanceof PublicPatientAnamnesisError) {
          if (error.status === 404) {
            setFillState('not-found');
            return;
          }

          if (error.status === 410) {
            setFillState('expired');
            return;
          }
        }

        setFillState('not-found');
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAnswerChange = useCallback((questionId: string, answer: PatientAnamnesisAnswer) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!anamnesis || !canSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      const answersList = buildPublicAnamnesisAnswersList(answers);
      await submitPublicPatientAnamnesis(token, { answers: answersList });
      setFillState('submitted');
      toast.success('Respostas enviadas com sucesso.');
    } catch (error) {
      if (error instanceof PublicPatientAnamnesisError) {
        if (error.status === 410) {
          setFillState('expired');
          return;
        }

        if (error.status === 409) {
          setFillState('submitted');
          toast.info('Esta anamnese já foi respondida.');
          return;
        }
      }

      toast.error('Não foi possível enviar as respostas. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }, [anamnesis, answers, canSubmit, token]);

  if (fillState === 'loading') {
    return (
      <PublicAnamnesisStatusMessage
        title="Carregando anamnese"
        description="Aguarde um momento…"
      />
    );
  }

  if (fillState === 'not-found') {
    return (
      <PublicAnamnesisStatusMessage
        title="Link não encontrado"
        description="Este link de anamnese não existe ou já foi removido."
      />
    );
  }

  if (fillState === 'expired') {
    return (
      <PublicAnamnesisStatusMessage
        title="Link expirado"
        description="O prazo para preenchimento desta anamnese encerrou. Solicite um novo link à clínica."
      />
    );
  }

  if (fillState === 'submitted') {
    return (
      <PublicAnamnesisStatusMessage
        title="Obrigado!"
        description="Suas respostas foram enviadas com sucesso. A clínica já pode visualizá-las."
      />
    );
  }

  if (!anamnesis) {
    return (
      <PublicAnamnesisStatusMessage
        title="Não foi possível carregar"
        description="Tente novamente em instantes ou entre em contato com a clínica."
      />
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <PublicAnamnesisHeader
        clinicName={
          anamnesis.clinicDisplayName?.trim() || PUBLIC_CLINIC_DISPLAY_NAME_FALLBACK
        }
        patientName={anamnesis.patientName}
        answeredCount={progress.answered}
        totalCount={progress.total}
        percent={progress.percent}
      />

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-5 pb-28">
        {questions.map((question, index) => (
          <PublicAnamnesisQuestionCard
            key={question.id}
            question={question}
            orderNumber={index + 1}
            value={answers[question.id] ?? getEmptyAnswerForQuestion(toQuestionFieldModel(question))}
            onChange={(answer) => handleAnswerChange(question.id, answer)}
          />
        ))}
      </main>

      <PublicAnamnesisFooter
        onSubmit={() => void handleSubmit()}
        isSubmitting={isSubmitting}
        disabled={!canSubmit}
      />
    </div>
  );
}
