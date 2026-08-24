/// Gênero do cliente — só no mock local do PDV (a erp-api ainda não tem o
/// campo). Mantido aqui para o formulário bater com o que o operador espera.
enum CustomerGender { female, male, other, unspecified }

extension CustomerGenderX on CustomerGender {
  String get label {
    switch (this) {
      case CustomerGender.female:
        return 'Feminino';
      case CustomerGender.male:
        return 'Masculino';
      case CustomerGender.other:
        return 'Outro';
      case CustomerGender.unspecified:
        return 'Não informado';
    }
  }
}
