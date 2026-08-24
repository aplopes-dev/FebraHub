import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/customer/domain/customer.dart';

/// Cliente selecionado para a venda em andamento.
///
/// `null` = consumidor final padrão — a venda sempre tem um rótulo na app bar,
/// mas sem escolha explícita não há cadastro vinculado.
final NotifierProvider<CounterCustomerController, Customer?>
counterCustomerProvider =
    NotifierProvider<CounterCustomerController, Customer?>(
      CounterCustomerController.new,
    );

/// Resolve o cliente do balcão a partir do pedido delivery (CRM ou nome avulso).
///
/// Prefere o cadastro em [catalog] quando o `customerId` bater; senão monta um
/// [Customer] mínimo só com id/nome. Nome avulso (sem CRM) usa `id` vazio —
/// o checkout não envia `customerId` nesse caso.
Customer? resolveCounterCustomerFromDelivery({
  String? customerId,
  String? customerName,
  List<Customer> catalog = const <Customer>[],
}) {
  final String? id = customerId?.trim();
  final String? name = customerName?.trim();
  if (id != null && id.isNotEmpty) {
    for (final Customer item in catalog) {
      if (item.id == id) {
        return item;
      }
    }
    return Customer(
      id: id,
      name: (name == null || name.isEmpty) ? 'Cliente' : name,
    );
  }
  if (name != null && name.isNotEmpty) {
    return Customer(id: '', name: name);
  }
  return null;
}

class CounterCustomerController extends Notifier<Customer?> {
  /// Rótulo quando nenhum cliente do cadastro está selecionado.
  static const String defaultCustomerLabel = 'Consumidor Final - Padrão';

  @override
  Customer? build() => null;

  /// Texto exibido na app bar (nome do cliente ou o padrão).
  static String labelOf(Customer? customer) =>
      customer?.name ?? defaultCustomerLabel;

  void setCustomer(Customer customer) => state = customer;

  void clear() => state = null;

  /// Volta ao consumidor final — chamado ao fechar ou cancelar a venda.
  void reset() => state = null;
}
