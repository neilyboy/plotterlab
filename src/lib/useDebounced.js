import { useEffect, useState } from 'react'

export function useDebouncedValue(value, delay = 60) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return v
}
