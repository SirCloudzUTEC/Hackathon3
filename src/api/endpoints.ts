import { api } from './client'
import type {
  LoginResponse,
  User,
  DashboardSummary,
  TropelPage,
  Tropel,
  SignalFeedResponse,
  Signal,
  Sector,
  StoryResponse,
  SortOption,
} from '../types/api'

export function login(teamCode: string, email: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { teamCode, email, password })
}

// GET /auth/me devuelve el objeto User directamente (no envuelto en { user }).
export function getMe() {
  return api.get<User>('/auth/me')
}

export function getDashboardSummary() {
  return api.get<DashboardSummary>('/dashboard/summary')
}

export function getTropels(params: {
  page?: number
  size?: number
  species?: string
  vitalState?: string
  sectorId?: string
  q?: string
  sort?: SortOption
}) {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.size != null) searchParams.set('size', String(params.size))
  if (params.species) searchParams.set('species', params.species)
  if (params.vitalState) searchParams.set('vitalState', params.vitalState)
  if (params.sectorId) searchParams.set('sectorId', params.sectorId)
  if (params.q) searchParams.set('q', params.q)
  if (params.sort) searchParams.set('sort', params.sort)
  const qs = searchParams.toString()
  return api.get<TropelPage>(`/tropels${qs ? `?${qs}` : ''}`)
}

export function getTropel(id: string) {
  return api.get<Tropel>(`/tropels/${id}`)
}

export function getSignalsFeed(
  params: {
    cursor?: string
    limit?: number
    signalType?: string
    severity?: string
    status?: string
    q?: string
  },
  signal?: AbortSignal,
) {
  const searchParams = new URLSearchParams()
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.limit != null) searchParams.set('limit', String(params.limit))
  if (params.signalType) searchParams.set('signalType', params.signalType)
  if (params.severity) searchParams.set('severity', params.severity)
  if (params.status) searchParams.set('status', params.status)
  if (params.q) searchParams.set('q', params.q)
  const qs = searchParams.toString()
  return api.get<SignalFeedResponse>(`/signals/feed${qs ? `?${qs}` : ''}`, signal)
}

export function getSignal(id: string) {
  return api.get<Signal>(`/signals/${id}`)
}

export function updateSignalStatus(id: string, status: 'PROCESANDO' | 'ATENDIDA') {
  return api.patch<Signal>(`/signals/${id}/status`, { status })
}

export function getSectors() {
  return api.get<{ items: Sector[] }>('/sectors')
}

export function getSectorStory(id: string) {
  return api.get<StoryResponse>(`/sectors/${id}/story`)
}
