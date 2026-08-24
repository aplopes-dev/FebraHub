import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/customer/data/pos_cep_api.dart';

void main() {
  test('PosCepAddress.fromJson mapeia campos', () {
    final PosCepAddress address = PosCepAddress.fromJson(<String, dynamic>{
      'zipCode': '45650-970',
      'street': 'Rua Teste',
      'neighborhood': 'Centro',
      'city': 'Ilhéus',
      'state': 'BA',
    });
    expect(address.street, 'Rua Teste');
    expect(address.neighborhood, 'Centro');
    expect(address.city, 'Ilhéus');
    expect(address.state, 'BA');
  });

  test('lookup sucesso via Dio interceptor', () async {
    final Dio dio = Dio(BaseOptions(baseUrl: 'http://test/api'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (RequestOptions options, RequestInterceptorHandler handler) {
          handler.resolve(
            Response<Map<String, dynamic>>(
              requestOptions: options,
              statusCode: 200,
              data: <String, dynamic>{
                'data': <String, dynamic>{
                  'zipCode': '45650-970',
                  'street': 'Rua Teste',
                  'neighborhood': 'Centro',
                  'city': 'Ilhéus',
                  'state': 'BA',
                },
              },
            ),
          );
        },
      ),
    );

    final PosCepApi api = PosCepApi(
      PdvApiClient(dio: dio, baseUrl: 'http://test/api'),
    );
    final PosCepAddress address = await api.lookup('45650-970');
    expect(address.city, 'Ilhéus');
  });

  test('lookup connectionError → isOffline', () async {
    final Dio dio = Dio(BaseOptions(baseUrl: 'http://test/api'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (RequestOptions options, RequestInterceptorHandler handler) {
          handler.reject(
            DioException(
              requestOptions: options,
              type: DioExceptionType.connectionError,
            ),
          );
        },
      ),
    );

    final PosCepApi api = PosCepApi(
      PdvApiClient(dio: dio, baseUrl: 'http://test/api'),
    );

    expect(
      () => api.lookup('45650970'),
      throwsA(
        isA<PdvApiException>().having(
          (PdvApiException e) => e.isOffline,
          'isOffline',
          isTrue,
        ),
      ),
    );
  });
}
