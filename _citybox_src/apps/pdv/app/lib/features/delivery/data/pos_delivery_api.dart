import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/customer/domain/customer_address.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';

class PosCourier {
  const PosCourier({required this.id, required this.name});

  final String id;
  final String name;

  factory PosCourier.fromJson(Map<String, dynamic> json) {
    return PosCourier(id: json['id']! as String, name: json['name']! as String);
  }
}

class PosDeliveryOrderDto {
  const PosDeliveryOrderDto({
    required this.order,
    required this.lines,
    required this.address,
  });

  final DeliveryOrder order;
  final List<CounterCartLine> lines;
  final CustomerAddress address;

  factory PosDeliveryOrderDto.fromJson(Map<String, dynamic> json) {
    final List<dynamic> rawLines =
        (json['lines'] as List<dynamic>?) ?? const <dynamic>[];
    return PosDeliveryOrderDto(
      order: DeliveryOrder(
        id: json['id']! as String,
        number: (json['number'] as num?)?.toInt() ?? 0,
        status: DeliveryOrderStatus.values.byName(json['status']! as String),
        fulfillment: DeliveryFulfillment.values.byName(
          (json['fulfillment'] as String?) ?? 'delivery',
        ),
        customerId: json['customerId'] as String?,
        customerName: json['customerName'] as String?,
        addressText: (json['addressText'] as String?) ?? '',
        feeCents: (json['feeCents'] as num?)?.toInt() ?? 0,
        courierId: json['courierId'] as String?,
        courierName: json['courierName'] as String?,
        saleOrderId: json['saleOrderId'] as String?,
        createdAt: DateTime.parse(json['createdAt']! as String),
        updatedAt: DateTime.parse(json['updatedAt']! as String),
      ),
      lines: rawLines
          .map(
            (dynamic raw) =>
                _lineFromJson(Map<String, dynamic>.from(raw as Map)),
          )
          .toList(growable: false),
      address: CustomerAddress(
        zipCode: (json['addressZipCode'] as String?) ?? '',
        street: (json['addressStreet'] as String?) ?? '',
        number: (json['addressNumber'] as String?) ?? '',
        district: (json['addressDistrict'] as String?) ?? '',
        city: (json['addressCity'] as String?) ?? '',
        state: (json['addressState'] as String?) ?? '',
        complement: (json['addressComplement'] as String?) ?? '',
      ),
    );
  }
}

CounterCartLine _lineFromJson(Map<String, dynamic> json) {
  final double quantity =
      double.tryParse(json['quantity']?.toString() ?? '') ?? 1;
  final int unitPriceCents = (json['unitPriceCents'] as num?)?.toInt() ?? 0;
  return CounterCartLine(
    product: CounterProduct(
      id: json['productId']! as String,
      name: (json['productName'] as String?) ?? '',
      priceCents: unitPriceCents,
      categoryId: '',
    ),
    quantity: quantity.round().clamp(1, 2147483647),
    kitchenNote: json['notes'] as String?,
  );
}

Map<String, dynamic> posDeliveryLineBody(CounterCartLine line) {
  return <String, dynamic>{
    'productId': line.product.id,
    'productName': line.product.name,
    'quantity': line.weightKg?.toString() ?? line.quantity.toString(),
    'unitPriceCents': line.goodsUnitCents,
    if (line.kitchenNote != null && line.kitchenNote!.trim().isNotEmpty)
      'notes': line.kitchenNote!.trim(),
  };
}

abstract interface class PosDeliveryGateway {
  Future<List<PosDeliveryOrderDto>> list();

  Future<PosDeliveryOrderDto> create(Map<String, dynamic> body);

  Future<PosDeliveryOrderDto> getById(String id);

  Future<PosDeliveryOrderDto> updateHeader(
    String id,
    Map<String, dynamic> body,
  );

  Future<PosDeliveryOrderDto> replaceLines(
    String id,
    List<CounterCartLine> lines,
  );

  Future<PosDeliveryOrderDto> updateStatus(
    String id,
    DeliveryOrderStatus status,
  );

  Future<List<PosCourier>> listCouriers();
}

class PosDeliveryApi implements PosDeliveryGateway {
  const PosDeliveryApi(this._client);

  final PdvApiClient _client;

  @override
  Future<List<PosDeliveryOrderDto>> list() async {
    try {
      final List<PosDeliveryOrderDto> orders = <PosDeliveryOrderDto>[];
      int page = 1;
      while (true) {
        final Response<Map<String, dynamic>> response = await _client
            .get<Map<String, dynamic>>(
              '/v1/pos/delivery-orders',
              queryParameters: <String, dynamic>{'page': page, 'perPage': 100},
            );
        final Map<String, dynamic> payload = response.data!;
        final List<dynamic> rows =
            (payload['data'] as List<dynamic>?) ?? const <dynamic>[];
        orders.addAll(
          rows.map(
            (dynamic row) => PosDeliveryOrderDto.fromJson(
              Map<String, dynamic>.from(row as Map),
            ),
          ),
        );
        final Map<String, dynamic> meta = Map<String, dynamic>.from(
          (payload['meta'] as Map?) ?? const <String, dynamic>{},
        );
        final int totalPages = (meta['totalPages'] as num?)?.toInt() ?? page;
        if (page >= totalPages) break;
        page += 1;
      }
      return List<PosDeliveryOrderDto>.unmodifiable(orders);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  @override
  Future<PosDeliveryOrderDto> create(Map<String, dynamic> body) =>
      _write('POST', '/v1/pos/delivery-orders', body);

  @override
  Future<PosDeliveryOrderDto> getById(String id) async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/delivery-orders/$id');
      return _parseOne(response);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  @override
  Future<PosDeliveryOrderDto> updateHeader(
    String id,
    Map<String, dynamic> body,
  ) => _write('PATCH', '/v1/pos/delivery-orders/$id', body);

  @override
  Future<PosDeliveryOrderDto> replaceLines(
    String id,
    List<CounterCartLine> lines,
  ) {
    return _write('PUT', '/v1/pos/delivery-orders/$id/lines', <String, dynamic>{
      'lines': lines.map(posDeliveryLineBody).toList(growable: false),
    });
  }

  @override
  Future<PosDeliveryOrderDto> updateStatus(
    String id,
    DeliveryOrderStatus status,
  ) {
    return _write(
      'PATCH',
      '/v1/pos/delivery-orders/$id/status',
      <String, dynamic>{'status': status.name},
    );
  }

  @override
  Future<List<PosCourier>> listCouriers() async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/couriers');
      final List<dynamic> rows =
          (response.data!['data'] as List<dynamic>?) ?? const <dynamic>[];
      return rows
          .map(
            (dynamic row) =>
                PosCourier.fromJson(Map<String, dynamic>.from(row as Map)),
          )
          .toList(growable: false);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  Future<PosDeliveryOrderDto> _write(
    String method,
    String path,
    Map<String, dynamic> body,
  ) async {
    try {
      final Response<Map<String, dynamic>> response = switch (method) {
        'POST' => await _client.post<Map<String, dynamic>>(path, data: body),
        'PUT' => await _client.put<Map<String, dynamic>>(path, data: body),
        _ => await _client.patch<Map<String, dynamic>>(path, data: body),
      };
      return _parseOne(response);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  PosDeliveryOrderDto _parseOne(Response<Map<String, dynamic>> response) {
    final Map<String, dynamic> data =
        response.data!['data']! as Map<String, dynamic>;
    return PosDeliveryOrderDto.fromJson(data);
  }
}

final Provider<PosDeliveryGateway> posDeliveryApiProvider =
    Provider<PosDeliveryGateway>(
      (Ref ref) => PosDeliveryApi(ref.watch(pdvApiClientProvider)),
    );
