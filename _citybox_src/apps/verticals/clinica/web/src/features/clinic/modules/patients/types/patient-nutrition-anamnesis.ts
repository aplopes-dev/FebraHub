/**
 * Anamnese do fluxo "Inicializar" da nutrição — estrutura própria, gravada no
 * JSON da inicialização. Não usa o módulo de anamneses do paciente: este
 * conteúdo só aparece no card da evolução.
 */
export type PatientNutritionAnamnesisAnswer = {
  /** `value` da opção escolhida no catálogo de perguntas. */
  value: string;
  /** Texto livre — preenchido apenas quando a opção escolhida é "Outro". */
  otherText?: string;
};

export type PatientNutritionAnamnesis = {
  /** HTML do editor de texto rico. */
  chiefComplaint: string;
  /** HTML do editor de texto rico. */
  previousTreatments: string;
  /** Respostas indexadas pelo id da pergunta do catálogo. */
  answers: Record<string, PatientNutritionAnamnesisAnswer>;
  notes: string;
};
