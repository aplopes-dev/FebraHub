import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_catalog_source.dart';
import 'package:citybox_pdv/features/customer/domain/customer_category.dart';

/// Clientes do terminal (`/v1/pos/customers*`).
class PosCustomersApi {
  const PosCustomersApi(this._client);

  final PdvApiClient _client;

  Future<CustomerListPage> list({
    String? search,
    int page = 1,
    int perPage = 50,
  }) async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>(
            '/v1/pos/customers',
            queryParameters: <String, dynamic>{
              if (search != null && search.trim().isNotEmpty)
                'search': search.trim(),
              'page': page,
              'perPage': perPage,
            },
          );
      final Map<String, dynamic> body = response.data!;
      final List<dynamic> raw = body['data']! as List<dynamic>;
      final Map<String, dynamic> meta =
          (body['meta'] as Map<String, dynamic>?) ?? <String, dynamic>{};
      return CustomerListPage(
        items: raw
            .map(
              (dynamic row) =>
                  Customer.fromJson(Map<String, dynamic>.from(row as Map)),
            )
            .toList(growable: false),
        total: (meta['total'] as num?)?.toInt() ?? raw.length,
        page: (meta['page'] as num?)?.toInt() ?? page,
        perPage: (meta['perPage'] as num?)?.toInt() ?? perPage,
        totalPages: (meta['totalPages'] as num?)?.toInt() ?? 1,
      );
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  Future<Customer> getById(String id) async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/customers/$id');
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      return Customer.fromJson(data);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  Future<Customer> create(Customer draft) async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .post<Map<String, dynamic>>(
            '/v1/pos/customers',
            data: draft.toCreateBody(),
          );
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      return Customer.fromJson(data);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  Future<List<CustomerCategory>> listCategories({
    int page = 1,
    int perPage = 100,
  }) async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>(
            '/v1/pos/customer-categories',
            queryParameters: <String, dynamic>{
              'page': page,
              'perPage': perPage,
            },
          );
      final List<dynamic> raw = response.data!['data']! as List<dynamic>;
      return raw
          .map(
            (dynamic row) => CustomerCategory.fromJson(
              Map<String, dynamic>.from(row as Map),
            ),
          )
          .toList(growable: false);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }
}
