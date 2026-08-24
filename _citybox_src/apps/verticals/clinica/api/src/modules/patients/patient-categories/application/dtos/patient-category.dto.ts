export interface ListPatientCategoriesDto {
  storeId: string;
}

export interface CreatePatientCategoryDto {
  storeId: string;
  name: string;
  colorId: string;
}

export interface UpdatePatientCategoryDto {
  storeId: string;
  id: string;
  name: string;
  colorId: string;
}

export interface DeletePatientCategoryDto {
  storeId: string;
  id: string;
}
