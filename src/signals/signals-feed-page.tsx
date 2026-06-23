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

/**
 * Caché del feed a nivel de módulo (sobrevive al desmontaje del componente al
 * navegar al detalle). Conserva las páginas ya cargadas y la posición de scroll
 * para una sola combinación de filtros (`key`), de modo que volver del detalle
 * restaura el feed exactamente donde estaba en vez de recargar desde la página 1.
 */
interface FeedCache {
  key: string
  items: Signal[]
  cursor: string | null
  hasMore: boolean
  totalEstimate: number
  scrollY: number
}
let feedCache: FeedCache | null = null

/**
 * Refleja en el caché del feed una señal actualizada (p. ej. tras un PATCH de
 * estado en el detalle), de modo que al volver atrás el feed muestre el nuevo
 * estado sin recargar todo desde la primera página.
 */
export function syncCachedSignal(updated: Signal): void {
  if (!feedCache) return
  feedCache = {
    ...feedCache,
    items: feedCache.items.map((s) => (s.id === updated.id ? updated : s)),
  }
}

export function SignalsFeedPage() {
  const { get, set } = useUrlState<SignalFilters>()

  const signalType = get('signalType') ?? ''
  const severity = get('severity') ?? ''
  const status = get('status') ?? ''
  const q = get('q') ?? ''

  const filterKey = `${signalType}|${severity}|${status}|${q}`
  const cached = feedCache && feedCache.key === filterKey ? feedCache : null

  const [items, setItems] = useState<Signal[]>(() => cached?.items ?? [])
  const [cursor, setCursor] = useState<string | null>(() => cached?.cursor ?? null)
  const [hasMore, setHasMore] = useState(() => cached?.hasMore ?? true)
  const [totalEstimate, setTotalEstimate] = useState(() => cached?.totalEstimate ?? 0)
  const [loading, setLoading] = useState(() => !cached)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Controlador de cancelación compartido: una sola petición de feed viva a la
  // vez. Cambiar de filtro o disparar otra carga aborta la anterior, evitando
  // que una respuesta tardía (reset o load-more) contamine la lista actual.
  const abortRef = useRef<AbortController | null>(null)

  const loadPage = useCallback(
    async (cur: string | null, append: boolean, signal?: AbortSignal) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)

      try {
        const res: SignalFeedResponse = await api.getSignalsFeed(
          {
            cursor: cur ?? undefined,
            limit: 15,
            signalType: signalType || undefined,
            severity: severity || undefined,
            status: status || undefined,
            q: q || undefined,
          },
          signal,
        )

        // Descarta respuestas que llegaron tras una cancelación (race condition).
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
        // Una cancelación no es un error de usuario: se ignora silenciosamente.
        if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
          return
        }
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

  // En el primer render hidratamos desde caché (al volver del detalle): no
  // recargamos y restauramos el scroll. Solo aplica al montaje inicial.
  const hydrateOnMountRef = useRef(!!cached)
  const initialKeyRef = useRef(filterKey)

  // Reset on filter change
  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller

    if (hydrateOnMountRef.current && filterKey === initialKeyRef.current) {
      hydrateOnMountRef.current = false
      const y = feedCache?.key === filterKey ? feedCache.scrollY : 0
      // Doble rAF: espera a que la lista hidratada esté pintada antes de scrollear.
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)))
      return () => controller.abort()
    }

    setItems([])
    setCursor(null)
    setHasMore(true)
    loadPage(null, false, controller.signal)
    return () => controller.abort()
  }, [signalType, severity, status, q, loadPage, filterKey])

  // Mantiene el caché al día con las páginas cargadas (preservando el scrollY ya
  // registrado para esta combinación de filtros).
  useEffect(() => {
    const prevScroll = feedCache && feedCache.key === filterKey ? feedCache.scrollY : 0
    feedCache = { key: filterKey, items, cursor, hasMore, totalEstimate, scrollY: prevScroll }
  }, [filterKey, items, cursor, hasMore, totalEstimate])

  // Registra la posición de scroll para restaurarla al volver del detalle.
  useEffect(() => {
    const onScroll = () => {
      if (feedCache && feedCache.key === filterKey) feedCache.scrollY = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [filterKey])

  // Intersection Observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          // Reusa el controlador del filtro vigente: si el filtro cambia, su
          // abort() también cancela esta carga incremental.
          loadPage(cursor, true, abortRef.current?.signal)
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
