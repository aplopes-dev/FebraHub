import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/payment/data/pos_payment_methods_api.dart';
import 'package:citybox_pdv/features/payment/data/shared_preferences_payment_methods_cache.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

/// Fonte do catálogo de formas de pagamento (HTTP + cache).
abstract class PaymentMethodsSource {
  Future<List<PaymentMethod>> load();
}

class HttpPaymentMethodsSource implements PaymentMethodsSource {
  HttpPaymentMethodsSource({
    required PosPaymentMethodsApi api,
    required SharedPreferencesPaymentMethodsCache cache,
    required bool Function() isPaired,
  }) : _api = api,
       _cache = cache,
       _isPaired = isPaired;

  final PosPaymentMethodsApi _api;
  final SharedPreferencesPaymentMethodsCache _cache;
  final bool Function() _isPaired;

  @override
  Future<List<PaymentMethod>> load() async {
    if (_isPaired()) {
      try {
        final List<PaymentMethod> fresh = await _api.list();
        await _cache.write(fresh);
        return fresh;
      } on PdvApiException {
        // Boot silencioso — UI usa cache ou lista vazia.
      }
    }
    final List<PaymentMethod>? cached = await _cache.read();
    if (cached != null) {
      return cached;
    }
    return const <PaymentMethod>[];
  }
}
