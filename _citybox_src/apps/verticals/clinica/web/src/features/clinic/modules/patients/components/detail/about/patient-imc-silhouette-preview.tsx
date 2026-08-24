'use client';

import { cn } from '@citybox/ui';
import {
  patientImcSilhouetteSrc,
  type PatientImcSilhouetteSex,
  type PatientImcSilhouetteVariant,
} from '@/lib/patient-imc';

type PatientImcSilhouettePreviewProps = {
  variant: PatientImcSilhouetteVariant;
  sex?: PatientImcSilhouetteSex;
  className?: string;
  alt?: string;
};

export function PatientImcSilhouettePreview({
  variant,
  sex = 'male',
  className,
  alt = 'Silhueta corporal ilustrativa conforme IMC',
}: PatientImcSilhouettePreviewProps) {
  return (
    <div
      className={cn(
        'mx-auto flex h-[14rem] w-full max-w-[6.75rem] items-end justify-center',
        className,
      )}
    >
      {/* SVG estático em /public — <img> evita bloqueio do next/image com .svg */}
      <img
        src={patientImcSilhouetteSrc(variant, sex)}
        alt={alt}
        className="h-full w-auto max-w-full object-contain object-bottom"
        decoding="async"
      />
    </div>
  );
}
