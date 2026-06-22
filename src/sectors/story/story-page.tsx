import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { StoryResponse, StoryStage, Climate } from '../../types/api'
import * as api from '../../api/endpoints'
import { Loading } from '../../components/loading'

const COLOR_MAP: Record<string, string> = {
  emerald: 'from-emerald-500 to-emerald-900',
  blue: 'from-blue-500 to-blue-900',
  violet: 'from-violet-500 to-violet-900',
  amber: 'from-amber-500 to-amber-900',
  rose: 'from-rose-500 to-rose-900',
  cyan: 'from-cyan-500 to-cyan-900',
  lime: 'from-lime-500 to-lime-900',
  fuchsia: 'from-fuchsia-500 to-fuchsia-900',
}

const CLIMATE_BG: Record<Climate, string> = {
  PIXEL_FOREST: 'bg-gradient-to-br from-emerald-950 to-green-950',
  NEON_CAVE: 'bg-gradient-to-br from-violet-950 to-purple-950',
  CLOUD_AQUARIUM: 'bg-gradient-to-br from-cyan-950 to-blue-950',
  RETRO_ARCADE: 'bg-gradient-to-br from-amber-950 to-orange-950',
}

const EVENT_ICONS: Record<string, string> = {
  HAMBRE: '⚡',
  ABANDONO: '🌑',
  MUTACION: '🧬',
  FUGA: '💨',
  CONFLICTO: '⚔️',
  REPRODUCCION_MASIVA: '🌟',
  SENAL_CORRUPTA: '🔮',
}

interface StoryPageProps {}

export function StoryPage(_props: StoryPageProps) {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<StoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState(0)

  const stageRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    api
      .getSectorStory(id)
      .then((res: StoryResponse) => { if (!cancelled) setData(res) })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const index = stageRefs.current.indexOf(entry.target as HTMLDivElement)
        if (index !== -1) {
          setActiveStage(index)
        }
      }
    }
  }, [])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const threshold = prefersReduced ? 0.1 : 0.4

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '-20% 0px -40% 0px',
      threshold,
    })

    stageRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [data, handleIntersection])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!data) return
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        const next = Math.min(activeStage + 1, data.stages.length - 1)
        stageRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        const prev = Math.max(activeStage - 1, 0)
        stageRefs.current[prev]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeStage, data])

  if (loading) return <Loading />
  if (error) return (
    <div className="space-y-4">
      <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{error}</div>
      <Link to="/sectors" className="text-blue-400 hover:underline">Volver a sectores</Link>
    </div>
  )
  if (!data) return null

  const { sector, stages } = data
  const currentStage = stages[activeStage]

  return (
    <div className="min-h-screen -mx-4 -mt-4">
      {/* Header sticky con info del sector */}
      <div className={`sticky top-0 z-10 ${CLIMATE_BG[sector.climate] ?? 'bg-gray-900'} bg-opacity-95 backdrop-blur-sm border-b border-gray-800 px-4 py-4`}>
        <div className="max-w-4xl mx-auto">
          <Link to="/sectors" className="text-xs text-gray-400 hover:text-white">
            &larr; Sectores
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-xl font-bold">{sector.name}</h1>
              <p className="text-sm text-gray-400">{sector.climate}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Etapa {activeStage + 1} de {stages.length}</p>
              {currentStage && (
                <p className="text-xs text-gray-500">{currentStage.title}</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700"
              style={{ width: `${((activeStage + 1) / stages.length) * 100}%` }}
            />
          </div>

          {/* Stage dots */}
          <div className="flex justify-between mt-2">
            {stages.map((s: StoryStage, i: number) => (
              <button
                key={s.id}
                onClick={() => stageRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === activeStage ? 'bg-blue-400' :
                  i < activeStage ? 'bg-blue-600' : 'bg-gray-700'
                }`}
                title={s.title}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Visual persistente que cambia con la etapa */}
      <div className="relative">
        <div
          className={`absolute inset-0 bg-gradient-to-b ${COLOR_MAP[currentStage?.colorToken ?? 'emerald']} opacity-10 transition-all duration-1000`}
        />

        {/* Stages */}
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-0">
          {stages.map((stage: StoryStage, index: number) => (
            <div
              key={stage.id}
              ref={(el) => { stageRefs.current[index] = el }}
              className={`min-h-[60vh] flex flex-col justify-center py-12 transition-opacity duration-500 ${
                index === activeStage ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div className={`transform transition-all duration-500 ${
                index === activeStage ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
              }`}>
                {/* Event icon + stage number */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{EVENT_ICONS[stage.dominantEvent] ?? '📌'}</span>
                  <span className="text-sm text-gray-500 font-mono">ESTAPA {stage.order + 1}</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold mb-4">{stage.title}</h2>

                {/* Narrative */}
                <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">
                  {stage.narrative}
                </p>

                {/* Metrics */}
                <div className="mt-6 grid grid-cols-3 gap-4 max-w-md">
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-xs text-gray-500">Estabilidad</p>
                    <p className="text-xl font-bold text-blue-400">{stage.metrics.stability}%</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-xs text-gray-500">Energia</p>
                    <p className="text-xl font-bold text-green-400">{stage.metrics.energy}%</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-xs text-gray-500">Alertas</p>
                    <p className="text-xl font-bold text-red-400">{stage.metrics.alerts}</p>
                  </div>
                </div>

                {/* Asset key visual hint */}
                <div className="mt-4 text-xs text-gray-600 font-mono">
                  #{stage.assetKey}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
