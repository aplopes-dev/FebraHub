/// Breakpoints oficiais do PDV (AGENTS §4.7) — decidir por largura, nunca por OS.
abstract final class PdvBreakpoints {
  static const double compactMax = 720;
  static const double mediumMax = 1200;
}

/// Formato operacional derivado da largura disponível.
enum PdvFormat { compact, medium, expanded }

extension PdvFormatX on PdvFormat {
  bool get isCompact => this == PdvFormat.compact;
  bool get isMedium => this == PdvFormat.medium;
  bool get isExpanded => this == PdvFormat.expanded;
}

abstract final class PdvLayout {
  static PdvFormat ofWidth(double width) {
    if (width < PdvBreakpoints.compactMax) {
      return PdvFormat.compact;
    }
    if (width < PdvBreakpoints.mediumMax) {
      return PdvFormat.medium;
    }
    return PdvFormat.expanded;
  }
}
