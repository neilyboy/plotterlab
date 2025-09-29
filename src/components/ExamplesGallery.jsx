import React, { useEffect, useMemo, useRef, useState } from 'react'
// Gallery now uses static thumbnails only from /static/thumbs

// Simple in-memory + localStorage cache of resolved URLs to avoid flicker
const getCacheKey = (file, variant='final') => `plotterlab:thumb_url:${variant}:${file}`
const readCache = (k) => { try { return localStorage.getItem(k) || '' } catch { return '' } }
const writeCache = (k, v) => { try { localStorage.setItem(k, v) } catch {} }

const staticUrlFor = (file, variant='final') => {
  const base = String(file).replace(/[^A-Za-z0-9_\-\.]+/g,'_').replace(/\.json$/i,'')
  return `/static/thumbs/${base}.${variant}.svg`
}
const baseFor = (file) => String(file).replace(/[^A-Za-z0-9_\-\.]+/g,'_').replace(/\.json$/i,'')

// We render square tiles for consistency; images are object-contain inside

function useOnScreen(ref) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) setVisible(true)
      }
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return visible
}

function Tile({ entry, onLoad, aspectRatio = '1 / 1', onToast }) {
  const { label, file } = entry
  const ref = useRef(null)
  const boxRef = useRef(null)
  const onScreen = useOnScreen(ref)
  const [src, setSrc] = useState('')
  const [triedDraft, setTriedDraft] = useState(false)
  const [failed, setFailed] = useState(false)
  const [pxH, setPxH] = useState(0)

  useEffect(() => {
    if (!onScreen || src) return
    const dkey = getCacheKey(file, 'draft')
    const fkey = getCacheKey(file, 'final')
    const dCached = readCache(dkey)
    const fCached = readCache(fkey)
    const draftUrl = dCached || staticUrlFor(file, 'draft')
    const finalUrl = fCached || staticUrlFor(file, 'final')
    // Show draft immediately
    setSrc(draftUrl)
    // Try to upgrade to final in background
    const img = new Image()
    img.onload = () => { writeCache(fkey, finalUrl); setSrc(finalUrl) }
    img.onerror = () => {}
    img.src = finalUrl

  }, [onScreen, file, src])

  // Fallback: keep the tile perfectly square by syncing height to width
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const apply = () => setPxH(el.clientWidth)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const dataUrl = src

  return (
    <div ref={ref} className="bg-panel rounded-md border border-white/10 overflow-hidden flex flex-col cursor-pointer" onClick={()=>onLoad && onLoad(file)} title={`Open ${label}`}> 
      <div ref={boxRef} className="w-full bg-black/40 flex items-center justify-center relative" style={{ aspectRatio, width: '100%', height: pxH || undefined, minHeight: '120px' }}>
        <div className="absolute top-1 right-1 flex gap-1">
          <a
            className="btn text-[10px] px-2 py-0.5 bg-white/10 border border-white/20 hover:bg-white/20"
            href={staticUrlFor(file, 'final')}
            target="_blank"
            onClick={(e)=> e.stopPropagation()}
            rel="noreferrer"
          >Open</a>
          <button
            className="btn text-[10px] px-2 py-0.5 bg-white/10 border border-white/20 hover:bg-white/20"
            onClick={(e)=>{
              e.stopPropagation()
              const url = staticUrlFor(file, 'final')
              const abs = url.startsWith('http') ? url : (window.location.origin + url)
              navigator.clipboard?.writeText(abs).then(()=>{
                onToast && onToast('Link copied')
              }).catch(()=>{ onToast && onToast('Copy failed') })
            }}
          >Copy</button>
        </div>
        {dataUrl && !failed ? (
          <img
            src={dataUrl}
            alt={label}
            loading="lazy"
            className="w-full h-full object-contain block"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="text-xs opacity-70 p-4">No thumbnail</div>
        )}
      </div>
      <div className="p-2 flex items-center justify-between gap-2">
        <div className="text-xs opacity-80 truncate" title={label}>{label}</div>
        <button className="btn" onClick={(e)=>{ e.stopPropagation(); onLoad && onLoad(file) }}>Load</button>
      </div>
    </div>
  )
}

export default function ExamplesGallery({ open, onClose, onLoad }) {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [size, setSize] = useState('l') // 's' | 'm' | 'l'
  const [toast, setToast] = useState('')
  // Static-only mode: no client-side generation

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch('/presets/index.json').then(r => r.ok ? r.json() : []).then(arr => {
      if (!cancelled && Array.isArray(arr)) setList(arr)
    })
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    const s = (q||'').toLowerCase().trim()
    if (!s) return list
    return list.filter(e => String(e.label||'').toLowerCase().includes(s))
  }, [list, q])

  if (!open) return null
  const tileMin = size === 'l' ? 260 : (size === 'm' ? 200 : 150)
  const gap = size === 's' ? 'gap-2' : (size === 'm' ? 'gap-3' : 'gap-4')
  const aspectRatio = '1 / 1' // square thumbs so height matches width
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col" onClick={(e)=>{ if (e.target === e.currentTarget) onClose && onClose() }}>
      <div className="mx-auto my-6 w-[min(1400px,96vw)] h-[min(88vh,1000px)] bg-panel rounded-md border border-white/10 overflow-hidden flex flex-col relative">
        <div className="p-2 border-b border-white/10 flex items-center gap-2">
          <div className="font-medium">Examples Gallery</div>
          <input className="input flex-1" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
          <div className="flex items-center gap-1 text-xs">
            <span className="opacity-70">Size</span>
            <button className={`btn ${size==='s'?'bg-white/10 border-white/30':''}`} onClick={()=>setSize('s')}>S</button>
            <button className={`btn ${size==='m'?'bg-white/10 border-white/30':''}`} onClick={()=>setSize('m')}>M</button>
            <button className={`btn ${size==='l'?'bg-white/10 border-white/30':''}`} onClick={()=>setSize('l')}>L</button>
          </div>
          <button className="btn" onClick={()=>onClose && onClose()}>Close</button>
        </div>
        <div className="p-3 overflow-auto">
          <div className={`grid ${gap}`} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${tileMin}px, 1fr))` }}>
            {filtered.map((e, i) => (
              <Tile key={e.file + ':' + i} entry={e} onLoad={onLoad} aspectRatio={aspectRatio} onToast={setToast} />
            ))}
          </div>
        </div>
        {toast ? (
          <div className="absolute bottom-3 right-3 pointer-events-none">
            <div className="px-3 py-2 rounded bg-black/80 text-white text-xs border border-white/10 shadow">
              {toast}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
