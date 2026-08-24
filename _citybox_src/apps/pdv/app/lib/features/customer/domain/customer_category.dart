/// Categoria comercial do cliente (CRM).
class CustomerCategory {
  const CustomerCategory({
    required this.id,
    required this.name,
    this.discountPercentage = 0,
  });

  final String id;
  final String name;
  final double discountPercentage;

  factory CustomerCategory.fromJson(Map<String, dynamic> json) {
    return CustomerCategory(
      id: json['id']! as String,
      name: json['name']! as String,
      discountPercentage: (json['discountPercentage'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
    'id': id,
    'name': name,
    'discountPercentage': discountPercentage,
  };
}
