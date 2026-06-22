import { useEffect, useState, useCallback } from 'react'
import type { TropelPage, SortOption } from '../types/api'
import * as api from '../api/endpoints'
import { useUrlState } from '../hooks/use-url-state'
import { Loading } from '../components/loading'
import { EmptyState } from '../components/empty-state'

type TropelFilters = {
  page: string
  size: string
  species: string
  vitalState: string
  sectorId: string
  q: string
  sort: string
}

const SPECIES_OPTIONS = ['', 'BLOBITO', 'CHISPA', 'GRUNON', 'DORMILON', 'GLITCHY']
const VITAL_OPTIONS = ['', 'ESTABLE', 'HAMBRIENTO', 'AGITADO', 'MUTANDO', 'CRITICO']
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'updatedAt,desc', label: 'Mas recientes' },
  { value: 'name,asc', label: 'Nombre A-Z' },
  { value: 'chaosIndex,desc', label: 'Caos (mayor)' },
]

export function TropelsPage() {
  const { get, set } = useUrlState<TropelFilters>()
  const page = Number(get('page') ?? '0')
  const size = Number(get('size') ?? '20')
  const species = get('species') ?? ''
  const vitalState = get('vitalState') ?? ''
  const sectorId = get('sectorId') ?? ''
  const q = get('q') ?? ''
  const sort = (get('sort') ?? 'updatedAt,desc') as SortOption

  const [data, setData] = useState<TropelPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .getTropels({ page, size, species, vitalState, sectorId, q, sort })
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Error cargando tropeles')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [page, size, species, vitalState, sectorId, q, sort])

  useEffect(() => {
    const cleanup = fetchData()
    return cleanup
  }, [fetchData])

  const totalPages = data?.totalPages ?? 0
  const tropels = data?.content ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tropeles</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Especie</label>
          <select
            value={species}
            onChange={(e) => set({ species: e.target.value, page: '0' })}
            className="bg-gray-800 text-white text-sm px-2 py-1.5 rounded-lg border border-gray-700"
          >
            {SPECIES_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || 'Todas'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Estado Vital</label>
          <select
            value={vitalState}
            onChange={(e) => set({ vitalState: e.target.value, page: '0' })}
            className="bg-gray-800 text-white text-sm px-2 py-1.5 rounded-lg border border-gray-700"
          >
            {VITAL_OPTIONS.map((v) => (
              <option key={v} value={v}>{v || 'Todos'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Ordenar</label>
          <select
            value={sort}
            onChange={(e) => set({ sort: e.target.value, page: '0' })}
            className="bg-gray-800 text-white text-sm px-2 py-1.5 rounded-lg border border-gray-700"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Tamano pagina</label>
          <select
            value={String(size)}
            onChange={(e) => set({ size: e.target.value, page: '0' })}
            className="bg-gray-800 text-white text-sm px-2 py-1.5 rounded-lg border border-gray-700"
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-400 mb-1">Buscar</label>
          <input
            type="text"
            value={q}
            onChange={(e) => set({ q: e.target.value, page: '0' })}
            placeholder="Nombre del tropel..."
            className="w-full bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => fetchData()}
            className="ml-3 text-sm underline hover:text-white"
          >
            Reintentar
          </button>
        </div>
      ) : tropels.length === 0 ? (
        <EmptyState message="No se encontraron tropeles con estos filtros" />
      ) : (
        <>
          <div className="text-sm text-gray-400">
            {data?.totalElements} tropeles encontrados — Pagina {page + 1} de {totalPages}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tropels.map((t) => (
              <div
                key={t.id}
                className="bg-gray-900 rounded-xl p-4 border border-gray-800"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{t.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                    {t.species}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{t.sector.name}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Estado: </span>
                    <span className={t.vitalState === 'CRITICO' ? 'text-red-400' : 'text-gray-300'}>
                      {t.vitalState}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Energia: </span>
                    <span className="text-gray-300">{t.energyLevel}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Caos: </span>
                    <span className={t.chaosIndex > 50 ? 'text-orange-400' : 'text-gray-300'}>
                      {t.chaosIndex}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Guardian: </span>
                    <span className="text-gray-300">{t.guardianName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginacion */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              disabled={page <= 0}
              onClick={() => set({ page: String(page - 1) })}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-400">
              Pagina {page + 1} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => set({ page: String(page + 1) })}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  )
}
