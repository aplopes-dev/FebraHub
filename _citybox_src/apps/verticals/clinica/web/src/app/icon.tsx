import { CLINIC_THEME } from '@/features/clinic/lib/theme';
import {
  generateVerticalFavicon,
  VERTICAL_FAVICON_SIZE,
} from '@/lib/vertical-favicon';

export const size = VERTICAL_FAVICON_SIZE;
export const contentType = 'image/png';

export default function Icon() {
  return generateVerticalFavicon(CLINIC_THEME.primaryColor);
}
