import type { StatusCheck, StatusWindowKey } from './status-check.entity';

/// Entrada a persistir a cada contato real com o órgão.
export type SaveStatusCheckInput = StatusCheck;

/// Visão transacional entregue dentro de `withWindowLock`, já sob o lock e
/// vinculada à chave de janela. `findLatest` e `save` aqui rodam na **mesma**
/// transação do lock — é isso que faz o double-check enxergar a gravação do
/// detentor anterior (ver `withWindowLock`).
export type LockedStatusWindow = {
  findLatest(): Promise<StatusCheck | null>;
  save(input: SaveStatusCheckInput): Promise<StatusCheck>;
};

/// Porta de persistência da verificação de disponibilidade (FR-007 cache,
/// FR-013 auditoria). Implementação concreta em `infrastructure/`.
export abstract class StatusCheckRepository {
  /// Última verificação conhecida para a chave, ou `null` se nunca houve. Fora
  /// de lock — o caminho rápido do cache (FR-007) que não precisa serializar.
  abstract findLatest(key: StatusWindowKey): Promise<StatusCheck | null>;

  /// Serializa a seção crítica "checar frescor → contatar órgão → gravar" por
  /// chave de janela (FR-007b), para que N consultas simultâneas com janela
  /// vencida resultem em **um** contato ao órgão.
  ///
  /// A implementação pega um lock consultivo por `(empresa, modelo, ambiente)`
  /// numa transação, e passa a `fn` uma `LockedStatusWindow` ligada a essa
  /// transação. `fn` deve, **já sob o lock**, re-checar `findLatest()`
  /// (double-check) e só contatar o órgão se ainda estiver vencido — depois
  /// `save()`. O `save` roda na transação do lock, então commita antes de o
  /// lock ser liberado; o próximo a entrar vê o dado fresco.
  ///
  /// Padrão que a fila de contingência provou necessário: verificar-e-agir sem
  /// lock **não** serializa em READ COMMITTED.
  abstract withWindowLock<T>(
    key: StatusWindowKey,
    fn: (locked: LockedStatusWindow) => Promise<T>,
  ): Promise<T>;
}
