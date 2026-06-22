export interface User {
  id: string
  displayName: string
  email: string
  teamCode: string
  role: 'OPERATOR'
}

export interface LoginResponse {
  token: string
  expiresAt: string
  user: User
}

export interface DashboardSummary {
  totalTropels: number
  criticalTropels: number
  openSignals: number
  sectorStabilityAvg: number
  signalsBySeverity: Record<string, number>
  generatedAt: string
}

export interface Sector {
  id: string
  sectorCode: string
  name: string
  climate: Climate
  capacity: number
  currentLoad: number
  stabilityLevel: number
}

export type Climate = 'PIXEL_FOREST' | 'NEON_CAVE' | 'CLOUD_AQUARIUM' | 'RETRO_ARCADE'

export type Species = 'BLOBITO' | 'CHISPA' | 'GRUNON' | 'DORMILON' | 'GLITCHY'

export type VitalState = 'ESTABLE' | 'HAMBRIENTO' | 'AGITADO' | 'MUTANDO' | 'CRITICO'

export interface Tropel {
  id: string
  name: string
  species: Species
  vitalState: VitalState
  energyLevel: number
  chaosIndex: number
  mutationStage: number
  guardianName: string
  sector: {
    id: string
    name: string
    sectorCode: string
  }
  createdAt: string
  updatedAt: string
}

export interface TropelPage {
  content: Tropel[]
  totalElements: number
  totalPages: number
  currentPage: number
  size: number
}

export type SignalType = 'HAMBRE' | 'ABANDONO' | 'MUTACION' | 'FUGA' | 'CONFLICTO' | 'REPRODUCCION_MASIVA' | 'SENAL_CORRUPTA'

export type Severity = 'LEVE' | 'MODERADO' | 'GRAVE' | 'CRITICO'

export type SignalStatus = 'RECIBIDA' | 'PROCESANDO' | 'ATENDIDA'

export interface Signal {
  id: string
  signalType: SignalType
  severity: Severity
  status: SignalStatus
  rawContent: string
  tropel: {
    id: string
    name: string
    species: Species
  }
  createdAt: string
  updatedAt: string
}

export interface SignalFeedResponse {
  items: Signal[]
  nextCursor: string | null
  hasMore: boolean
  totalEstimate: number
}

export interface StoryStage {
  id: string
  order: number
  title: string
  narrative: string
  dominantEvent: string
  metrics: {
    stability: number
    energy: number
    alerts: number
  }
  assetKey: string
  colorToken: string
  progress: number
}

export interface StoryResponse {
  sector: {
    id: string
    name: string
    climate: Climate
  }
  stages: StoryStage[]
}

export type SortOption = 'name,asc' | 'updatedAt,desc' | 'chaosIndex,desc'
