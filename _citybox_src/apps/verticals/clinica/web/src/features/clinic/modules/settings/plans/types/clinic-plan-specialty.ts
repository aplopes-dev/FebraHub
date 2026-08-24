export type PlanTreatmentItem = {
  id: string;
  name: string;
  treatmentValue: string;
  treatmentCost: string;
  enabled: boolean;
  /** Quando true, o odontograma do orçamento exibe faces M/O/I/D/V/L/P. Persistido em clinic-plans. */
  acceptsFaces: boolean;
  /** Override opcional do locationUiType da especialidade. */
  locationUiType?: ClinicPlanLocationUiType | null;
};

export type PlanSpecialtyItem = {
  id: string;
  name: string;
  /** Define o seletor de local no orçamento (dente, HOF, corpo, sessão ou nenhum). */
  locationUiType?: ClinicPlanLocationUiType;
  treatments: PlanTreatmentItem[];
};

export type ClinicPlanLocationUiType =
  | 'tooth'
  | 'face_region'
  | 'body_region'
  | 'session'
  | 'none';
