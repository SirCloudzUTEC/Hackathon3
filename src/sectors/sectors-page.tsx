import { useEffect, useState } from 'react'
import type { Sector } from '../types/api'
import * as api from '../api/endpoints'
import { Loading } from '../components/loading'
import { EmptyState } from '../components/empty-state'
import { SectorCard } from './sector-card'

export function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .getSectors()
      .then((res) => {
        if (!cancelled) setSectors(res.items)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar sectores')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="rounded-lg border border-red-700 bg-red-900/50 px-4 py-3 text-red-300">
        {error}
      </div>
    )
  }

  if (!sectors.length) return <EmptyState message="No hay sectores registrados" />

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Sectores</h1>
        <p className="text-sm text-gray-400">
          Selecciona un sector para recorrer su historia paso a paso.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <SectorCard key={sector.id} sector={sector} />
        ))}
      </div>
    </div>
  )
}
