export interface TreatmentEvolutionScopeDto {
  storeId: string;
  patientId: string;
}

export interface ListTreatmentEvolutionsDto extends TreatmentEvolutionScopeDto {}

export interface CreateStandaloneEvolutionDto extends TreatmentEvolutionScopeDto {
  professionalId: string;
  professionalName?: string;
  finalizedAt: Date;
  evolutionNotes: string;
}

export interface UpdateTreatmentEvolutionDto extends TreatmentEvolutionScopeDto {
  id: string;
  professionalId: string;
  professionalName?: string;
  finalizedAt: Date;
  evolutionNotes: string;
}

export interface DeleteTreatmentEvolutionDto extends TreatmentEvolutionScopeDto {
  id: string;
}

export interface GetEvolutionHistoryDto extends TreatmentEvolutionScopeDto {
  id: string;
}
