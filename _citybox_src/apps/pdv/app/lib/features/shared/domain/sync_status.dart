/// Saúde de um canal que o PDV depende para operar.
enum ChannelHealth {
  /// Funcionando.
  ok,

  /// Respondendo, mas degradado: lento, intermitente, em contingência.
  degraded,

  /// Fora do ar.
  down,
}

/// Estado dos três canais que decidem se o operador pode prometer alguma coisa
/// ao cliente.
///
/// Eles ficam sempre visíveis porque cada um muda o que o caixa pode dizer:
///
/// - **rede caiu** → a venda fica no aparelho; não prometa entrega nem consulta
///   de saldo;
/// - **fiscal fora** → o cupom sai em contingência e precisa ser transmitido
///   depois; não é o mesmo que "deu tudo certo";
/// - **vendas pendentes** → há dinheiro registrado que o servidor ainda não
///   conhece; ninguém deve desligar o terminal nesse estado.
///
/// Enquanto não há integração, isto vem de uma fixture. A forma do model já é a
/// definitiva — o que muda depois é a fonte.
class SyncStatus {
  const SyncStatus({
    required this.network,
    required this.fiscal,
    required this.pendingSales,
    this.offlineCacheExpiresAt,
  });

  /// Conexão com o servidor da plataforma.
  final ChannelHealth network;

  /// Comunicação com a Sefaz (NFC-e / SAT / MFE).
  final ChannelHealth fiscal;

  /// Vendas gravadas no banco local que ainda não subiram.
  final int pendingSales;

  /// Até quando o terminal ainda consegue deixar alguém entrar sem rede.
  ///
  /// `null` = nunca sincronizou; sem rede, ninguém entra. Não é a mesma coisa
  /// que "vencido", e a UI distingue os dois: um se resolve conectando uma
  /// vez, o outro é um terminal que nunca esteve pronto para operar isolado.
  final DateTime? offlineCacheExpiresAt;

  /// `true` quando falta menos de um dia para o cache vencer — o aviso tem que
  /// chegar antes de o caixa descobrir na hora de entrar.
  bool offlineCacheExpiringSoon(DateTime now) {
    final DateTime? expiresAt = offlineCacheExpiresAt;
    if (expiresAt == null) return false;
    if (!now.isBefore(expiresAt)) return false;
    return expiresAt.difference(now) < const Duration(hours: 24);
  }

  bool offlineCacheExpired(DateTime now) {
    final DateTime? expiresAt = offlineCacheExpiresAt;
    return expiresAt != null && !now.isBefore(expiresAt);
  }

  /// Verdadeiro quando há algo que o operador precisa saber antes de encerrar
  /// o turno ou desligar o terminal.
  bool get needsAttention =>
      network != ChannelHealth.ok ||
      fiscal != ChannelHealth.ok ||
      pendingSales > 0;
}
