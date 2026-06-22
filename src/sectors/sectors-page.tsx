import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Sector } from '../types/api'
import * as api from '../api/endpoints'
import { Loading } from '../components/loading'
import { EmptyState } from '../components/empty-state'

const climateLabels: Record<string, string> = {
  PIXEL_FOREST: 'Bosque Pixel',
  NEON_CUEVA: 'Cueva Neon',
  CLOUD_AQUARIUM: 'Acuario Nube',
  RETRO_ARCADE: 'Arcade Retro',
  NEON_CAVE: 'Cueva Neon',
}

export function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getSectors()
      .then((res) => {
        if (!cancelled) setSectors(res.items)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Loading />
  if (error) return <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{error}</div>
  if (!sectors.length) return <EmptyState message="No hay sectores" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sectores</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map((s) => (
          <Link
            key={s.id}
            to={`/sectors/${s.id}/story`}
            className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-600 transition-colors"
          >
            <h3 className="font-semibold text-lg">{s.name}</h3>
            <p className="text-sm text-gray-400">{climateLabels[s.climate] ?? s.climate}</p>
            <div className="mt-3 flex justify-between text-sm text-gray-300">
              <span>Carga: {s.currentLoad}/{s.capacity}</span>
              <span>Estabilidad: {s.stabilityLevel}%</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
