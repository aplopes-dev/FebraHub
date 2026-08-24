import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/expected_drawer.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';

/// Canais conferidos no fechamento de caixa.
///
/// São as cinco linhas da tela de fechamento — e não a lista de formas de
/// pagamento: o operador não confere "iFOOD" e "ANOTA AI" separadamente, ele
/// confere a gaveta, as duas funções do cartão, o voucher e o resto. Agrupar
/// aqui é o que permite comparar o declarado com o que o turno registrou.
enum CashCloseChannel { cash, credit, debit, voucher, other }

extension CashCloseChannelLabel on CashCloseChannel {
  String get label => switch (this) {
    CashCloseChannel.cash => 'Dinheiro',
    CashCloseChannel.credit => 'Cartão de Crédito',
    CashCloseChannel.debit => 'Cartão de Débito',
    CashCloseChannel.voucher => 'Voucher',
    CashCloseChannel.other => 'Outros',
  };
}

/// Em que canal cai cada forma de pagamento.
///
/// Aceita `systemKey` do ERP (`pm-dinheiro`, …) ou ids legados do fixture
/// (`cash`, `credit_card`, …). Forma desconhecida → [CashCloseChannel.other].
CashCloseChannel channelOfPaymentMethod(String methodIdOrSystemKey) =>
    switch (methodIdOrSystemKey) {
      'cash' || 'pm-dinheiro' => CashCloseChannel.cash,
      'credit_card' || 'pm-cartao' => CashCloseChannel.credit,
      'debit_card' || 'pm-cartao-debito' => CashCloseChannel.debit,
      'employee_voucher' ||
      'pm-vale-funcionario' ||
      'pm-vale-alimentacao' ||
      'pm-vale-refeicao' ||
      'pm-vale-presente' => CashCloseChannel.voucher,
      _ => CashCloseChannel.other,
    };

/// Quanto o turno registrou em cada canal.
///
/// **Dinheiro é a gaveta**, não a soma dos pagamentos em dinheiro: entram o
/// fundo de abertura e os reforços, saem as sangrias e o troco devolvido — é
/// `expectedDrawerCents`. Os demais canais são a soma dos pagamentos das
/// vendas concluídas, porque nada disso passa pela gaveta.
///
/// Venda cancelada não conta em canal nenhum.
Map<CashCloseChannel, int> expectedByChannel(CashShift shift) {
  final Map<CashCloseChannel, int> totals = <CashCloseChannel, int>{
    for (final CashCloseChannel channel in CashCloseChannel.values) channel: 0,
  };
  totals[CashCloseChannel.cash] = expectedDrawerCents(shift);

  for (final SaleRecord sale in shift.sales) {
    if (sale.status != SaleRecordStatus.completed) continue;
    for (final SalePaymentSnapshot payment in sale.payments) {
      final CashCloseChannel channel = channelOfPaymentMethod(
        payment.systemKey ?? payment.methodId,
      );
      // Dinheiro já está contabilizado na gaveta; somar de novo dobraria.
      if (channel == CashCloseChannel.cash) continue;
      totals[channel] = totals[channel]! + payment.amountCents;
    }
  }
  return totals;
}
