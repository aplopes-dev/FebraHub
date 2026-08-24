import type {
  PatientNutritionCustomGirth,
  PatientNutritionGirthId,
  PatientNutritionGirths,
} from '../types/patient-nutrition-body';

/**
 * Perimetria da aba "Corporal" da nutrição. Os `id` são persistidos no JSON da
 * inicialização — alterá-los descarta medidas já gravadas.
 *
 * `image` é opcional: sem arquivo em `public/clinic/nutricao/perimetria/`, o
 * tooltip mostra só o texto.
 */
export type NutritionGirth = {
  id: PatientNutritionGirthId;
  label: string;
  tooltipTitle: string;
  tooltipText: string;
  image?: string;
};

export const NUTRITION_GIRTHS: readonly NutritionGirth[] = [
  {
    id: 'braco',
    label: 'Braço',
    tooltipTitle: 'Perímetro do Braço',
    tooltipText:
      'Aplica-se a fita no mesmo ponto mesobraquial utilizado para as medidas das dobras tricipital e bicipital, com o braço relaxado.',
    image: '/clinic/nutricao/perimetria/braco.jpg',
  },
  {
    id: 'torax',
    label: 'Tórax',
    tooltipTitle: 'Perímetro do Tórax',
    tooltipText:
      'Na altura da 4ª costela, a fita deve permanecer na horizontal, ou seja, em paralelo ao solo. A leitura deve ser feita após uma expiração normal.',
    image: '/clinic/nutricao/perimetria/torax.jpg',
  },
  {
    id: 'quadril',
    label: 'Quadril',
    tooltipTitle: 'Perímetro do Quadril',
    tooltipText:
      'Ao nível do trocanter femoral, aplicar a fita horizontalmente na região de maior perímetro do glúteo, mantendo o avaliado com os pés unidos.',
    image: '/clinic/nutricao/perimetria/quadril.jpg',
  },
  {
    id: 'panturrilha',
    label: 'Panturrilha',
    tooltipTitle: 'Perímetro da Panturrilha',
    tooltipText:
      'Com o avaliado em pé e as pernas levemente afastadas, aplica-se a fita no ponto de maior volume da panturrilha.',
    image: '/clinic/nutricao/perimetria/panturrilha.jpg',
  },
  {
    id: 'femur',
    label: 'Fêmur',
    tooltipTitle: 'Diâmetro do Fêmur',
    tooltipText:
      'O paquímetro é aplicado nos epicôndilos femorais com entrada superior e as hastes a 45º para baixo. O sujeito deve permanecer sentado com a perna fletida a 90º.',
    image: '/clinic/nutricao/perimetria/femur.jpg',
  },
  {
    id: 'bracoContraido',
    label: 'Braço contraído',
    tooltipTitle: 'Perímetro do Braço Contraído',
    tooltipText:
      'Aplica-se a fita no ponto de maior volume do bíceps, alcançado pelo indivíduo quando este realiza uma contração máxima, sem ajuda da outra mão.',
    image: '/clinic/nutricao/perimetria/braco-contraido.jpg',
  },
  {
    id: 'cintura',
    label: 'Cintura',
    tooltipTitle: 'Perímetro da Cintura',
    tooltipText:
      'Aplica-se a fita horizontalmente no ponto de menor perímetro da cintura. A leitura da medida é feita quando o sujeito termina a fase expiratória.',
    image: '/clinic/nutricao/perimetria/cintura.jpg',
  },
  {
    id: 'coxaMediana',
    label: 'Coxa mediana',
    tooltipTitle: 'Perímetro da Coxa Média',
    tooltipText:
      'No mesmo local de medida da dobra cutânea da coxa. Nesta medida o sujeito deve permanecer de pé com o peso distribuído.',
    image: '/clinic/nutricao/perimetria/coxa-mediana.jpg',
  },
  {
    id: 'umero',
    label: 'Úmero',
    tooltipTitle: 'Diâmetro do Úmero',
    tooltipText:
      'Com a palma da mão voltada para o rosto do paciente e o cotovelo fletido a 90º, o paquímetro deve entrar inferiormente em um ângulo de 45º para cima.',
    image: '/clinic/nutricao/perimetria/umero.jpg',
  },
];

export function createEmptyNutritionGirths(): PatientNutritionGirths {
  return NUTRITION_GIRTHS.reduce(
    (accumulated, girth) => ({ ...accumulated, [girth.id]: '' }),
    {} as PatientNutritionGirths,
  );
}

export function parseNutritionGirths(raw: unknown): PatientNutritionGirths {
  const source =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  return NUTRITION_GIRTHS.reduce((accumulated, girth) => {
    const value = source[girth.id];
    return {
      ...accumulated,
      [girth.id]: typeof value === 'string' ? value : '',
    };
  }, {} as PatientNutritionGirths);
}

/** Medidas livres adicionadas pelo profissional; descarta entradas sem rótulo. */
export function parseNutritionCustomGirths(
  raw: unknown,
): PatientNutritionCustomGirth[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];

    const source = entry as Record<string, unknown>;
    const id = typeof source.id === 'string' ? source.id : '';
    const label = typeof source.label === 'string' ? source.label : '';
    if (!id || !label.trim()) return [];

    return [
      {
        id,
        label,
        value: typeof source.value === 'string' ? source.value : '',
      },
    ];
  });
}
