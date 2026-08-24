import type {
  ClinicAnamnesisQuestion,
  ClinicAnamnesisTemplateQuestionRef,
} from '../types/clinic-anamnesis';
import type { ClinicAnamnesisFormData } from '../types/clinic-anamnesis-form';

type FormQuestionSlice = Pick<ClinicAnamnesisFormData, 'templateQuestions' | 'customQuestions'>;

/**
 * Insere a nova pergunta ativa logo após a última ativa — não no fim da lista
 * (onde ficam dezenas de perguntas da biblioteca desativadas).
 * Sem nenhuma ativa, coloca no topo para aparecer sem scroll.
 */
export function insertActiveQuestionRef(
  refs: ClinicAnamnesisTemplateQuestionRef[],
  questionId: string,
): ClinicAnamnesisTemplateQuestionRef[] {
  const newRef: ClinicAnamnesisTemplateQuestionRef = { questionId, active: true };
  let lastActiveIndex = -1;

  for (let index = 0; index < refs.length; index += 1) {
    if (refs[index]?.active) {
      lastActiveIndex = index;
    }
  }

  if (lastActiveIndex < 0) {
    return [newRef, ...refs];
  }

  return [...refs.slice(0, lastActiveIndex + 1), newRef, ...refs.slice(lastActiveIndex + 1)];
}

/**
 * Inclui uma pergunta custom no formulário do modelo, preservando refs
 * existentes (ex.: perguntas da biblioteca já ativadas).
 *
 * Não re-mergeia com biblioteca vazia — isso descartaria refs órfãs e
 * faria `syncLibraryQuestions` reaparecer com `active: false`.
 */
export function appendCustomQuestionToForm(
  current: FormQuestionSlice,
  question: ClinicAnamnesisQuestion,
): FormQuestionSlice {
  const exists = current.templateQuestions.some((item) => item.questionId === question.id);

  const templateQuestions = exists
    ? current.templateQuestions.map((ref) =>
        ref.questionId === question.id ? { ...ref, active: true } : ref,
      )
    : insertActiveQuestionRef(current.templateQuestions, question.id);

  const customExists = current.customQuestions.some((item) => item.id === question.id);

  return {
    templateQuestions,
    customQuestions: customExists
      ? current.customQuestions.map((item) => (item.id === question.id ? question : item))
      : [...current.customQuestions, question],
  };
}
