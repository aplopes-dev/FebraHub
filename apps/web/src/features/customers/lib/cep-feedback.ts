const MANUAL_SUFFIX = "Preencha o endereço manualmente.";

export function buildCepFeedbackMessage(apiMessage: string): string {
  const trimmed = apiMessage.trim();
  if (!trimmed) return `Não foi possível consultar o CEP. ${MANUAL_SUFFIX}`;
  if (trimmed.toLowerCase().includes("manualmente")) return trimmed;
  return `${trimmed} ${MANUAL_SUFFIX}`;
}
