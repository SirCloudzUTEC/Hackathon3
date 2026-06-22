import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'

export function useUrlState<T extends Record<string, string>>() {
  const [searchParams, setSearchParams] = useSearchParams()

  const get = useCallback(
    <K extends keyof T & string>(key: K): T[K] | undefined => {
      const val = searchParams.get(key)
      return (val as T[K]) ?? undefined
    },
    [searchParams],
  )

  const set = useCallback(
    (updates: Partial<T>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) {
          if (v === undefined || v === '') {
            next.delete(k)
          } else {
            next.set(k, String(v))
          }
        }
        return next
      })
    },
    [setSearchParams],
  )

  return { get, set, searchParams }
}
