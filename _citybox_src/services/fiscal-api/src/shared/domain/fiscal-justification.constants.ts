/// Faixa de tamanho da SEFAZ para textos de justificativa (`xJust` de
/// inutilização/cancelamento, `xCorrecao` de carta de correção). Mesma regra
/// já aplicada em `InutilizeNfeHttpDto`/`CancelNfeHttpDto` (`class-validator`)
/// — extraído aqui como constante compartilhada pro campo novo de
/// `Company.inutilizationJustification`/`cancellationJustification` (spec
/// erp/023, N6), pra não duplicar o literal 15/255 uma terceira vez.
export const JUSTIFICATION_MIN_LENGTH = 15;
export const JUSTIFICATION_MAX_LENGTH = 255;
