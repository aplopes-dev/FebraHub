/// Tipo de pessoa do cadastro de cliente.
enum CustomerPersonType {
  /// Pessoa física — CPF.
  individual,

  /// Pessoa jurídica — CNPJ.
  company,
}

extension CustomerPersonTypeX on CustomerPersonType {
  String get label {
    switch (this) {
      case CustomerPersonType.individual:
        return 'Pessoa física';
      case CustomerPersonType.company:
        return 'Pessoa jurídica';
    }
  }

  /// Valor da erp-api (`PF` / `PJ`).
  String get apiValue {
    switch (this) {
      case CustomerPersonType.individual:
        return 'PF';
      case CustomerPersonType.company:
        return 'PJ';
    }
  }

  /// Rótulo do campo de documento principal (CPF ou CNPJ).
  String get documentFieldLabel {
    switch (this) {
      case CustomerPersonType.individual:
        return 'CPF';
      case CustomerPersonType.company:
        return 'CNPJ';
    }
  }

  static CustomerPersonType fromApi(String? value) {
    if (value == 'PJ') {
      return CustomerPersonType.company;
    }
    return CustomerPersonType.individual;
  }
}
