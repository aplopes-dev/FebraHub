import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';

void main() {
  test('PdvApiException.from junta message[] do Nest (class-validator)', () {
    final PdvApiException error = PdvApiException.from(
      DioException(
        requestOptions: RequestOptions(path: '/v1/pos/sales'),
        type: DioExceptionType.badResponse,
        response: Response<Map<String, dynamic>>(
          requestOptions: RequestOptions(path: '/v1/pos/sales'),
          statusCode: 400,
          data: <String, dynamic>{
            'statusCode': 400,
            'message': <String>[
              'methodId must be a UUID',
              'productId must be a UUID',
            ],
            'error': 'Bad Request',
          },
        ),
      ),
    );

    expect(error.statusCode, 400);
    expect(error.message, contains('methodId must be a UUID'));
    expect(error.message, contains('productId must be a UUID'));
  });
}
