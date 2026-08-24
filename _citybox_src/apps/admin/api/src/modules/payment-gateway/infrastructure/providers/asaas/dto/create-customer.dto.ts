export interface AsaasCreateCustomerDto {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string | null;
  mobilePhone?: string | null;
  postalCode?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  province?: string | null;
  notificationDisabled?: boolean;
}
