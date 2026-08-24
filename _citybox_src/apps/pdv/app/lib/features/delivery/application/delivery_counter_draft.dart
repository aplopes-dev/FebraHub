import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/customer/domain/customer_address.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

/// Cabeçalho do delivery montado no Balcão **antes** de existir no ERP/Kanban.
///
/// O pedido remoto só nasce em [SalonController.commitDeliveryDraft]
/// (Salvar e voltar / Pagar agora). Voltar sem commit descarta o rascunho.
class DeliveryCounterDraft {
  const DeliveryCounterDraft({
    required this.accountId,
    required this.fulfillment,
    required this.addressText,
    required this.address,
    required this.feeCents,
    this.customerId,
    this.customerName,
    this.courierId,
    this.courierName,
  });

  final String accountId;
  final DeliveryFulfillment fulfillment;
  final String addressText;
  final CustomerAddress address;
  final int feeCents;
  final String? customerId;
  final String? customerName;
  final String? courierId;
  final String? courierName;

  DeliveryCounterDraft copyWith({
    String? accountId,
    DeliveryFulfillment? fulfillment,
    String? addressText,
    CustomerAddress? address,
    int? feeCents,
    String? customerId,
    String? customerName,
    String? courierId,
    String? courierName,
  }) {
    return DeliveryCounterDraft(
      accountId: accountId ?? this.accountId,
      fulfillment: fulfillment ?? this.fulfillment,
      addressText: addressText ?? this.addressText,
      address: address ?? this.address,
      feeCents: feeCents ?? this.feeCents,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      courierId: courierId ?? this.courierId,
      courierName: courierName ?? this.courierName,
    );
  }
}

final StateProvider<DeliveryCounterDraft?> deliveryCounterDraftProvider =
    StateProvider<DeliveryCounterDraft?>((Ref ref) => null);

/// Conta local de montagem: origem delivery sem `deliveryOrderId` remoto.
bool isUncommittedDeliveryAccount(SalonAccount? account) {
  return account != null &&
      account.origin == SalonOrigin.delivery &&
      (account.deliveryOrderId == null || account.deliveryOrderId!.isEmpty);
}
