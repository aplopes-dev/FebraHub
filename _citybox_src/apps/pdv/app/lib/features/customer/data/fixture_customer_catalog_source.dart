import 'package:citybox_pdv/features/customer/data/customer_catalog.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_catalog_source.dart';
import 'package:citybox_pdv/features/customer/domain/customer_category.dart';

/// Fixture só para testes — **nunca** produção.
class FixtureCustomerCatalogSource implements CustomerCatalogSource {
  FixtureCustomerCatalogSource({
    List<Customer>? customers,
    List<CustomerCategory>? categories,
  }) : _customers = List<Customer>.of(customers ?? seedCustomers),
       _categories = List<CustomerCategory>.of(
         categories ?? customerCategories,
       );

  final List<Customer> _customers;
  final List<CustomerCategory> _categories;

  @override
  Future<CustomerListPage> list({
    String? search,
    int page = 1,
    int perPage = 50,
  }) async {
    final String? needle = search?.trim();
    final List<Customer> filtered =
        needle == null || needle.isEmpty
            ? _customers
            : _customers
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
    return _customers.firstWhere((Customer c) => c.id == id);
  }

  @override
  Future<Customer> create(Customer draft) async {
    final Customer saved = draft.id.startsWith('cust_')
        ? draft.copyWith(id: 'cust_${_customers.length + 1}')
        : draft;
    _customers.add(saved);
    return saved;
  }

  @override
  Future<List<CustomerCategory>> listCategories() async =>
      List<CustomerCategory>.unmodifiable(_categories);
}
