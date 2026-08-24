export interface AddressDTO {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export abstract class ICepProvider {
  abstract getAddressByCep(cep: string): Promise<AddressDTO | null>;
}
