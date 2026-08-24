import type { FiscalDocumentType } from '../entities/fiscal-document.entity';

/// Prazo legal para cancelamento de um documento fiscal já autorizado,
/// contado a partir de `authorizedAt` (data-model.md "Validação de
/// transição" — FR-004, US4 cenário 1/2).
///
/// spec.md Assumptions deixa o prazo exato para "a legislação fiscal
/// vigente" sem fixar um número ("sem necessidade de configuração adicional
/// pelo usuário"). Usamos aqui a janela geral de 24h prevista no Ajuste
/// SINIEF 07/05 cláusula terceira (regra estável e pública desde 2005, é a
/// janela padrão aplicada pela maioria das operações de NF-e) como default
/// por `FiscalDocumentType` — não uma escolha arbitrária deste projeto, mas
/// também não uma modelagem completa: há exceções legais para operações
/// específicas (ex.: alguns produtos sujeitos a controle têm prazo distinto)
/// não cobertas aqui — fora do escopo de T063 (ver AGENTS.md, changelog
/// desta entrega).
///
/// NFS-e (Padrão Nacional) ainda não tem cancelamento implementado (T067,
/// deferido) — o valor abaixo já cobre o tipo para quando essa entrega
/// acontecer, seguindo o mesmo texto de tasks.md ("mesma regra de NF-e").
///
/// ⚠️ **A NFC-e é a exceção, e por larga margem.** A janela de cancelamento do
/// cupom é de **30 minutos**, não 24 horas — a operação é de balcão, e o
/// documento circula com o consumidor imediatamente. Copiar o valor da NF-e
/// aqui deixaria cancelar cupom muito além do prazo legal, e a SEFAZ recusaria
/// tarde, depois de o operador achar que deu certo.
///
/// A unidade passou de horas para **minutos** por causa disso: `0.5` hora
/// esconderia a intenção, e a próxima pessoa a mexer leria como arredondamento.
const CANCEL_DEADLINE_MINUTES: Record<FiscalDocumentType, number> = {
  NFE: 24 * 60,
  NFSE: 24 * 60,
  NFCE: 30,
};

export function resolveCancelDeadline(
  documentType: FiscalDocumentType,
  authorizedAt: Date,
): Date {
  const minutes = CANCEL_DEADLINE_MINUTES[documentType];
  return new Date(authorizedAt.getTime() + minutes * 60 * 1000);
}

export function isWithinCancelDeadline(
  documentType: FiscalDocumentType,
  authorizedAt: Date,
  now: Date,
): boolean {
  return (
    now.getTime() <= resolveCancelDeadline(documentType, authorizedAt).getTime()
  );
}
