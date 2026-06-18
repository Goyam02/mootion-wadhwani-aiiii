const BASE_URL = (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_API_URL) || 
                 (import.meta as any).env?.VITE_NEXT_PUBLIC_API_URL || 
                 (import.meta as any).env?.NEXT_PUBLIC_API_URL || 
                 "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail || `API error with status ${status}`);
    this.status = status;
    this.detail = detail;
    this.name = 'ApiError';
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('mootion_access_token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = data.detail || response.statusText;
    } catch {
      detail = response.statusText;
    }
    throw new ApiError(response.status, detail);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export const api = {
  get: (path: string, options: RequestInit = {}) => request(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options: RequestInit = {}) => request(path, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  }),
  put: (path: string, body?: any, options: RequestInit = {}) => request(path, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  }),
  patch: (path: string, body?: any, options: RequestInit = {}) => request(path, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  }),
  delete: (path: string, options: RequestInit = {}) => request(path, { ...options, method: 'DELETE' }),
};
