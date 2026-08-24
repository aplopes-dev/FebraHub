import 'package:citybox_pdv/features/tables/domain/dining_table.dart';

/// Mapa de mesas da fixture (restaurante demo).
List<DiningTable> buildDefaultTables() {
  return <DiningTable>[
    for (int i = 1; i <= 12; i++)
      DiningTable(id: 't$i', label: 'Mesa $i', sortOrder: i),
  ];
}
