export type ProductUnit = {
  id: string;
  name: string;
  city: string;
  uf: string;
};

export const MOCK_PRODUCT_UNITS: ProductUnit[] = [
  {
    id: "unit-boteco-centro",
    name: "Boteco do Cais — Centro",
    city: "Ilhéus",
    uf: "BA",
  },
  {
    id: "unit-boteco-orla",
    name: "Boteco do Cais — Orla",
    city: "Ilhéus",
    uf: "BA",
  },
  {
    id: "unit-moda-centro",
    name: "Moda Ilhéus — Centro",
    city: "Ilhéus",
    uf: "BA",
  },
  {
    id: "unit-emporio-sp",
    name: "Empório Casa & Cozinha — Jardins",
    city: "São Paulo",
    uf: "SP",
  },
  {
    id: "unit-emporio-rj",
    name: "Empório Casa & Cozinha — Copacabana",
    city: "Rio de Janeiro",
    uf: "RJ",
  },
];

export const PRODUCT_UNIT_UF_OPTIONS = [
  { value: "all", label: "Todos" },
  ...Array.from(new Set(MOCK_PRODUCT_UNITS.map((unit) => unit.uf)))
    .sort()
    .map((uf) => ({ value: uf, label: uf })),
] as const;

export function getDefaultSelectedUnitIds(): string[] {
  const first = MOCK_PRODUCT_UNITS[0];
  return first ? [first.id] : [];
}
