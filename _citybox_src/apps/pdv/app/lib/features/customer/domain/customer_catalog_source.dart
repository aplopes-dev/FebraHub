import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_category.dart';

/// Página de clientes da API device.
class CustomerListPage {
  const CustomerListPage({
    required this.items,
    required this.total,
    required this.page,
    required this.perPage,
    required this.totalPages,
  });

  final List<Customer> items;
  final int total;
  final int page;
  final int perPage;
  final int totalPages;
}

/// Fonte do catálogo de clientes (servidor / fixture de teste).
abstract class CustomerCatalogSource {
  Future<CustomerListPage> list({String? search, int page, int perPage});

  Future<Customer> getById(String id);

  Future<Customer> create(Customer draft);

  Future<List<CustomerCategory>> listCategories();
}
