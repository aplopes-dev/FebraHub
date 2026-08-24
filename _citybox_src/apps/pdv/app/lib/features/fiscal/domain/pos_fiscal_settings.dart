/// Tipo de NF configurado para o PDV nesta organização.
///
/// Vem de `GET /v1/pos/fiscal-settings`. Nesta fatia o app **não emite** —
/// só usa o modelo para ser honesto no indicador Sefaz da barra de título.
enum PosDocumentModel {
  model55,
  model65;

  static PosDocumentModel? tryParse(String? raw) {
    return switch (raw) {
      'MODEL_55' => PosDocumentModel.model55,
      'MODEL_65' => PosDocumentModel.model65,
      _ => null,
    };
  }

  String get apiValue => switch (this) {
    PosDocumentModel.model55 => 'MODEL_55',
    PosDocumentModel.model65 => 'MODEL_65',
  };
}

/// Snapshot da política fiscal do PDV (organização do terminal).
class PosFiscalSettings {
  const PosFiscalSettings({
    required this.id,
    this.posDocumentModel,
    this.updatedByUserId,
    this.updatedAt,
  });

  /// Antes da primeira sync / sem credencial — equivalente a "não configurado".
  static const PosFiscalSettings unset = PosFiscalSettings(id: '');

  final String id;
  final PosDocumentModel? posDocumentModel;
  final String? updatedByUserId;
  final DateTime? updatedAt;

  bool get isConfigured => posDocumentModel != null;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'posDocumentModel': posDocumentModel?.apiValue,
    'updatedByUserId': updatedByUserId,
    'updatedAt': updatedAt?.toIso8601String(),
  };

  static PosFiscalSettings fromJson(Map<String, dynamic> json) {
    return PosFiscalSettings(
      id: (json['id'] as String?) ?? '',
      posDocumentModel: PosDocumentModel.tryParse(
        json['posDocumentModel'] as String?,
      ),
      updatedByUserId: json['updatedByUserId'] as String?,
      updatedAt:
          json['updatedAt'] != null
              ? DateTime.tryParse(json['updatedAt']! as String)
              : null,
    );
  }
}
