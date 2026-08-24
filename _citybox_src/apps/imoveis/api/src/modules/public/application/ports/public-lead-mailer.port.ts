export type PublicLeadEmailPayload = {
  to: string;
  agentName: string;
  leadId: string;
  leadName: string;
  leadPhone?: string;
  leadEmail?: string;
  message?: string;
  propertyName?: string;
  agentSlug: string;
  storeId: string;
};

/** Envia e-mail de alerta quando um lead chega pelo catálogo público. */
export abstract class PublicLeadMailer {
  abstract sendLeadAlert(
    payload: PublicLeadEmailPayload,
  ): Promise<PublicLeadEmailPayload>;
}
