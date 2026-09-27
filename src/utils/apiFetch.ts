/** Same-origin API helper that sends ALTIL's browser session bearer token. */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  try {
    const token = localStorage.getItem('altil_auth_token');
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  } catch {
    // Server-rendered or privacy-restricted contexts can still authenticate by cookie.
  }
  return fetch(input, { ...init, headers, credentials: init.credentials || 'same-origin' });
}
