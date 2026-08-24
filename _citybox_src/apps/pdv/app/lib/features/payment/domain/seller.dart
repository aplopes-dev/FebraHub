import 'package:citybox_pdv/core/format/normalize_for_search.dart';

/// Vendedor a quem a venda é atribuída.
///
/// [code] é o número que o vendedor decora e que o operador digita — em loja
/// com equipe grande, é por ele que se busca, não pelo nome inteiro. Por isso
/// [matches] aceita os dois. No ERP, [id] = `userId`; [code] = `pdvCode` ou
/// vazio quando o membro não tem credencial de caixa.
class Seller {
  const Seller({required this.id, required this.code, required this.name});

  final String id;
  final String code;
  final String name;

  /// Rótulo curto para a app bar: só o nome. O código já cumpriu o papel dele
  /// na busca, e repeti-lo no botão gasta a largura que o nome precisa.
  String get label => name;

  factory Seller.fromJson(Map<String, dynamic> json) {
    return Seller(
      id: json['id']! as String,
      code: (json['code'] as String?) ?? '',
      name: json['name']! as String,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
    'id': id,
    'code': code,
    'name': name,
  };

  /// Casa com o que foi digitado na busca do seletor.
  ///
  /// Sem acento e sem caixa dos dois lados: quem digita com pressa escreve
  /// "jessica", e um seletor que só acha "Jéssica" obriga a caçar o nome na
  /// lista — exatamente o que o campo de busca existe para evitar.
  bool matches(String query) {
    final String needle = normalizeForSearch(query);
    if (needle.isEmpty) {
      return true;
    }
    return normalizeForSearch(name).contains(needle) ||
        code.toLowerCase().contains(needle);
  }
}
