import { useEffect, useState } from 'react';
import { useCheckout } from '@/context/AppContext';

const GEO_CACHE_KEY = 'citybox.shipToCity';

function formatCityState(city?: string, state?: string) {
  const c = city?.trim();
  if (!c) return null;
  const s = state?.trim();
  return s ? `${c}, ${s}` : c;
}

/** Só o nome da cidade (sem UF), para frases como "Lojas locais de X". */
function cityNameOnly(city?: string | null) {
  const c = city?.trim();
  if (!c) return null;
  return c.split(',')[0]?.trim() || null;
}

async function reverseGeocode(lat: number, lon: number): Promise<{ label: string; city: string } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('zoom', '10');
    url.searchParams.set('addressdetails', '1');
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
      };
    };
    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality;
    if (!city?.trim()) return null;
    const label = formatCityState(city, data.address?.state);
    if (!label) return null;
    return { label, city: city.trim() };
  } catch {
    return null;
  }
}

function readCachedCity(): string | null {
  try {
    return localStorage.getItem(GEO_CACHE_KEY);
  } catch {
    return null;
  }
}

function writeCachedCity(value: string) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, value);
  } catch {
    /* ignore */
  }
}

function useResolvedLocation() {
  const { selectedAddress, addresses } = useCheckout();
  const [geoLabel, setGeoLabel] = useState<string | null>(() => readCachedCity());

  const fromAddress =
    formatCityState(selectedAddress?.city, selectedAddress?.state) ||
    formatCityState(
      addresses.find((a) => a.isDefault)?.city,
      addresses.find((a) => a.isDefault)?.state,
    ) ||
    formatCityState(addresses[0]?.city, addresses[0]?.state);

  useEffect(() => {
    if (fromAddress || geoLabel) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void reverseGeocode(pos.coords.latitude, pos.coords.longitude).then((result) => {
          if (cancelled || !result) return;
          writeCachedCity(result.label);
          setGeoLabel(result.label);
        });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );

    return () => {
      cancelled = true;
    };
  }, [fromAddress, geoLabel]);

  return fromAddress || geoLabel;
}

/**
 * Cidade resolvida (endereço do usuário ou geolocalização).
 * Retorna `null` quando ainda não há cidade — não inventa placeholder.
 */
export function useShipToCity(): string | null {
  return cityNameOnly(useResolvedLocation());
}

/**
 * Rótulo "Enviar para X": prioriza endereço; senão geo; senão fallback.
 */
export function useShipToLabel(fallback = 'sua localização') {
  return useResolvedLocation() || fallback;
}
