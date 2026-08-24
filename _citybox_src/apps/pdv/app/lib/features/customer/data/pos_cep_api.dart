import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';

/// Endereço retornado por `GET /v1/pos/cep/:cep`.
class PosCepAddress {
  const PosCepAddress({
    required this.zipCode,
    required this.street,
    required this.neighborhood,
    required this.city,
    required this.state,
  });

  final String zipCode;
  final String street;
  final String neighborhood;
  final String city;
  final String state;

  factory PosCepAddress.fromJson(Map<String, dynamic> json) {
    return PosCepAddress(
      zipCode: (json['zipCode'] as String?) ?? '',
      street: (json['street'] as String?) ?? '',
      neighborhood: (json['neighborhood'] as String?) ?? '',
      city: (json['city'] as String?) ?? '',
      state: (json['state'] as String?) ?? '',
    );
  }
}

/// Lookup de CEP do terminal (`/v1/pos/cep/:digits`).
class PosCepApi {
  const PosCepApi(this._client);

  final PdvApiClient _client;

  Future<PosCepAddress> lookup(String cepDigits) async {
    final String digits = cepDigits.replaceAll(RegExp(r'\D'), '');
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/cep/$digits');
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      return PosCepAddress.fromJson(data);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }
}
