import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Signal, SignalFeedResponse } from '../types/api'
import * as api from '../api/endpoints'
import { useUrlState } from '../hooks/use-url-state'
import { Loading } from '../components/loading'

type SignalFilters = {
  signalType: string
  severity: string
  status: string
  q: string
}

const SIGNAL_TYPES = ['', 'HAMBRE', 'ABANDONO', 'MUTACION', 'FUGA', 'CONFLICTO', 'REPRODUCCION_MASIVA', 'SENAL_CORRUPTA']
const SEVERITIES = ['', 'LEVE', 'MODERADO', 'GRAVE', 'CRITICO']
const STATUSES = ['', 'RECIBIDA', 'PROCESANDO', 'ATENDIDA']

export function SignalsFeedPage() {
  const { get, set } = useUrlState<SignalFilters>()

  const signalType = get('signalType') ?? ''
  const severity = get('severity') ?? ''
  const status = get('status') ?? ''
  const q = get('q') ?? ''

  const [items, setItems] = useState<Signal[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalEstimate, setTotalEstimate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(
    async (cur: string | null, append: boolean, signal?: AbortSignal) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)

      try {
        const res: SignalFeedResponse = await api.getSignalsFeed({
          cursor: cur ?? undefined,
          limit: 15,
          signalType: signalType || undefined,
          severity: severity || undefined,
          status: status || undefined,
          q: q || undefined,
        }, { signal })

        if (signal?.aborted) return

        setItems((prev) => {
          const existingIds = append ? new Set(prev.map((s) => s.id)) : new Set()
          const newItems = res.items.filter((s) => !existingIds.has(s.id))
          return append ? [...prev, ...newItems] : newItems
        })
        setCursor(res.nextCursor)
        setHasMore(res.hasMore)
        setTotalEstimate(res.totalEstimate)
      } catch (err) {
        if (signal?.aborted) return
        setError(err instanceof Error ? err.message : 'Error cargando senales')
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [signalType, severity, status, q],
  )

  // Reset on filter change with AbortController
  useEffect(() => {
    const controller = new AbortController()
    setItems([])
    setCursor(null)
    setHasMore(true)
    loadPage(null, false, controller.signal)
    return () => controller.abort()
  }, [signalType, severity, status, q, loadPage])

  // Intersection Observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadPage(cursor, true)
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [cursor, hasMore, loadingMore, loading, loadPage])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Feed de Senales</h1>
      <p className="text-sm text-gray-400">~{totalEstimate} senales totales</p>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Tipo</label>
          <select
            value={signalType}
            onChange={(e) => set({ signalType: e.target.value })}
            className="bg-gray-800 text-white text-sm px-2 py-1.5 rounded-lg border border-gray-700"
          >
            {SIGNAL_TYPES.map((s) => (
              <option key={s} value={s}>{s || 'Todos'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Severidad</label>
          <select
            value={severity}
            onChange={(e) => set({ severity: e.target.value })}
            className="bg-gray-800 text-white text-sm px-2 py-1.5 rounded-lg border border-gray-700"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s || 'Todas'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Estado</label>
          <select
            value={status}
            onChange={(e) => set({ status: e.target.value })}
            className="bg-gray-800 text-white text-sm px-2 py-1.5 rounded-lg border border-gray-700"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || 'Todos'}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-400 mb-1">Buscar</label>
          <input
            type="text"
            value={q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Contenido..."
            className="w-full bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Feed */}
      {error && items.length === 0 ? (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => loadPage(null, false)} className="ml-3 underline hover:text-white">
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hay senales</div>
      ) : (
        <div className="space-y-2">
          {items.map((signal) => (
            <Link
              key={signal.id}
              to={`/signals/${signal.id}`}
              className="block bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                    {signal.signalType}
                  </span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    signal.severity === 'CRITICO' ? 'bg-red-900 text-red-300' :
                    signal.severity === 'GRAVE' ? 'bg-orange-900 text-orange-300' :
                    'bg-gray-800 text-gray-300'
                  }`}>
                    {signal.severity}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  signal.status === 'ATENDIDA' ? 'bg-green-900 text-green-300' :
                  signal.status === 'PROCESANDO' ? 'bg-yellow-900 text-yellow-300' :
                  'bg-gray-800 text-gray-300'
                }`}>
                  {signal.status}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-2">{signal.rawContent}</p>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Tropel: {signal.tropel.name} ({signal.tropel.species})</span>
                <span>{new Date(signal.createdAt).toLocaleString()}</span>
              </div>
            </Link>
          ))}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-1" />

          {loadingMore && <Loading />}

          {!hasMore && items.length > 0 && (
            <div className="text-center py-4 text-sm text-gray-500">Fin del feed</div>
          )}

          {error && items.length > 0 && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
              Error cargando mas senales
              <button onClick={() => loadPage(cursor, true)} className="ml-3 underline hover:text-white">
                Reintentar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
