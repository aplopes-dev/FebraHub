import { contactFromLead, type LeadContactInfo } from '@/features/shared/utils/lead-contact';

/** Contato a partir dos campos já presentes no lead (sem ir ao store local). */
export function resolveLeadContactById(lead: {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}): LeadContactInfo {
  return contactFromLead(lead);
}
