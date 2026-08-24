import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/product_variant.dart';

/// Normaliza código digitado/bipado (trim; zeros à esquerda preservados na fixture).
String normalizeBarcode(String raw) => raw.trim();

/// Resultado de lookup de código de barras.
class BarcodeHit {
  const BarcodeHit({required this.product, this.variant});

  final CounterProduct product;
  final ProductVariant? variant;
}

/// Resolve [code] no catálogo. Retorna null se não achar.
BarcodeHit? resolveBarcode(String code, List<CounterProduct> products) {
  final String normalized = normalizeBarcode(code);
  if (normalized.isEmpty) {
    return null;
  }

  for (final CounterProduct product in products) {
    for (final ProductVariant variant in product.variants) {
      final String? vb = variant.barcode;
      if (vb != null && normalizeBarcode(vb) == normalized) {
        return BarcodeHit(product: product, variant: variant);
      }
    }
    for (final String b in product.barcodes) {
      if (normalizeBarcode(b) == normalized) {
        return BarcodeHit(product: product);
      }
    }
  }
  return null;
}
