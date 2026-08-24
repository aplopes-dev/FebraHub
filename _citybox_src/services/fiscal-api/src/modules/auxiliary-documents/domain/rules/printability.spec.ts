import {
  FISCAL_DOCUMENT_STATUSES,
  type FiscalDocumentStatus,
} from '../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { isPrintable, isCancelledStatus } from './printability';

/// Tabela da spec (data-model.md "Quando o documento é entregue", FR-003).
///
/// Escrita como mapa EXPLÍCITO de todos os estados, e não como lista dos que
/// imprimem, de propósito: quando alguém acrescentar um `FiscalDocumentStatus`
/// novo, o teste de exaustividade abaixo quebra e força uma decisão. Uma lista
/// de permitidos deixaria o estado novo cair silenciosamente em "não imprime",
/// que pode ser a resposta errada.
const EXPECTED: Record<FiscalDocumentStatus, boolean> = {
  AUTHORIZED: true,
  /// A nota segue autorizada — a carta de correção não a invalida.
  CORRECTION_LETTER_AUTHORIZED: true,
  /// Cancelamento pedido mas ainda não confirmado pelo órgão: a nota vale, e
  /// recusar aqui deixaria mercadoria sem documento durante a janela.
  CANCEL_REQUESTED: true,
  /// FR-006 — entregue MARCADA como cancelada, não recusada: o histórico
  /// precisa ser reconstituível.
  CANCEL_AUTHORIZED: true,
  /// O órgão RECUSOU o cancelamento — a nota segue autorizada e valendo, então
  /// imprime normalmente, sem marca de cancelamento. (Estado que faltava na
  /// tabela original de data-model.md; corrigido lá também.)
  CANCEL_REJECTED: true,

  DRAFT: false,
  VALIDATING: false,
  NUMBER_RESERVED: false,
  XML_GENERATED: false,
  SIGNED: false,
  SENT: false,
  PROCESSING: false,
  REJECTED: false,
  DENIED: false,
  INUTILIZED: false,
  ERROR: false,
  SYNC_REQUIRED: false,
};

describe('printability', () => {
  describe('isPrintable', () => {
    it.each(FISCAL_DOCUMENT_STATUSES)(
      'decide corretamente para o estado %s',
      (status) => {
        expect(isPrintable(status)).toBe(EXPECTED[status]);
      },
    );

    it('cobre todos os estados existentes sem sobra nem falta', () => {
      // Guarda de exaustividade: um estado novo no enum sem entrada em
      // EXPECTED quebra aqui, antes de virar comportamento não decidido.
      expect(Object.keys(EXPECTED).sort()).toEqual(
        [...FISCAL_DOCUMENT_STATUSES].sort(),
      );
    });

    it('nao imprime nota rejeitada — nao existe documento auxiliar dela', () => {
      expect(isPrintable('REJECTED')).toBe(false);
    });

    it('imprime nota cancelada, porque o historico precisa ser reconstituivel', () => {
      expect(isPrintable('CANCEL_AUTHORIZED')).toBe(true);
    });
  });

  describe('isCancelledStatus', () => {
    it('considera cancelada apenas a nota com cancelamento AUTORIZADO', () => {
      expect(isCancelledStatus('CANCEL_AUTHORIZED')).toBe(true);
    });

    it('nao considera cancelada a nota com cancelamento apenas SOLICITADO', () => {
      // O órgão ainda não confirmou. Marcar como cancelada aqui produziria um
      // documento dizendo que a nota não vale enquanto ela ainda vale.
      expect(isCancelledStatus('CANCEL_REQUESTED')).toBe(false);
    });

    it('nao considera cancelada a nota com cancelamento REJEITADO', () => {
      // O cancelamento foi recusado: a nota segue autorizada no órgão.
      expect(isCancelledStatus('CANCEL_REJECTED')).toBe(false);
    });

    it('nao considera cancelada uma nota autorizada', () => {
      expect(isCancelledStatus('AUTHORIZED')).toBe(false);
    });
  });
});
