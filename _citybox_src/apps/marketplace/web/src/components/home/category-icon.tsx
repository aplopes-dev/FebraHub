const CATEGORY_IDS = new Set([
  'ofertas',
  'supermercado',
  'moda',
  'tecnologia',
  'casa',
  'beleza',
  'esportes',
  'cupons',
]);

export function CategoryIcon({ id, size = 56 }: { id: string; size?: number }) {
  const slug = CATEGORY_IDS.has(id) ? id : 'ofertas';
  return (
    <img
      src={`/assets/categories/${slug}.png`}
      width={size}
      height={size}
      alt=""
      aria-hidden
      className="block size-full object-contain"
      loading="lazy"
    />
  );
}
