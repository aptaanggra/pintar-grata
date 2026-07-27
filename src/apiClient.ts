/**
 * API Client helper for resolving API URLs and handling network responses cleanly.
 */

export const getApiBaseUrl = (): string => {
  const metaEnv = (import.meta as any).env;
  const envUrl = metaEnv?.VITE_API_URL || (typeof window !== 'undefined' ? (window as any).VITE_API_URL : '');
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    return 'https://pintar-grata.onrender.com';
  }
  return '';
};

export const getApiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};

export async function safeFetchJson<T>(
  endpoint: string,
  options: RequestInit = {},
  userId: string = 'guest'
): Promise<T | null> {
  const url = getApiUrl(endpoint);
  const headers = {
    'x-user-id': userId,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    console.warn(`[API Client] Non-JSON or unsuccessful response from ${url}: Status ${res.status}`);
    return null;
  } catch (error) {
    console.warn(`[API Client] Fetch failed for ${url}:`, error);
    return null;
  }
}
