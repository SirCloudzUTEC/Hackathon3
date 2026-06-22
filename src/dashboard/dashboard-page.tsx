import { useEffect, useState } from 'react'
import type { DashboardSummary } from '../types/api'
import * as api from '../api/endpoints'
import { Loading } from '../components/loading'
import { EmptyState } from '../components/empty-state'

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getDashboardSummary()
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Error cargando dashboard')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Loading />
  if (error) return <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{error}</div>
  if (!data) return <EmptyState message="Sin datos" />

  const kpis = [
    { label: 'Total Tropeles', value: data.totalTropels, color: 'text-blue-400' },
    { label: 'Tropeles Criticos', value: data.criticalTropels, color: 'text-red-400' },
    { label: 'Senales Abiertas', value: data.openSignals, color: 'text-yellow-400' },
    { label: 'Estabilidad Promedio', value: `${data.sectorStabilityAvg}%`, color: 'text-green-400' },
  ]

  const severityColors: Record<string, string> = {
    LEVE: 'bg-green-500',
    MODERADO: 'bg-yellow-500',
    GRAVE: 'bg-orange-500',
    CRITICO: 'bg-red-500',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-sm text-gray-400">{kpi.label}</p>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h2 className="text-lg font-semibold mb-3">Senales por Severidad</h2>
        <div className="space-y-2">
          {Object.entries(data.signalsBySeverity).map(([severity, count]) => (
            <div key={severity} className="flex items-center gap-3">
              <span className="text-sm text-gray-300 w-24">{severity}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full ${severityColors[severity] ?? 'bg-gray-500'}`}
                  style={{ width: `${(count / data.totalTropels) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-400 w-10 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Generado: {new Date(data.generatedAt).toLocaleString()}
      </p>
    </div>
  )
}
