'use client';

import { Box } from '@citybox/mui/atoms';
import { PropertyImage } from '@/components/ui/property-image';
import { AuthPropertyPhoto } from '@/features/properties/components/auth-property-photo';
import type { MatchedProperty } from '../types';

type MatchedPropertyThumbProps = {
  property: Pick<MatchedProperty, 'id' | 'coverPhotoUrl'>;
  size?: number;
  alt?: string;
  borderRadius?: string;
  /** Preenche 100% do container pai (ex.: card 92×120 na sidebar). */
  fill?: boolean;
};

export function MatchedPropertyThumb({
  property,
  size = 56,
  alt = '',
  borderRadius = '12px',
  fill = false,
}: MatchedPropertyThumbProps) {
  return (
    <Box
      sx={{
        ...(fill
          ? { width: '100%', height: '100%' }
          : { width: size, height: size }),
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius,
        bgcolor: 'action.hover',
      }}
    >
      {property.coverPhotoUrl ? (
        <AuthPropertyPhoto
          src={property.coverPhotoUrl}
          alt={alt}
          className="size-full object-cover"
        />
      ) : (
        <PropertyImage seed={property.id} alt={alt} />
      )}
    </Box>
  );
}
