/// Operação do caixa que pode exigir autorização de supervisor.
///
/// Só as quatro que a alçada cobre. Não é "toda ação do PDV": vender, abrir
/// caixa e fechar caixa não entram porque não são exceção — são o trabalho.
enum PosOperation {
  /// Desconto no item ou na venda. Compara **percentual**.
  discount,

  /// Retirada de dinheiro da gaveta. Compara **centavos**.
  withdrawal,

  /// Cancelar venda já concluída. Liga/desliga, sem valor de corte.
  cancellation,

  /// Devolver itens de venda anterior. Liga/desliga, sem valor de corte.
  refund,
}

extension PosOperationLabel on PosOperation {
  /// Como a operação é nomeada para o operador — usado no diálogo de
  /// autorização, que precisa dizer *o que* está sendo autorizado.
  String get label => switch (this) {
    PosOperation.discount => 'Desconto',
    PosOperation.withdrawal => 'Sangria',
    PosOperation.cancellation => 'Cancelamento de venda',
    PosOperation.refund => 'Devolução',
  };
}

/// Até onde o operador de caixa vai sozinho.
///
/// **A regra mora aqui, não nas telas.** Três telas diferentes fazem a mesma
/// pergunta ("preciso de supervisor?"), e a resposta espalhada em `if` de
/// widget é a forma clássica de uma delas divergir — quase sempre a menos
/// visitada, que é justamente onde o furo interessa a quem quer burlar.
///
/// **O limite é da organização, nunca do terminal.** Vem de
/// `GET /v1/pos/policy`, e o dispositivo não tem como sobrepor: alçada
/// configurável por caixa seria contornável escolhendo o mais frouxo.
class PosPolicy {
  const PosPolicy({
    this.discountSupervisorAbovePercent = 10,
    this.withdrawalSupervisorAboveCents = 50000,
    this.cancellationRequiresSupervisor = true,
    this.refundRequiresSupervisor = true,
    this.updatedAt,
  });

  /// Desconto **acima** disto exige supervisor. `100` = nunca exige.
  final int discountSupervisorAbovePercent;

  /// Sangria **acima** disto exige supervisor. `0` = sempre exige.
  final int withdrawalSupervisorAboveCents;

  final bool cancellationRequiresSupervisor;
  final bool refundRequiresSupervisor;

  /// Quando o servidor gravou esta versão. `null` = nunca sincronizou (o
  /// terminal está usando [restrictive]).
  final DateTime? updatedAt;

  /// O que vale antes da primeira sincronização.
  ///
  /// Iguala os defaults da API de propósito. E é restritiva pelo mesmo motivo
  /// que lá: um terminal que ainda não falou com o servidor não pode ser o
  /// terminal onde tudo é permitido — seria o caminho mais fácil para operar
  /// sem alçada, bastando não deixar sincronizar.
  static const PosPolicy restrictive = PosPolicy();

  /// Limite é **exclusivo**: com o corte em 10%, um desconto de exatamente 10%
  /// passa. "Sem supervisor até 10%" é como o lojista lê o campo, e um caixa
  /// pedindo gerente no valor que a tela diz ser permitido vira chamado.
  bool requiresSupervisorForDiscount(num percent) =>
      percent > discountSupervisorAbovePercent;

  bool requiresSupervisorForWithdrawal(int cents) =>
      cents > withdrawalSupervisorAboveCents;

  /// Ponto único de decisão. [amount] é percentual para [PosOperation.discount]
  /// e centavos para [PosOperation.withdrawal]; as outras duas ignoram.
  bool requiresSupervisor(PosOperation operation, {num amount = 0}) {
    return switch (operation) {
      PosOperation.discount => requiresSupervisorForDiscount(amount),
      PosOperation.withdrawal => requiresSupervisorForWithdrawal(
        amount.round(),
      ),
      PosOperation.cancellation => cancellationRequiresSupervisor,
      PosOperation.refund => refundRequiresSupervisor,
    };
  }

  /// Se a operação fica **bloqueada sem rede**, mesmo com o supervisor ao lado.
  ///
  /// ⚠️ É escolha de política, não limitação técnica. Com o cache offline o PIN
  /// do supervisor *poderia* ser conferido sem rede. O bloqueio existe porque
  /// uma exceção feita offline não pode ser conferida contra o estado do
  /// servidor no momento em que acontece — e é justamente a operação sem
  /// testemunha que se quer evitar.
  ///
  /// Vender, abrir caixa, sangrar dentro do limite e fechar o caixa **não**
  /// entram: bloquear o trabalho normal por falta de link transformaria uma
  /// queda de rede em loja fechada.
  bool blockedOffline(PosOperation operation, {num amount = 0}) {
    return switch (operation) {
      // Cancelamento e devolução desfazem dinheiro já registrado. Se a alçada
      // nem exige supervisor para elas, não há exceção a conferir — e aí
      // também não há por que bloquear.
      PosOperation.cancellation => cancellationRequiresSupervisor,
      PosOperation.refund => refundRequiresSupervisor,
      // Desconto e sangria só travam **acima do limite**: dentro da alçada são
      // trabalho de rotina, e o operador pode fazê-los sozinho de qualquer
      // forma.
      PosOperation.discount ||
      PosOperation.withdrawal => requiresSupervisor(operation, amount: amount),
    };
  }

  /// De `GET /v1/pos/policy` e do cache local — mesmo formato nos dois.
  ///
  /// Todo campo tem default: uma resposta de servidor mais novo com campo a
  /// mais não pode derrubar o caixa, e um campo a menos cai no valor
  /// restritivo, não no permissivo.
  static PosPolicy fromJson(Map<String, dynamic> json) {
    return PosPolicy(
      discountSupervisorAbovePercent:
          (json['discountSupervisorAbovePercent'] as num?)?.toInt() ??
          restrictive.discountSupervisorAbovePercent,
      withdrawalSupervisorAboveCents:
          (json['withdrawalSupervisorAboveCents'] as num?)?.toInt() ??
          restrictive.withdrawalSupervisorAboveCents,
      cancellationRequiresSupervisor:
          (json['cancellationRequiresSupervisor'] as bool?) ?? true,
      refundRequiresSupervisor:
          (json['refundRequiresSupervisor'] as bool?) ?? true,
      updatedAt: DateTime.tryParse((json['updatedAt'] as String?) ?? ''),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
    'discountSupervisorAbovePercent': discountSupervisorAbovePercent,
    'withdrawalSupervisorAboveCents': withdrawalSupervisorAboveCents,
    'cancellationRequiresSupervisor': cancellationRequiresSupervisor,
    'refundRequiresSupervisor': refundRequiresSupervisor,
    if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
  };
}
