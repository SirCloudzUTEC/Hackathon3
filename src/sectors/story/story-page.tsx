import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { StoryResponse } from '../../types/story'
import * as api from '../../api/endpoints'
import { Loading } from '../../components/loading'
import { EmptyState } from '../../components/empty-state'
import { StoryVisual } from './story-visual'
import { StoryProgress } from './story-progress'
import { StoryStage } from './story-stage'
import { useScrollStage } from './use-scroll-stage'
import { useKeyboardNav } from './use-keyboard-nav'
import './scroll-animations.css'

export function StoryPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<StoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .getSectorStory(id)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar la historia')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  const stageCount = data?.stages.length ?? 0
  const { activeIndex, registerRef, scrollToStage } = useScrollStage(stageCount)

  const handleNavigate = useCallback(
    (index: number) => {
      scrollToStage(index)
    },
    [scrollToStage],
  )

  useKeyboardNav({
    activeIndex,
    count: stageCount,
    onNavigate: handleNavigate,
    enabled: !loading && !error && stageCount > 0,
  })

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-700 bg-red-900/50 px-4 py-3 text-red-300">
          {error}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Reintentar
          </button>
          <Link to="/sectors" className="self-center text-sm text-blue-400 hover:underline">
            Volver a sectores
          </Link>
        </div>
      </div>
    )
  }

  if (!data || data.stages.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState message="Este sector aún no tiene historia" />
        <Link to="/sectors" className="text-sm text-blue-400 hover:underline">
          Volver a sectores
        </Link>
      </div>
    )
  }

  const { sector, stages } = data

  return (
    <div className="relative -mx-4 -mt-4">
      {/* Fondo visual persistente (CSS puro, reacciona a colorToken/assetKey). */}
      <StoryVisual stages={stages} activeIndex={activeIndex} climate={sector.climate} />

      {/* Cabecera fija con progreso. */}
      <header
        className="sticky top-0 z-10 border-b border-white/10 bg-black/40 px-4 py-4 backdrop-blur-md"
        style={{ viewTransitionName: `sector-${sector.id}` }}
      >
        <div className="mx-auto max-w-3xl">
          <Link to="/sectors" viewTransition className="text-xs text-gray-400 hover:text-white">
            &larr; Sectores
          </Link>
          <h1 className="mt-1 text-xl font-bold text-white">{sector.name}</h1>
          <div className="mt-3">
            <StoryProgress stages={stages} activeIndex={activeIndex} onSelect={scrollToStage} />
          </div>
        </div>
      </header>

      {/* Pista de accesibilidad para la navegación por teclado. */}
      <p className="sr-only" aria-live="polite">
        Usa las flechas para cambiar de etapa. Etapa {activeIndex + 1} de {stages.length}:{' '}
        {stages[activeIndex]?.title}.
      </p>

      {/* Etapas de la narrativa. */}
      <main className="mx-auto max-w-3xl px-4 pb-24">
        {stages.map((stage, index) => (
          <StoryStage
            key={stage.id}
            stage={stage}
            index={index}
            isActive={index === activeIndex}
            registerRef={registerRef(index)}
          />
        ))}
      </main>
    </div>
  )
}
