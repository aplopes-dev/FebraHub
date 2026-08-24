import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/customer/data/http_customer_catalog_source.dart';
import 'package:citybox_pdv/features/customer/data/pos_customers_api.dart';
import 'package:citybox_pdv/features/customer/data/shared_preferences_customer_cache.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_catalog_source.dart';
import 'package:citybox_pdv/features/customer/domain/customer_category.dart';
import 'package:citybox_pdv/features/customer/domain/customer_person_type.dart';

class FakePosCustomersApi implements PosCustomersApi {
  FakePosCustomersApi({
    List<Customer>? customers,
    List<CustomerCategory>? categories,
  }) : customers = List<Customer>.of(
         customers ??
             const <Customer>[
               Customer(
                 id: 'c1',
                 name: 'Ana',
                 document: '52998224725',
                 personType: CustomerPersonType.individual,
               ),
             ],
       ),
       categories = List<CustomerCategory>.of(
         categories ??
             const <CustomerCategory>[
               CustomerCategory(id: 'cat1', name: 'VIP', discountPercentage: 10),
             ],
       );

  final List<Customer> customers;
  final List<CustomerCategory> categories;
  PdvApiException? listFailure;
  PdvApiException? createFailure;
  int listCalls = 0;
  int createCalls = 0;

  @override
  Future<CustomerListPage> list({
    String? search,
    int page = 1,
    int perPage = 50,
  }) async {
    listCalls++;
    final PdvApiException? forced = listFailure;
    if (forced != null) {
      throw forced;
    }
    final String? needle = search?.trim();
    final List<Customer> filtered =
        needle == null || needle.isEmpty
            ? customers
            : customers
                .where((Customer c) => c.matches(needle))
                .toList(growable: false);
    return CustomerListPage(
      items: filtered,
      total: filtered.length,
      page: page,
      perPage: perPage,
      totalPages: 1,
    );
  }

  @override
  Future<Customer> getById(String id) async {
    return customers.firstWhere((Customer c) => c.id == id);
  }

  @override
  Future<Customer> create(Customer draft) async {
    createCalls++;
    final PdvApiException? forced = createFailure;
    if (forced != null) {
      throw forced;
    }
    final Customer created = draft.copyWith(id: 'created-${createCalls}');
    customers.add(created);
    return created;
  }

  @override
  Future<List<CustomerCategory>> listCategories({
    int page = 1,
    int perPage = 100,
  }) async {
    return List<CustomerCategory>.unmodifiable(categories);
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  test('online grava cache e devolve lista', () async {
    final FakePosCustomersApi api = FakePosCustomersApi();
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final HttpCustomerCatalogSource source = HttpCustomerCatalogSource(
      api: api,
      cache: SharedPreferencesCustomerCache(prefs),
      isPaired: () => true,
    );

    final CustomerListPage page = await source.list();
    expect(page.items, hasLength(1));
    expect(api.listCalls, 1);

    final cached = await SharedPreferencesCustomerCache(prefs).read();
    expect(cached?.customers, hasLength(1));
  });

  test('offline usa cache — nunca fixture', () async {
    final FakePosCustomersApi api = FakePosCustomersApi();
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final SharedPreferencesCustomerCache cache =
        SharedPreferencesCustomerCache(prefs);
    await cache.write(
      customers: api.customers,
      categories: api.categories,
    );

    api.listFailure = const PdvApiException(
      'Sem conexão',
      isOffline: true,
    );

    final HttpCustomerCatalogSource source = HttpCustomerCatalogSource(
      api: api,
      cache: cache,
      isPaired: () => true,
    );

    final CustomerListPage page = await source.list(search: 'Ana');
    expect(page.items.single.name, 'Ana');
  });

  test('primeiro boot offline sem cache = vazio', () async {
    final FakePosCustomersApi api = FakePosCustomersApi();
    api.listFailure = const PdvApiException('Sem conexão', isOffline: true);
    final SharedPreferences prefs = await SharedPreferences.getInstance();

    final HttpCustomerCatalogSource source = HttpCustomerCatalogSource(
      api: api,
      cache: SharedPreferencesCustomerCache(prefs),
      isPaired: () => true,
    );

    final CustomerListPage page = await source.list();
    expect(page.items, isEmpty);
  });

  test('create offline lança', () async {
    final FakePosCustomersApi api = FakePosCustomersApi();
    api.createFailure = const PdvApiException(
      'Sem conexão',
      isOffline: true,
    );
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final HttpCustomerCatalogSource source = HttpCustomerCatalogSource(
      api: api,
      cache: SharedPreferencesCustomerCache(prefs),
      isPaired: () => true,
    );

    expect(
      () => source.create(const Customer(id: 'x', name: 'X')),
      throwsA(isA<PdvApiException>()),
    );
  });
}
