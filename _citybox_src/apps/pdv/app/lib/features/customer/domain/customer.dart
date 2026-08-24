import 'package:citybox_pdv/core/format/normalize_for_search.dart';
import 'package:citybox_pdv/features/customer/domain/customer_address.dart';
import 'package:citybox_pdv/features/customer/domain/customer_gender.dart';
import 'package:citybox_pdv/features/customer/domain/customer_person_type.dart';

/// Cliente do cadastro comercial do PDV.
///
/// Espelha o contrato da erp-api (`CustomerDetailDto` / listagem POS).
/// [gender] só existe no mock local — a API não tem o campo.
class Customer {
  const Customer({
    required this.id,
    required this.name,
    this.personType = CustomerPersonType.individual,
    this.document = '',
    this.rg = '',
    this.birthDate,
    this.email = '',
    this.gender = CustomerGender.unspecified,
    this.phone = '',
    this.mobilePhone = '',
    this.address = const CustomerAddress(),
    this.deliveryAddress,
    this.categoryId,
    this.notes = '',
  });

  final String id;
  final String name;
  final CustomerPersonType personType;

  /// CPF ou CNPJ, só dígitos.
  final String document;

  /// Documento complementar (RG).
  final String rg;

  /// Data de nascimento (`yyyy-mm-dd`), só PF.
  final String? birthDate;

  final String email;
  final CustomerGender gender;

  /// Telefone comercial.
  final String phone;

  /// Telefone celular.
  final String mobilePhone;

  final CustomerAddress address;
  final CustomerAddress? deliveryAddress;
  final String? categoryId;
  final String notes;

  /// Rótulo curto para a app bar: só o nome.
  String get label => name;

  /// Texto secundário na lista (documento formatado de forma mínima).
  String get secondaryLabel {
    if (document.isEmpty) {
      return personType.label;
    }
    return document;
  }

  /// Casa com o que foi digitado na busca do seletor (nome ou documento).
  bool matches(String query) {
    final String needle = normalizeForSearch(query);
    if (needle.isEmpty) {
      return true;
    }
    return normalizeForSearch(name).contains(needle) ||
        document.contains(needle);
  }

  /// Item de listagem POS ou detalhe completo.
  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id']! as String,
      name: json['name']! as String,
      personType: CustomerPersonTypeX.fromApi(json['personType'] as String?),
      document: (json['document'] as String?) ?? '',
      rg: (json['rg'] as String?) ?? '',
      birthDate: json['birthDate'] as String?,
      email: (json['email'] as String?) ?? '',
      phone: (json['phone'] as String?) ?? '',
      mobilePhone: (json['mobilePhone'] as String?) ?? '',
      address: CustomerAddress.fromApiList(json['addresses']),
      deliveryAddress:
          json['addresses'] == null
              ? null
              : CustomerAddress.fromApiListByType(
                json['addresses'],
                preferredType: 'entrega',
              ),
      categoryId: json['categoryId'] as String?,
      notes: (json['notes'] as String?) ?? '',
    );
  }

  /// Corpo de `POST /v1/pos/customers` (sem gender).
  Map<String, dynamic> toCreateBody() {
    final Map<String, dynamic> body = <String, dynamic>{
      'personType': personType.apiValue,
      'name': name,
      if (document.isNotEmpty) 'document': document,
      if (rg.isNotEmpty) 'rg': rg,
      if (birthDate != null && birthDate!.isNotEmpty) 'birthDate': birthDate,
      if (email.isNotEmpty) 'email': email,
      if (mobilePhone.isNotEmpty) 'mobilePhone': mobilePhone,
      if (phone.isNotEmpty) 'phone': phone,
      if (categoryId != null) 'categoryId': categoryId,
      if (notes.isNotEmpty) 'notes': notes,
    };
    if (!address.isEmpty) {
      body['addresses'] = <Map<String, dynamic>>[address.toApiAddress()];
    }
    return body;
  }

  Map<String, dynamic> toCacheJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'personType': personType.apiValue,
      'document': document,
      'rg': rg,
      'birthDate': birthDate,
      'email': email,
      'phone': phone,
      'mobilePhone': mobilePhone,
      'categoryId': categoryId,
      'notes': notes,
      'addresses':
          address.isEmpty
              ? <Map<String, dynamic>>[]
              : <Map<String, dynamic>>[address.toApiAddress()],
    };
  }

  Customer copyWith({
    String? id,
    String? name,
    CustomerPersonType? personType,
    String? document,
    String? rg,
    String? birthDate,
    bool clearBirthDate = false,
    String? email,
    CustomerGender? gender,
    String? phone,
    String? mobilePhone,
    CustomerAddress? address,
    CustomerAddress? deliveryAddress,
    String? categoryId,
    bool clearCategoryId = false,
    String? notes,
  }) {
    return Customer(
      id: id ?? this.id,
      name: name ?? this.name,
      personType: personType ?? this.personType,
      document: document ?? this.document,
      rg: rg ?? this.rg,
      birthDate: clearBirthDate ? null : (birthDate ?? this.birthDate),
      email: email ?? this.email,
      gender: gender ?? this.gender,
      phone: phone ?? this.phone,
      mobilePhone: mobilePhone ?? this.mobilePhone,
      address: address ?? this.address,
      deliveryAddress: deliveryAddress ?? this.deliveryAddress,
      categoryId: clearCategoryId ? null : (categoryId ?? this.categoryId),
      notes: notes ?? this.notes,
    );
  }
}
