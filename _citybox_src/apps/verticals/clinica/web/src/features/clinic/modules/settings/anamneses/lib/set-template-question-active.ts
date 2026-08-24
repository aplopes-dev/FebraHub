import type { ClinicAnamnesisTemplateQuestionRef } from '../types/clinic-anamnesis';

/**
 * Ativa/desativa uma pergunta **sem reordenar** — a posição na lista
 * permanece enquanto o sheet está aberto; a numeração (só ativas) se recalcula.
 * A consolidação ativas → topo / desativadas → fim ocorre só no save
 * (`partitionTemplateQuestionsByActive`).
 */
export function setTemplateQuestionActive(
  refs: ClinicAnamnesisTemplateQuestionRef[],
  questionId: string,
  active: boolean,
): ClinicAnamnesisTemplateQuestionRef[] {
  return refs.map((ref) =>
    ref.questionId === questionId ? { ...ref, active } : { ...ref },
  );
}

/**
 * Consolida a ordem persistida: ativas primeiro (ordem relativa mantida),
 * depois desativadas (ordem relativa mantida).
 */
export function partitionTemplateQuestionsByActive(
  refs: ClinicAnamnesisTemplateQuestionRef[],
): ClinicAnamnesisTemplateQuestionRef[] {
  const active: ClinicAnamnesisTemplateQuestionRef[] = [];
  const inactive: ClinicAnamnesisTemplateQuestionRef[] = [];

  for (const ref of refs) {
    const copy = { ...ref };
    if (copy.active) {
      active.push(copy);
    } else {
      inactive.push(copy);
    }
  }

  return [...active, ...inactive];
}
