import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/core/format/normalize_for_search.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/customer/data/http_customer_catalog_source.dart';
import 'package:citybox_pdv/features/customer/data/pos_customers_api.dart';
import 'package:citybox_pdv/features/customer/data/shared_preferences_customer_cache.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_catalog_source.dart';
import 'package:citybox_pdv/features/customer/domain/customer_category.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

List<Customer> _sortedCustomers(List<Customer> items) =>
    List<Customer>.unmodifiable(
      sortedByName<Customer>(items, (Customer c) => c.name),
    );

/// Estado do catálogo de clientes na UI.
class CustomerCatalogState {
  const CustomerCatalogState({
    required this.items,
    required this.categories,
    required this.hydrated,
    this.loading = false,
    this.errorMessage,
  });

  final List<Customer> items;
  final List<CustomerCategory> categories;
  final bool hydrated;
  final bool loading;
  final String? errorMessage;

  static CustomerCatalogState initial() => const CustomerCatalogState(
    items: <Customer>[],
    categories: <CustomerCategory>[],
    hydrated: false,
  );

  CustomerCatalogState copyWith({
    List<Customer>? items,
    List<CustomerCategory>? categories,
    bool? hydrated,
    bool? loading,
    String? errorMessage,
    bool clearError = false,
  }) {
    return CustomerCatalogState(
      items: items ?? this.items,
      categories: categories ?? this.categories,
      hydrated: hydrated ?? this.hydrated,
      loading: loading ?? this.loading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

final Provider<PosCustomersApi> posCustomersApiProvider =
    Provider<PosCustomersApi>(
      (Ref ref) => PosCustomersApi(ref.watch(pdvApiClientProvider)),
    );

/// Override em testes com [FixtureCustomerCatalogSource]. `null` → HTTP.
final Provider<CustomerCatalogSource?> customerCatalogSourceProvider =
    Provider<CustomerCatalogSource?>((Ref ref) => null);

final NotifierProvider<CustomerCatalogController, CustomerCatalogState>
customerCatalogProvider =
    NotifierProvider<CustomerCatalogController, CustomerCatalogState>(
      CustomerCatalogController.new,
    );

class CustomerCatalogController extends Notifier<CustomerCatalogState> {
  CustomerCatalogSource? _source;
  Timer? _searchDebounce;

  @override
  CustomerCatalogState build() {
    ref.onDispose(() => _searchDebounce?.cancel());
    ref.listen<DeviceCredential?>(deviceCredentialProvider, (
      DeviceCredential? previous,
      DeviceCredential? next,
    ) {
      if (next != null) {
        unawaited(refresh());
      }
    });
    return CustomerCatalogState.initial();
  }

  Future<CustomerCatalogSource> _resolveSource() async {
    final CustomerCatalogSource? override = ref.read(
      customerCatalogSourceProvider,
    );
    if (override != null) {
      _source = override;
      return override;
    }
    final CustomerCatalogSource existing = _source ??= HttpCustomerCatalogSource(
      api: ref.read(posCustomersApiProvider),
      cache: SharedPreferencesCustomerCache(
        await SharedPreferences.getInstance(),
      ),
      isPaired: () => ref.read(deviceCredentialProvider) != null,
    );
    return existing;
  }

  Future<void> hydrate() async {
    final CustomerCatalogSource source = await _resolveSource();
    try {
      final CustomerListPage page = await source.list(perPage: 50);
      final List<CustomerCategory> categories = await source.listCategories();
      state = CustomerCatalogState(
        items: _sortedCustomers(page.items),
        categories: List<CustomerCategory>.unmodifiable(categories),
        hydrated: true,
      );
    } on PdvApiException catch (error) {
      state = CustomerCatalogState(
        items: const <Customer>[],
        categories: const <CustomerCategory>[],
        hydrated: true,
        errorMessage: error.message,
      );
    }
  }

  Future<void> refresh() async {
    final CustomerCatalogSource source =
        ref.read(customerCatalogSourceProvider) ?? _source ?? await _resolveSource();
    try {
      final CustomerListPage page = await source.list(perPage: 50);
      final List<CustomerCategory> categories = await source.listCategories();
      state = state.copyWith(
        items: _sortedCustomers(page.items),
        categories: List<CustomerCategory>.unmodifiable(categories),
        hydrated: true,
        clearError: true,
      );
    } on PdvApiException {
      // Mantém o último estado conhecido.
    }
  }

  /// Busca no servidor com debounce (política §8.1).
  void searchDebounced(String query) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      unawaited(search(query));
    });
  }

  Future<void> search(String query) async {
    final CustomerCatalogSource source = await _resolveSource();
    state = state.copyWith(loading: true, clearError: true);
    try {
      final CustomerListPage page = await source.list(
        search: query,
        perPage: 50,
      );
      state = state.copyWith(
        items: _sortedCustomers(page.items),
        loading: false,
        hydrated: true,
      );
    } on PdvApiException catch (error) {
      state = state.copyWith(loading: false, errorMessage: error.message);
    }
  }

  /// Cadastro rápido no servidor; devolve o cliente persistido.
  Future<Customer> create(Customer draft) async {
    final CustomerCatalogSource source = await _resolveSource();
    final Customer created = await source.create(draft);
    upsert(created);
    return created;
  }

  void upsert(Customer customer) {
    final int index = state.items.indexWhere(
      (Customer item) => item.id == customer.id,
    );
    if (index < 0) {
      state = state.copyWith(
        items: _sortedCustomers(<Customer>[customer, ...state.items]),
      );
      return;
    }
    final List<Customer> next = List<Customer>.of(state.items);
    next[index] = customer;
    state = state.copyWith(items: _sortedCustomers(next));
  }
}
