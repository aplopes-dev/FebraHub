import {
  mapClinicSettingsToPdfClinic,
  type PatientPdfClinicInfo,
} from "@/features/clinic/modules/patients/lib/patient-pdf-shared";
import type { getClinicProfile } from "@/features/clinic/modules/settings/services/clinic-profile.service";

export function toPdfClinicInfo(
  profile: Awaited<ReturnType<typeof getClinicProfile>> | undefined,
): PatientPdfClinicInfo {
  if (!profile) {
    return { clinicName: "Clínica" };
  }

  return mapClinicSettingsToPdfClinic(profile);
}
