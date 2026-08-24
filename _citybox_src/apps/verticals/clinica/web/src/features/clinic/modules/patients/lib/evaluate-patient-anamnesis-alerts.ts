import type { PatientAnamnesisAlert } from '../data/mock-patient-anamnesis-alerts';
import type {
  PatientAnamnesisAnswer,
  PatientAnamnesisQuestionSnapshot,
  PatientAnamnesisTriStateAnswer,
} from '../types/patient-anamnesis';

function getAnswerTriState(
  answers: PatientAnamnesisAnswer[],
  questionId: string,
): PatientAnamnesisTriStateAnswer | undefined {
  return answers.find((answer) => answer.questionId === questionId)?.triState;
}

export function evaluatePatientAnamnesisAlerts(
  anamnesisId: string,
  answers: PatientAnamnesisAnswer[],
  questions: PatientAnamnesisQuestionSnapshot[],
): PatientAnamnesisAlert[] {
  const alerts: PatientAnamnesisAlert[] = [];

  for (const question of questions) {
    if (!question.generatesAlert || !question.alertWhen || !question.alertName?.trim()) {
      continue;
    }

    if (question.type === 'text' || question.type === 'left_right_unknown' || question.type === 'rich_text' || question.type === 'single_choice') {
      continue;
    }

    const triState = getAnswerTriState(answers, question.id);
    if (triState !== question.alertWhen) {
      continue;
    }

    alerts.push({
      id: `${anamnesisId}-${question.id}`,
      message: question.alertName.trim(),
    });
  }

  return alerts;
}

export function mergePatientAnamnesisAlerts(
  alertGroups: PatientAnamnesisAlert[][],
): PatientAnamnesisAlert[] {
  const seenMessages = new Set<string>();
  const merged: PatientAnamnesisAlert[] = [];

  for (const group of alertGroups) {
    for (const alert of group) {
      if (seenMessages.has(alert.message)) {
        continue;
      }

      seenMessages.add(alert.message);
      merged.push(alert);
    }
  }

  return merged;
}
