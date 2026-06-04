export const ADMIN_CSRF_HEADER = 'X-CSRF-Token';

const ADMIN_CSRF_STORAGE_KEY = 'sportsup_admin_csrf_token';
const ADMIN_WRITE_METHODS = new Set(['POST', 'PUT', 'DELETE']);

let fetchPatched = false;
let inMemoryCsrfToken = '';

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function setAdminCsrfToken(token?: string | null): void {
  inMemoryCsrfToken = token || '';

  if (!canUseBrowserStorage()) return;

  try {
    if (token) {
      window.localStorage.setItem(ADMIN_CSRF_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(ADMIN_CSRF_STORAGE_KEY);
    }
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
}

export function getAdminCsrfToken(): string {
  if (inMemoryCsrfToken) return inMemoryCsrfToken;
  if (!canUseBrowserStorage()) return '';

  try {
    inMemoryCsrfToken = window.localStorage.getItem(ADMIN_CSRF_STORAGE_KEY) || '';
  } catch {
    inMemoryCsrfToken = '';
  }

  return inMemoryCsrfToken;
}

export function clearAdminCsrfToken(): void {
  setAdminCsrfToken('');
}

function isAdminSurfacePath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/ipl-admin-2026' ||
    pathname.startsWith('/ipl-admin-2026/') ||
    pathname === '/wpl-admin-2026' ||
    pathname.startsWith('/wpl-admin-2026/')
  );
}

function resolveFetchMethod(input: RequestInfo | URL, init?: RequestInit): string {
  const initMethod = init?.method;
  if (initMethod) return initMethod.toUpperCase();

  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.method.toUpperCase();
  }

  return 'GET';
}

function resolveFetchUrl(input: RequestInfo | URL): URL | null {
  try {
    if (typeof Request !== 'undefined' && input instanceof Request) {
      return new URL(input.url, window.location.origin);
    }

    return new URL(String(input), window.location.origin);
  } catch {
    return null;
  }
}

function shouldAttachAdminCsrf(input: RequestInfo | URL, init?: RequestInit): boolean {
  if (typeof window === 'undefined') return false;

  const method = resolveFetchMethod(input, init);
  if (!ADMIN_WRITE_METHODS.has(method)) return false;

  const url = resolveFetchUrl(input);
  if (!url || url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
    return false;
  }

  return url.pathname.startsWith('/api/admin/') || isAdminSurfacePath(window.location.pathname);
}

export function installAdminCsrfFetch(): void {
  if (typeof window === 'undefined' || fetchPatched) return;

  fetchPatched = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const csrfToken = getAdminCsrfToken();

    if (!csrfToken || !shouldAttachAdminCsrf(input, init)) {
      return originalFetch(input, init);
    }

    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (!headers.has(ADMIN_CSRF_HEADER)) {
      headers.set(ADMIN_CSRF_HEADER, csrfToken);
    }

    return originalFetch(input, {
      ...init,
      headers,
    });
  }) as typeof window.fetch;
}
