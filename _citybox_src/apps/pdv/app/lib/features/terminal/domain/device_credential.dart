/// Credencial do terminal — o que prova que este app é "o Caixa 2 da Loja
/// Centro", e não uma instalação qualquer.
///
/// Nasce no pareamento (`POST /v1/pos-terminals/pair/redeem`) e vive no cofre
/// do sistema. [organizationId] e [branchId] vêm junto de propósito: são
/// propriedade do terminal, não escolha do app — o PDV nunca decide em nome de
/// que loja está vendendo.
///
/// [organizationName] / [branchName] alimentam o branding na app bar. Podem
/// faltar em credenciais antigas no cofre — o boot revalida via
/// `GET /v1/pos/terminal`.
class DeviceCredential {
  const DeviceCredential({
    required this.token,
    required this.terminalId,
    required this.terminalName,
    required this.organizationId,
    required this.branchId,
    this.organizationName,
    this.branchName,
  });

  /// Segredo opaco. Vai no header `Authorization: Device <token>` e **nunca**
  /// em log — ver o interceptor de redação em `PdvApiClient`.
  final String token;

  final String terminalId;
  final String terminalName;
  final String organizationId;
  final String branchId;

  /// Nome de exibição da empresa (ERP). Opcional em credenciais legadas.
  final String? organizationName;

  /// Nome de exibição da unidade. Preferido na app bar sobre [organizationName].
  final String? branchName;

  /// Nome amigável da loja: unidade → empresa → terminal → fallback.
  String get establishmentDisplayName {
    final String? branch = branchName?.trim();
    if (branch != null && branch.isNotEmpty) return branch;
    final String? org = organizationName?.trim();
    if (org != null && org.isNotEmpty) return org;
    final String terminal = terminalName.trim();
    if (terminal.isNotEmpty) return terminal;
    return 'Loja';
  }

  bool get hasEstablishmentNames {
    final String? branch = branchName?.trim();
    final String? org = organizationName?.trim();
    return (branch != null && branch.isNotEmpty) ||
        (org != null && org.isNotEmpty);
  }

  DeviceCredential copyWith({
    String? token,
    String? terminalId,
    String? terminalName,
    String? organizationId,
    String? branchId,
    String? organizationName,
    String? branchName,
  }) {
    return DeviceCredential(
      token: token ?? this.token,
      terminalId: terminalId ?? this.terminalId,
      terminalName: terminalName ?? this.terminalName,
      organizationId: organizationId ?? this.organizationId,
      branchId: branchId ?? this.branchId,
      organizationName: organizationName ?? this.organizationName,
      branchName: branchName ?? this.branchName,
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'token': token,
    'terminalId': terminalId,
    'terminalName': terminalName,
    'organizationId': organizationId,
    'branchId': branchId,
    'organizationName': organizationName,
    'branchName': branchName,
  };

  static DeviceCredential fromJson(Map<String, dynamic> json) {
    return DeviceCredential(
      token: json['token']! as String,
      terminalId: json['terminalId']! as String,
      terminalName: json['terminalName']! as String,
      organizationId: json['organizationId']! as String,
      branchId: json['branchId']! as String,
      organizationName: json['organizationName'] as String?,
      branchName: json['branchName'] as String?,
    );
  }

  /// Sem o token: é o que pode aparecer em tela, log ou mensagem de erro.
  @override
  String toString() =>
      'DeviceCredential($terminalName, terminal: $terminalId, '
      'org: $organizationId, branch: $branchId)';
}
