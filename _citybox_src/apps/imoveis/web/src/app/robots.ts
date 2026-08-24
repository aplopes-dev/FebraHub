import type { MetadataRoute } from 'next';
import { getPublicAppOrigin } from '@/lib/public-app-url';

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicAppOrigin();

  return {
    rules: {
      userAgent: '*',
      allow: ['/agents/', '/p/'],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
