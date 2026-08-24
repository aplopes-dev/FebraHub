import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/customer/data/pos_customers_api.dart';
import 'package:citybox_pdv/features/customer/data/shared_preferences_customer_cache.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_catalog_source.dart';
import 'package:citybox_pdv/features/customer/domain/customer_category.dart';

/// ERP como fonte de clientes, com cache local offline.
///
/// Ordem em [list] (busca vazia):
/// 1. Servidor → grava cache
/// 2. Cache
/// 3. Lista vazia — **nunca** fixture
///
/// Com [search] preenchido: só servidor; offline → filtra o cache local.
/// [create] exige rede (sem fila nesta fatia).
class HttpCustomerCatalogSource implements CustomerCatalogSource {
  HttpCustomerCatalogSource({
    required PosCustomersApi api,
    required SharedPreferencesCustomerCache cache,
    required bool Function() isPaired,
  }) : _api = api,
       _cache = cache,
       _isPaired = isPaired;

  final PosCustomersApi _api;
  final SharedPreferencesCustomerCache _cache;
  final bool Function() _isPaired;

  @override
  Future<CustomerListPage> list({
    String? search,
    int page = 1,
    int perPage = 50,
  }) async {
    final String? needle = search?.trim();
    final bool hasSearch = needle != null && needle.isNotEmpty;

    if (_isPaired()) {
      try {
        final CustomerListPage pageResult = await _api.list(
          search: needle,
          page: page,
          perPage: perPage,
        );
        if (!hasSearch && page == 1) {
          final List<CustomerCategory> categories = await _api.listCategories();
          await _cache.write(
            customers: pageResult.items,
            categories: categories,
          );
        }
        return pageResult;
      } on PdvApiException catch (error) {
        if (!error.isOffline) {
          rethrow;
        }
      }
    }

    final cached = await _cache.read();
    final List<Customer> all = cached?.customers ?? const <Customer>[];
    final List<Customer> filtered = hasSearch
        ? all
            .where((Customer c) => c.matches(needle))
            .toList(growable: false)
        : all;
    return CustomerListPage(
      items: filtered,
      total: filtered.length,
      page: 1,
      perPage: filtered.isEmpty ? perPage : filtered.length,
      totalPages: 1,
    );
  }

  @override
  Future<Customer> getById(String id) async {
    if (_isPaired()) {
      try {
        return await _api.getById(id);
      } on PdvApiException catch (error) {
        if (!error.isOffline) {
          rethrow;
        }
      }
    }
    final cached = await _cache.read();
    for (final Customer c in cached?.customers ?? const <Customer>[]) {
      if (c.id == id) {
        return c;
      }
    }
    throw const PdvApiException(
      'Cliente não encontrado no cache offline.',
      isOffline: true,
    );
  }

  @override
  Future<Customer> create(Customer draft) async {
    if (!_isPaired()) {
      throw const PdvApiException(
        'Ative o terminal para cadastrar clientes.',
      );
    }
    try {
      final Customer created = await _api.create(draft);
      final cached = await _cache.read();
      final List<Customer> next = <Customer>[
        created,
        ...?cached?.customers.where((Customer c) => c.id != created.id),
      ];
      await _cache.write(
        customers: next,
        categories: cached?.categories ?? const <CustomerCategory>[],
      );
      return created;
    } on PdvApiException {
      rethrow;
    }
  }

  @override
  Future<List<CustomerCategory>> listCategories() async {
    if (_isPaired()) {
      try {
        final List<CustomerCategory> categories = await _api.listCategories();
        final cached = await _cache.read();
        await _cache.write(
          customers: cached?.customers ?? const <Customer>[],
          categories: categories,
        );
        return categories;
      } on PdvApiException catch (error) {
        if (!error.isOffline) {
          rethrow;
        }
      }
    }
    return (await _cache.read())?.categories ?? const <CustomerCategory>[];
  }
}
