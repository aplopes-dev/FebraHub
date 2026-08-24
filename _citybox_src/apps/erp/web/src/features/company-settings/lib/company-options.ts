/** Catálogos de apoio do cadastro da empresa (mock). */

export type CompanyOption = {
  value: string;
  label: string;
};

export const SEGMENT_OPTIONS: CompanyOption[] = [
  { value: "food", label: "Alimentação e bebidas" },
  { value: "retail", label: "Varejo" },
  { value: "market", label: "Mercado e conveniência" },
  { value: "services", label: "Serviços" },
  { value: "beauty", label: "Beleza e estética" },
  { value: "health", label: "Saúde" },
  { value: "education", label: "Educação" },
  { value: "other", label: "Outros" },
];

/** Amostra de CNAEs mais usados pelos segmentos atendidos. */
export const CNAE_OPTIONS: CompanyOption[] = [
  { value: "5611-2/01", label: "5611-2/01 — Restaurantes e similares" },
  { value: "5611-2/03", label: "5611-2/03 — Lanchonetes e casas de chá" },
  { value: "5611-2/05", label: "5611-2/05 — Bares e outros com entretenimento" },
  { value: "5620-1/04", label: "5620-1/04 — Fornecimento de alimentos preparados" },
  { value: "4712-1/00", label: "4712-1/00 — Minimercados e mercearias" },
  { value: "4711-3/02", label: "4711-3/02 — Supermercados" },
  { value: "4781-4/00", label: "4781-4/00 — Comércio varejista de vestuário" },
  { value: "4772-5/00", label: "4772-5/00 — Comércio varejista de cosméticos" },
  { value: "9602-5/01", label: "9602-5/01 — Cabeleireiros e estética" },
  { value: "8630-5/03", label: "8630-5/03 — Atividade médica ambulatorial" },
  { value: "8599-6/04", label: "8599-6/04 — Treinamento em desenvolvimento profissional" },
  { value: "9512-6/00", label: "9512-6/00 — Reparação de equipamentos de informática" },
];

export const BRAND_COLOR_OPTIONS: CompanyOption[] = [
  { value: "#3F43BF", label: "Citybox" },
  { value: "#2563EB", label: "Blue" },
  { value: "#0EA5E9", label: "Sky" },
  { value: "#4F46E5", label: "Indigo" },
  { value: "#9333EA", label: "Purple" },
  { value: "#7C3AED", label: "Violet" },
  { value: "#DB2777", label: "Pink" },
  { value: "#DC2626", label: "Red" },
  { value: "#EA580C", label: "Orange" },
  { value: "#D97706", label: "Amber" },
  { value: "#16A34A", label: "Green" },
  { value: "#059669", label: "Emerald" },
  { value: "#0D9488", label: "Teal" },
  { value: "#475569", label: "Slate" },
  { value: "#6B7280", label: "Gray" },
  { value: "#52525B", label: "Zinc" },
  { value: "#525252", label: "Neutral" },
  { value: "#57534E", label: "Stone" },
  { value: "#374151", label: "Charcoal" },
];
