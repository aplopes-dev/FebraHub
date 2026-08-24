export type MockMedication = {
  id: string;
  name: string;
};

export const MOCK_MEDICATIONS: MockMedication[] = [
  { id: 'med-001', name: 'Amoxicilina 500mg' },
  { id: 'med-002', name: 'Azitromicina 500mg' },
  { id: 'med-003', name: 'Cetoprofeno 100mg' },
  { id: 'med-004', name: 'Dipirona 500mg' },
  { id: 'med-005', name: 'Ibuprofeno 400mg' },
  { id: 'med-006', name: 'Losartana 50mg' },
  { id: 'med-007', name: 'Metformina 850mg' },
  { id: 'med-008', name: 'Omeprazol 20mg' },
  { id: 'med-009', name: 'Paracetamol 750mg' },
  { id: 'med-010', name: 'Prednisona 20mg' },
  { id: 'med-011', name: 'Sertralina 50mg' },
  { id: 'med-012', name: 'Sinvastatina 20mg' },
  { id: 'med-013', name: 'Cloridrato de Tramadol 50mg' },
  { id: 'med-014', name: 'Nimesulida 100mg' },
  { id: 'med-015', name: 'Vitamina D3 7000UI' },
  { id: 'med-016', name: 'Clorexidina 0,12%' },
  { id: 'med-017', name: 'Fluconazol 150mg' },
  { id: 'med-018', name: 'Hidrocortisona 10mg' },
  { id: 'med-019', name: 'Loratadina 10mg' },
  { id: 'med-020', name: 'Soro fisiológico 0,9%' },
];

export function searchMockMedications(query: string): MockMedication[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return MOCK_MEDICATIONS;
  }

  return MOCK_MEDICATIONS.filter((medication) =>
    medication.name.toLowerCase().includes(normalized),
  );
}
