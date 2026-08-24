/// Endereço estruturado do cliente.
class CustomerAddress {
  const CustomerAddress({
    this.zipCode = '',
    this.street = '',
    this.number = '',
    this.complement = '',
    this.district = '',
    this.state = '',
    this.city = '',
  });

  final String zipCode;
  final String street;
  final String number;
  final String complement;
  final String district;
  final String state;
  final String city;

  factory CustomerAddress.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const CustomerAddress();
    }
    return CustomerAddress(
      zipCode: (json['zipCode'] as String?) ?? '',
      street: (json['street'] as String?) ?? '',
      number: (json['number'] as String?) ?? '',
      complement: (json['complement'] as String?) ?? '',
      district: (json['district'] as String?) ?? '',
      state: (json['state'] as String?) ?? '',
      city: (json['city'] as String?) ?? '',
    );
  }

  /// Primeiro endereço da lista da API (principal preferido).
  factory CustomerAddress.fromApiList(Object? raw) {
    return CustomerAddress.fromApiListByType(raw, preferredType: 'principal');
  }

  /// Endereço de um tipo específico, com fallback no principal/primeiro.
  factory CustomerAddress.fromApiListByType(
    Object? raw, {
    required String preferredType,
  }) {
    if (raw is! List || raw.isEmpty) {
      return const CustomerAddress();
    }
    Map<String, dynamic>? preferred;
    Map<String, dynamic>? principal;
    Map<String, dynamic>? first;
    for (final Object? item in raw) {
      if (item is! Map) {
        continue;
      }
      final Map<String, dynamic> map = Map<String, dynamic>.from(item);
      first ??= map;
      if (map['addressType'] == preferredType) {
        preferred = map;
        break;
      }
      if (map['addressType'] == 'principal') {
        principal ??= map;
      }
    }
    return CustomerAddress.fromJson(preferred ?? principal ?? first);
  }

  Map<String, dynamic> toApiAddress() {
    return <String, dynamic>{
      'addressType': 'principal',
      if (zipCode.isNotEmpty) 'zipCode': zipCode,
      if (street.isNotEmpty) 'street': street,
      if (number.isNotEmpty) 'number': number,
      if (complement.isNotEmpty) 'complement': complement,
      if (district.isNotEmpty) 'district': district,
      if (state.isNotEmpty) 'state': state,
      if (city.isNotEmpty) 'city': city,
    };
  }

  bool get isEmpty =>
      zipCode.isEmpty &&
      street.isEmpty &&
      number.isEmpty &&
      complement.isEmpty &&
      district.isEmpty &&
      state.isEmpty &&
      city.isEmpty;

  CustomerAddress copyWith({
    String? zipCode,
    String? street,
    String? number,
    String? complement,
    String? district,
    String? state,
    String? city,
  }) {
    return CustomerAddress(
      zipCode: zipCode ?? this.zipCode,
      street: street ?? this.street,
      number: number ?? this.number,
      complement: complement ?? this.complement,
      district: district ?? this.district,
      state: state ?? this.state,
      city: city ?? this.city,
    );
  }
}
