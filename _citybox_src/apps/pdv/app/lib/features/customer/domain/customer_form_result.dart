import 'package:citybox_pdv/features/customer/domain/customer.dart';

/// Resultado da tela de cadastro/edição de cliente.
class CustomerFormResult {
  const CustomerFormResult({required this.customer, required this.select});

  final Customer customer;

  /// `true` = Salvar e selecionar; `false` = só Salvar.
  final bool select;
}
