import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_category_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_document_type_controller.dart';
import 'package:citybox_pdv/features/counter/application/food_charges_controller.dart';
import 'package:citybox_pdv/features/counter/application/invoice_document_controller.dart';
import 'package:citybox_pdv/features/counter/application/sale_adjustment_controller.dart';
import 'package:citybox_pdv/features/payment/application/payment_entries_controller.dart';
import 'package:citybox_pdv/features/payment/application/sale_note_controller.dart';
import 'package:citybox_pdv/features/payment/application/sale_seller_controller.dart';
import 'package:citybox_pdv/features/tables/application/active_account_sync.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

/// Carrinho e demais campos da venda em curso são memória do processo.
/// Desativar o terminal sem matar o app deixava as linhas no Balcão; ao
/// parear outra organização, o operador via itens que nem existem lá.
///
/// A decisão mora aqui — não em [DeviceCredentialController.forget] — para o
/// terminal não importar counter/payment (camadas).
void resetOpenSale(T Function<T>(ProviderListenable<T> provider) read) {
  read(counterCartProvider.notifier).clear();
  read(paymentEntriesProvider.notifier).clear();
  read(counterCustomerProvider.notifier).clear();
  read(invoiceDocumentProvider.notifier).clear();
  read(counterDocumentTypeProvider.notifier).reset();
  read(saleSellerProvider.notifier).prepareForNewSale();
  read(saleNoteProvider.notifier).clear();
  read(saleAdjustmentProvider.notifier).clear();
  read(foodChargesProvider.notifier).clear();
  read(counterPendingQtyProvider.notifier).clear();
  read(counterBarcodeErrorProvider.notifier).clear();
  read(counterCategoryProvider.notifier).select(null);
  read(activeAccountIdProvider.notifier).state = null;
}

/// `true` quando a credencial some (desativar) ou quando organização /
/// unidade / terminal mudam. Primeiro pareamento (`previous == null`) não
/// limpa — não há venda anterior para descartar.
bool saleIdentityChanged(DeviceCredential? previous, DeviceCredential? next) {
  if (next == null) {
    return previous != null;
  }
  if (previous == null) {
    return false;
  }
  return previous.organizationId != next.organizationId ||
      previous.branchId != next.branchId ||
      previous.terminalId != next.terminalId;
}

/// Mantém o listen vivo. Sem um [watch] no [PdvApp], o provider morre e o
/// carrinho volta a vazar entre organizações.
final Provider<void> openSaleResetBindingProvider = Provider<void>((Ref ref) {
  ref.listen<DeviceCredential?>(
    deviceCredentialProvider,
    (DeviceCredential? previous, DeviceCredential? next) {
      if (!saleIdentityChanged(previous, next)) {
        return;
      }
      resetOpenSale(ref.read);
    },
  );
});
