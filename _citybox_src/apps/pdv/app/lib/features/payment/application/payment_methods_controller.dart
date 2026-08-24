import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/payment/data/http_payment_methods_source.dart';
import 'package:citybox_pdv/features/payment/data/pos_payment_methods_api.dart';
import 'package:citybox_pdv/features/payment/data/shared_preferences_payment_methods_cache.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

class PaymentMethodsState {
  const PaymentMethodsState({required this.methods, required this.hydrated});

  final List<PaymentMethod> methods;
  final bool hydrated;

  static PaymentMethodsState initial() =>
      const PaymentMethodsState(methods: <PaymentMethod>[], hydrated: false);
}

final Provider<PosPaymentMethodsApi> posPaymentMethodsApiProvider =
    Provider<PosPaymentMethodsApi>(
      (Ref ref) => PosPaymentMethodsApi(ref.watch(pdvApiClientProvider)),
    );

final Provider<PaymentMethodsSource?> paymentMethodsSourceProvider =
    Provider<PaymentMethodsSource?>((Ref ref) => null);

final NotifierProvider<PaymentMethodsController, PaymentMethodsState>
paymentMethodsProvider =
    NotifierProvider<PaymentMethodsController, PaymentMethodsState>(
      PaymentMethodsController.new,
    );

class PaymentMethodsController extends Notifier<PaymentMethodsState> {
  PaymentMethodsSource? _source;

  @override
  PaymentMethodsState build() {
    ref.listen<DeviceCredential?>(deviceCredentialProvider, (
      DeviceCredential? previous,
      DeviceCredential? next,
    ) {
      if (next != null) {
        unawaited(refresh());
      }
    });
    return PaymentMethodsState.initial();
  }

  Future<void> hydrate() async {
    final PaymentMethodsSource source =
        ref.read(paymentMethodsSourceProvider) ??
        HttpPaymentMethodsSource(
          api: ref.read(posPaymentMethodsApiProvider),
          cache: SharedPreferencesPaymentMethodsCache(
            await SharedPreferences.getInstance(),
          ),
          isPaired: () => ref.read(deviceCredentialProvider) != null,
        );
    _source = source;
    state = PaymentMethodsState(
      methods: await source.load(),
      hydrated: true,
    );
  }

  Future<void> refresh() async {
    final PaymentMethodsSource? source =
        ref.read(paymentMethodsSourceProvider) ?? _source;
    if (source == null) {
      return;
    }
    state = PaymentMethodsState(
      methods: await source.load(),
      hydrated: true,
    );
  }
}
