import 'package:citybox_pdv/features/cash/domain/sale_record.dart';

/// Número da venda para UI: ERP ([SaleRecord.serverNumber]) prevalece sobre o
/// sequencial local do turno.
String displaySaleNumber(SaleRecord sale) => SaleRecord.displayNumberLabel(sale);

String displaySaleNumberPlain(SaleRecord sale) {
  final int? n = SaleRecord.displayNumber(sale);
  return n == null ? '—' : '$n';
}
