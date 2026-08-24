/**
 * Aba "Corporal" do fluxo "Inicializar" da nutrição — distribuição de gordura,
 * IMC do atendimento e adipometria. Gravada no JSON da inicialização.
 *
 * Os valores numéricos ficam como string porque vêm de inputs controlados; a
 * conversão acontece no cálculo (aceita vírgula decimal).
 */
export type PatientNutritionFatDistribution = '' | 'ginoide' | 'androide';

export type PatientNutritionSkinfoldId =
  | 'tricipital'
  | 'subescapular'
  | 'bicipital'
  | 'axilar'
  | 'iliaca'
  | 'supraespinhal'
  | 'abdominal'
  | 'coxa'
  | 'panturrilha';

export type PatientNutritionSkinfoldMeasures = {
  first: string;
  second: string;
  third: string;
};

export type PatientNutritionAdipometryProtocol = '' | 'petroski';

export type PatientNutritionGirthId =
  | 'braco'
  | 'torax'
  | 'quadril'
  | 'panturrilha'
  | 'femur'
  | 'bracoContraido'
  | 'cintura'
  | 'coxaMediana'
  | 'umero';

export type PatientNutritionGirths = Record<PatientNutritionGirthId, string>;

/** Medida de perimetria criada pelo profissional, fora do catálogo fixo. */
export type PatientNutritionCustomGirth = {
  id: string;
  label: string;
  value: string;
};

export type PatientNutritionCelluliteGrade =
  | ''
  | 'grau_1'
  | 'grau_2'
  | 'grau_3'
  | 'grau_4';

export type PatientNutritionStretchMarkType = '' | 'alba' | 'rubra';

export type PatientNutritionRectusDiastasisResult =
  | ''
  | 'negativo'
  | 'positivo';

export type PatientNutritionRectusDiastasisType =
  | ''
  | 'tipo_a'
  | 'tipo_b'
  | 'tipo_c'
  | 'tipo_d';

/** Nível da escala de silhuetas de aparência (1 a 9). */
export type PatientNutritionAppearanceLevel =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9;

export type PatientNutritionBody = {
  fatDistribution: PatientNutritionFatDistribution;
  celluliteGrade: PatientNutritionCelluliteGrade;
  stretchMarks: PatientNutritionStretchMarkType;
  notes: string;
  rectusDiastasis: PatientNutritionRectusDiastasisResult;
  rectusDiastasisType: PatientNutritionRectusDiastasisType;
  rectusDiastasisNotes: string;
  perceivedAppearance: PatientNutritionAppearanceLevel | '';
  desiredAppearance: PatientNutritionAppearanceLevel | '';
  weightKg: string;
  heightCm: string;
  adipometryProtocol: PatientNutritionAdipometryProtocol;
  skinfolds: Record<
    PatientNutritionSkinfoldId,
    PatientNutritionSkinfoldMeasures
  >;
  girths: PatientNutritionGirths;
  customGirths: PatientNutritionCustomGirth[];
};
