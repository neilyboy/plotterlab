import { useEffect, useMemo, useRef, useState } from 'react'

// Lightweight undo/redo history manager for { doc, layers }
// - Snapshots are pushed when debounced contentful state changes occur
// - Excludes view-only props via the caller-provided signatures
// - Bounded history to avoid unbounded memory growth
export function useHistory({
  getDocSnapshot, // () => object (doc without view-only props)
  getLayersSnapshot, // () => array
  setDoc, setLayers,
  max = 100
}) {
  const undoRef = useRef([])
  const redoRef = useRef([])
  const prevDocRef = useRef(null)
  const prevLayersRef = useRef(null)
  const restoringRef = useRef(false)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Initialize prev refs on first run
  useEffect(() => {
    if (prevDocRef.current == null) prevDocRef.current = getDocSnapshot()
    if (prevLayersRef.current == null) prevLayersRef.current = getLayersSnapshot()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const snapshot = () => {
    const curDoc = getDocSnapshot()
    const curLayers = getLayersSnapshot()
    const prevDoc = prevDocRef.current
    const prevLayers = prevLayersRef.current
    // Push the previous value onto undo stack if meaningful change
    const changed = JSON.stringify(prevDoc) !== JSON.stringify(curDoc) || JSON.stringify(prevLayers) !== JSON.stringify(curLayers)
    if (changed) {
      undoRef.current.push({ doc: prevDoc, layers: prevLayers })
      if (undoRef.current.length > max) undoRef.current.shift()
      redoRef.current.length = 0
      prevDocRef.current = curDoc
      prevLayersRef.current = curLayers
      setCanUndo(undoRef.current.length > 0)
      setCanRedo(redoRef.current.length > 0)
    }
  }

  const undo = () => {
    if (!undoRef.current.length) return
    const curDoc = getDocSnapshot()
    const curLayers = getLayersSnapshot()
    const last = undoRef.current.pop()
    redoRef.current.push({ doc: curDoc, layers: curLayers })
    restoringRef.current = true
    setDoc(d => ({ ...d, ...last.doc }))
    setLayers(last.layers)
    // update prev snapshot
    prevDocRef.current = last.doc
    prevLayersRef.current = last.layers
    setCanUndo(undoRef.current.length > 0)
    setCanRedo(redoRef.current.length > 0)
    setTimeout(() => { restoringRef.current = false }, 0)
  }

  const redo = () => {
    if (!redoRef.current.length) return
    const curDoc = getDocSnapshot()
    const curLayers = getLayersSnapshot()
    const next = redoRef.current.pop()
    undoRef.current.push({ doc: curDoc, layers: curLayers })
    restoringRef.current = true
    setDoc(d => ({ ...d, ...next.doc }))
    setLayers(next.layers)
    prevDocRef.current = next.doc
    prevLayersRef.current = next.layers
    setCanUndo(undoRef.current.length > 0)
    setCanRedo(redoRef.current.length > 0)
    setTimeout(() => { restoringRef.current = false }, 0)
  }

  return { canUndo, canRedo, undo, redo, snapshot, restoringRef }
}
