/// Papel legado do operador no PDV.
///
/// A API device não devolve mais `role` — use [PosOperator.permissionIds].
/// Mantido só para ler cache offline antigo (`role` no JSON). Supervisor
/// legado vira a permissão [PosOperator.alcadaAuthorizePermission].
@Deprecated('Use permissionIds / PosOperator.isSupervisor')
enum PosOperatorRole { operator, supervisor }

/// Rótulos do papel legado — a UI usa [PosOperator.isSupervisor].
@Deprecated('Use PosOperator.isSupervisor')
extension PosOperatorRoleLabel on PosOperatorRole {
  String get label => switch (this) {
    // ignore: deprecated_member_use_from_same_package
    PosOperatorRole.operator => 'Operador',
    // ignore: deprecated_member_use_from_same_package
    PosOperatorRole.supervisor => 'Supervisor',
  };
}

/// Quem está operando o caixa.
///
/// **Não confundir com `Seller`** (vendedor). São perguntas diferentes sobre a
/// mesma venda: o operador é *quem digitou* — responde auditoria, sangria e
/// cancelamento; o vendedor é *de quem é a comissão* — responde relatório de
/// venda. Costumam ser a mesma pessoa no balcão e nunca são a mesma coisa em
/// loja com equipe de vendas, então o domínio guarda os dois separados.
///
/// [code] é o número curto que o operador decora e digita na tela de login —
/// em unidade com equipe grande é por ele que se identifica, não pelo nome.
///
/// Identidade no device: [id] = `userId` do ERP; [membershipId] é o vínculo
/// na organização. Alçada de supervisor = permissão
/// [alcadaAuthorizePermission] em [permissionIds] (não há mais campo `role`).
class PosOperator {
  const PosOperator({
    required this.id,
    required this.code,
    required this.name,
    this.membershipId,
    this.permissionIds = const <String>[],
    this.active = true,
  });

  /// Permissão fina que autoriza exceção de alçada no PDV (espelho do catálogo
  /// da `erp-api`: `pdv.operacao.alcada.authorize`).
  static const String alcadaAuthorizePermission =
      'pdv.operacao.alcada.authorize';

  /// Permissão fina para registrar sangria (`pdv.operacao.caixa.withdrawal`).
  /// Perfil Caixa **não** inclui por padrão — pede PIN de quem tem.
  static const String withdrawalPermission =
      'pdv.operacao.caixa.withdrawal';

  /// `userId` no ERP (respostas device de `v1/pos/operators*`).
  final String id;

  /// Membership na organização — presente nas respostas device atuais.
  final String? membershipId;

  final String code;
  final String name;

  /// Permissões finas do perfil do membro (ex.: `pdv.operacao.venda.create`).
  final List<String> permissionIds;

  final bool active;

  /// Pode autorizar operação acima do limite de alçada.
  bool get isSupervisor =>
      permissionIds.contains(alcadaAuthorizePermission);

  /// Pode registrar sangria sem pedir autorização de outro operador.
  bool get canWithdraw => permissionIds.contains(withdrawalPermission);

  /// Tem a permissão fina [permissionId].
  bool hasPermission(String permissionId) =>
      permissionIds.contains(permissionId);

  /// Como aparece em lista e seletor: código antes do nome, porque é o código
  /// que o operador procura.
  String get label => '$code · $name';

  /// Vem de `GET /v1/pos/operators` — a lista da unidade do terminal.
  ///
  /// Não existe campo de PIN aqui, e nem poderia: a API nunca devolve hash
  /// nenhum (exceto `sync`, confinado ao [CachedOperator]). O que o app faz é
  /// mandar o PIN digitado e receber o operador.
  ///
  /// Cache offline antigo ainda pode trazer `role`; se não houver
  /// `permissionIds` e `role == supervisor`, injeta [alcadaAuthorizePermission].
  static PosOperator fromJson(Map<String, dynamic> json) {
    return PosOperator(
      id: json['id']! as String,
      membershipId: json['membershipId'] as String?,
      code: json['code']! as String,
      name: json['name']! as String,
      permissionIds: _permissionIdsFromJson(json),
      active: (json['active'] as bool?) ?? true,
    );
  }

  static List<String> _permissionIdsFromJson(Map<String, dynamic> json) {
    final Object? raw = json['permissionIds'];
    if (raw is List) {
      return List<String>.unmodifiable(
        raw.map((Object? e) => e! as String).toList(),
      );
    }

    final String? legacyRole = json['role'] as String?;
    // Cache v1 gravava `role` em vez de `permissionIds`.
    if (legacyRole == 'supervisor') {
      return const <String>[alcadaAuthorizePermission];
    }
    return const <String>[];
  }
}
