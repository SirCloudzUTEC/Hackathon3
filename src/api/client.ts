const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

let authToken: string | null = localStorage.getItem('token')

export function setAuthToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }
}

export function getAuthToken(): string | null {
  return authToken
}

export class ApiError extends Error {
  status: number
  code: string
  details?: Record<string, unknown>

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      body?.error ?? 'UNKNOWN_ERROR',
      body?.message ?? `HTTP ${response.status}`,
      body?.details,
    )
  }

  return response.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
}
