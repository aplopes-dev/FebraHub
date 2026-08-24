import type { PatientFile } from '../types/patient-file';

export function downloadPatientFile(file: PatientFile): boolean {
  const url = file.contentUrl ?? file.previewUrl;
  if (!url) {
    return false;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  return true;
}
