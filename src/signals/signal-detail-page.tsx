import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Signal } from '../types/api'
import * as api from '../api/endpoints'
import { Loading } from '../components/loading'

export function SignalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [signal, setSignal] = useState<Signal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<'PROCESANDO' | 'ATENDIDA' | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    api
      .getSignal(id)
      .then((res) => { if (!cancelled) setSignal(res) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  async function handleStatusChange(newStatus: 'PROCESANDO' | 'ATENDIDA') {
    if (!id) return
    setPendingStatus(newStatus)
    setUpdating(true)
    setUpdateError(null)
    setSuccess(null)
    try {
      const updated = await api.updateSignalStatus(id, newStatus)
      setSignal(updated)
      setSuccess(`Estado actualizado a ${newStatus}`)
      setPendingStatus(null)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Error actualizando estado')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <Loading />
  if (error) return (
    <div className="space-y-4">
      <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{error}</div>
      <Link to="/signals" className="text-blue-400 hover:underline">Volver al feed</Link>
    </div>
  )
  if (!signal) return null

  return (
    <div className="space-y-6">
      <div>
        <Link to="/signals" className="text-sm text-blue-400 hover:underline">
          &larr; Volver al feed
        </Link>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                {signal.signalType}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                signal.severity === 'CRITICO' ? 'bg-red-900 text-red-300' :
                signal.severity === 'GRAVE' ? 'bg-orange-900 text-orange-300' :
                'bg-gray-800 text-gray-300'
              }`}>
                {signal.severity}
              </span>
            </div>
            <h1 className="text-xl font-bold">Detalle de Senal</h1>
            <p className="text-sm text-gray-400">ID: {signal.id}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${
            signal.status === 'ATENDIDA' ? 'bg-green-900 text-green-300' :
            signal.status === 'PROCESANDO' ? 'bg-yellow-900 text-yellow-300' :
            'bg-gray-800 text-gray-300'
          }`}>
            {signal.status}
          </span>
        </div>

        <div className="border-t border-gray-800 pt-4">
          <h2 className="text-sm text-gray-400 mb-1">Contenido</h2>
          <p className="text-gray-200">{signal.rawContent}</p>
        </div>

        <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Tropel: </span>
            <span className="text-gray-300">{signal.tropel.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Especie: </span>
            <span className="text-gray-300">{signal.tropel.species}</span>
          </div>
          <div>
            <span className="text-gray-500">Creada: </span>
            <span className="text-gray-300">{new Date(signal.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Actualizada: </span>
            <span className="text-gray-300">{new Date(signal.updatedAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4">
          <h2 className="text-sm text-gray-400 mb-3">Cambiar Estado</h2>
          <div className="flex gap-3">
            <button
              disabled={updating || signal.status === 'PROCESANDO'}
              onClick={() => handleStatusChange('PROCESANDO')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
            >
              {updating ? 'Procesando...' : 'Marcar PROCESANDO'}
            </button>
            <button
              disabled={updating || signal.status === 'ATENDIDA'}
              onClick={() => handleStatusChange('ATENDIDA')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
            >
              {updating ? 'Procesando...' : 'Marcar ATENDIDA'}
            </button>
          </div>
        </div>

        {success && (
          <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {updateError && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
            {updateError}
            {pendingStatus && (
              <button
                disabled={updating}
                onClick={() => handleStatusChange(pendingStatus)}
                className="ml-3 underline hover:text-white disabled:opacity-50"
              >
                Reintentar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
