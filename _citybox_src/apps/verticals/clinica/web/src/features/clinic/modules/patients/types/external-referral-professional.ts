export type ExternalReferralProfessional = {
  id: string;
  name: string;
  phone: string;
  cro: string;
};

export type ExternalReferralProfessionalInput = {
  name: string;
  phone?: string;
  cro?: string;
};
