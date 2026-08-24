export type DashboardDemographicGenderFilter =
  | 'all'
  | 'female'
  | 'male'
  | 'uninformed';

export type DashboardDemographicGender = 'female' | 'male' | 'uninformed';

export type PatientDemographicsRow = {
  birthDate: Date | null;
  gender: 'male' | 'female' | 'other';
};

export type DashboardAgeSeriesPoint = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type DashboardGenderShare = {
  gender: DashboardDemographicGender;
  label: string;
  count: number;
  percent: number;
};

export type DashboardPatientDemographicsResult = {
  filteredTotalCount: number;
  totalCount: number;
  ageSeries: DashboardAgeSeriesPoint[];
  genderShares: DashboardGenderShare[];
};
