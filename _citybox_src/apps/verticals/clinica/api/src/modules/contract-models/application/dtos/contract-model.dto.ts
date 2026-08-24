export interface CreateContractModelDto {
  storeId: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface UpdateContractModelDto {
  storeId: string;
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface ListContractModelsDto {
  storeId: string;
}

export interface DeleteContractModelDto {
  storeId: string;
  id: string;
}
