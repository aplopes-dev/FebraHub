import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/delivery/data/pos_delivery_api.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

void main() {
  group('PosDeliveryOrderDto.fromJson', () {
    test('parseia pedido, endereço e linhas do ERP', () {
      final PosDeliveryOrderDto dto = PosDeliveryOrderDto.fromJson(
        <String, dynamic>{
          'id': 'delivery-1',
          'number': 42,
          'status': 'preparing',
          'fulfillment': 'delivery',
          'customerId': 'customer-1',
          'customerName': 'Ana',
          'addressText': 'Rua A, 10',
          'addressZipCode': '45650000',
          'addressStreet': 'Rua A',
          'addressNumber': '10',
          'addressDistrict': 'Centro',
          'addressCity': 'Ilhéus',
          'addressState': 'BA',
          'feeCents': 700,
          'courierId': 'courier-1',
          'courierName': 'Beto',
          'createdAt': '2026-08-15T15:00:00.000Z',
          'updatedAt': '2026-08-15T15:05:00.000Z',
          'lines': <Map<String, dynamic>>[
            <String, dynamic>{
              'productId': 'product-1',
              'productName': 'Pizza',
              'quantity': '2',
              'unitPriceCents': 2500,
              'notes': 'Sem cebola',
            },
          ],
        },
      );

      expect(dto.order.id, 'delivery-1');
      expect(dto.order.number, 42);
      expect(dto.order.status, DeliveryOrderStatus.preparing);
      expect(dto.order.feeCents, 700);
      expect(dto.address.zipCode, '45650000');
      expect(dto.address.city, 'Ilhéus');
      expect(dto.lines, hasLength(1));
      expect(dto.lines.single.product.name, 'Pizza');
      expect(dto.lines.single.quantity, 2);
      expect(dto.lines.single.kitchenNote, 'Sem cebola');
    });
  });

  test('PosCourier.fromJson parseia entregador', () {
    final PosCourier courier = PosCourier.fromJson(<String, dynamic>{
      'id': 'courier-1',
      'name': 'Beto',
    });

    expect(courier.id, 'courier-1');
    expect(courier.name, 'Beto');
  });
}
