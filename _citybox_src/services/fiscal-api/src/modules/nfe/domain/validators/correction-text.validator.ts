import { NfeCorrectionFieldNotAllowedError } from '../errors/nfe-correction-field-not-allowed.error';

/// Heurística simples baseada em palavras-chave dos campos que a legislação
/// NÃO permite alterar via carta de correção (Ajuste SINIEF 07/05, cláusula
/// segunda-A — valores, tributos, datas de emissão/saída, quantidades e
/// dados cadastrais das partes/CFOP). Não é uma verificação semântica
/// completa (não substitui revisão humana antes da transmissão) — apenas um
/// guard-rail que bloqueia os casos mais óbvios antes de enviar a CC-e à
/// SEFAZ. Resolve o edge case em aberto do spec.md com um default razoável,
/// documentado aqui e em AGENTS.md (T064).
const NON_CORRECTABLE_KEYWORDS = [
  'valor',
  'preço',
  'preco',
  'quantidade',
  'cnpj',
  'cpf',
  'data de emissão',
  'data de emissao',
  'data de saída',
  'data de saida',
  'imposto',
  'icms',
  'ipi',
  'pis',
  'cofins',
  'destinatário',
  'destinatario',
  'remetente',
  'cfop',
];

export function assertCorrectionTextIsAllowed(
  correctionText: string,
  context: string,
): void {
  const normalized = correctionText.toLowerCase();
  const matched = NON_CORRECTABLE_KEYWORDS.find((keyword) =>
    normalized.includes(keyword),
  );
  if (matched) {
    throw new NfeCorrectionFieldNotAllowedError(context, matched);
  }
}
