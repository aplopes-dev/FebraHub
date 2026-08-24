enum CashShiftStatus { open, closed }

enum CashMovementType { withdrawal, reinforcement }

enum SaleRecordStatus { completed, cancelled }

/// Motivo da sangria ou do reforço — o "Tipo de Operação" da tela.
///
/// Enum e não texto livre: é a coluna **Operação** do histórico, e no
/// fechamento do turno o conferente precisa somar "quanto saiu para
/// fornecedor" sem depender de como cada operador escreveu.
enum CashOperationType {
  cashWithdrawal,
  supplierPayment,
  expense,
  bankDeposit,
  changeSupply,
  openingFloat,
  other,
}

extension CashOperationTypeLabel on CashOperationType {
  String get label => switch (this) {
    CashOperationType.cashWithdrawal => 'Retirada do caixa',
    CashOperationType.supplierPayment => 'Pagamento a fornecedor',
    CashOperationType.expense => 'Despesa',
    CashOperationType.bankDeposit => 'Depósito bancário',
    CashOperationType.changeSupply => 'Suprimento de troco',
    CashOperationType.openingFloat => 'Fundo de caixa',
    CashOperationType.other => 'Outros',
  };
}

/// Operações que fazem sentido para cada lado do movimento.
///
/// Dinheiro que **sai** não é suprimento; dinheiro que **entra** não é
/// pagamento a fornecedor. Oferecer as sete em ambos convidaria a classificar
/// errado, e a coluna Operação do histórico deixaria de valer para conferência.
List<CashOperationType> cashOperationsFor(CashMovementType type) {
  return switch (type) {
    CashMovementType.withdrawal => const <CashOperationType>[
      CashOperationType.cashWithdrawal,
      CashOperationType.supplierPayment,
      CashOperationType.expense,
      CashOperationType.bankDeposit,
      CashOperationType.other,
    ],
    CashMovementType.reinforcement => const <CashOperationType>[
      CashOperationType.changeSupply,
      CashOperationType.openingFloat,
      CashOperationType.other,
    ],
  };
}
