import type { Clinic } from '../../../domain/entities/clinic.entity';
import type { ListClinicsResult } from '../../../application/use-cases/list-clinics.use-case';
import { toClinicStrandProfile } from '../../../application/clinic-strand-profile';

export const ClinicsPresenter = {
  one(clinic: Clinic) {
    return {
      id: clinic.id,
      organizationId: clinic.organizationId,
      name: clinic.name,
      slug: clinic.slug,
      isRoot: clinic.isRoot,
      status: clinic.status,
      legalName: clinic.props.legalName,
      document: clinic.props.document,
      stateRegistration: clinic.props.stateRegistration,
      address: {
        zipCode: clinic.props.zipCode,
        street: clinic.props.street,
        number: clinic.props.number,
        complement: clinic.props.complement,
        neighborhood: clinic.props.neighborhood,
        city: clinic.props.city,
        state: clinic.props.state,
      },
      phone: clinic.props.phone,
      timezone: clinic.timezone,
      createdAt: clinic.props.createdAt.toISOString(),
    };
  },

  list(result: ListClinicsResult) {
    return {
      organization: {
        id: result.organization.id,
        storeId: result.organization.storeId,
        name: result.organization.name,
        status: result.organization.status,
        overQuota: result.organization.overQuota,
        ...toClinicStrandProfile(result.organization.clinicStrand),
        plan: {
          tier: result.organization.plan.tier,
          maxClinics: result.organization.plan.maxClinics,
          maxUsers: result.organization.plan.maxUsers,
        },
      },
      remainingSlots: result.remainingSlots,
      items: result.clinics.map(ClinicsPresenter.one),
    };
  },
};
