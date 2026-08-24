/**
 * Mensagem amigável a partir do status HTTP da clinica-api / proxy / nginx.
 * Evita expor códigos crus (ex.: "Erro na API de clínica (413)").
 *
 * 413 costuma vir do nginx (limite de body), não da validação local de 4 MB.
 */
export function resolveClinicaErrorMessage(
  status: number,
  apiMessage?: string,
): string {
  if (apiMessage?.trim()) {
    return apiMessage.trim();
  }

  if (status === 413) {
    return 'Não foi possível enviar o arquivo: ele é muito grande. Use uma imagem de até 4 MB.';
  }

  return `Erro na API de clínica (${status})`;
}
