import 'package:citybox_pdv/features/customer/domain/customer_address.dart';

/// Texto de endereço no mesmo formato do formulário Novo delivery.
String formatDeliveryAddress(CustomerAddress address) {
  return <String>[
    <String>[
      address.street,
      address.number,
    ].where((String value) => value.isNotEmpty).join(', '),
    address.complement,
    address.district,
    <String>[
      address.city,
      address.state,
    ].where((String value) => value.isNotEmpty).join(' - '),
    if (address.zipCode.isNotEmpty) 'CEP ${address.zipCode}',
  ].where((String value) => value.isNotEmpty).join(' · ');
}
