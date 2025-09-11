import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function Select({ options = [], value, onChange, className = '', buttonClassName = '', placeholder = 'Select', tooltip = '', prefix = null, variant = 'input' }) {
  const [open, setOpen] = useState(false)
  const [hoverIndex, setHoverIndex] = useState(-1)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const optionRefs = useRef([])
  const typeaheadRef = useRef('')
  const typeTimerRef = useRef(null)
  const idRef = useRef('sel_' + Math.random().toString(36).slice(2, 8))

  const safeOptions = Array.isArray(options) ? options.filter(Boolean) : []

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
    }
  }, [])

  // Close list when bound value changes (prevents stale menus remaining open)
  useEffect(() => { setOpen(false) }, [value])

  // Keep refs length in sync with options
  useEffect(() => { optionRefs.current = optionRefs.current.slice(0, safeOptions.length) }, [safeOptions.length])

  // Ensure the hovered/selected option is scrolled into view
  useEffect(() => {
    if (!open) return
    const idx = hoverIndex >= 0 ? hoverIndex : Math.max(0, safeOptions.findIndex(o => o.value === value))
    const el = optionRefs.current[idx]
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' })
  }, [open, hoverIndex, safeOptions, value])

  const current = useMemo(() => safeOptions.find(o => o.value === value), [safeOptions, value])
  const label = current ? current.label : placeholder

  const openMenu = () => {
    setOpen(true)
    // Default hover to current selection
    const idx = Math.max(0, safeOptions.findIndex(o => o.value === value))
    setHoverIndex(idx)
  }
  const closeMenu = () => setOpen(false)

  const commitSelection = (idx) => {
    const opt = safeOptions[idx]
    if (!opt) return
    onChange && onChange(opt.value)
    setOpen(false)
  }

  const moveHover = (delta) => {
    if (!open) openMenu()
    const cur = hoverIndex >= 0 ? hoverIndex : Math.max(0, safeOptions.findIndex(o => o.value === value))
    const n = ((cur + delta) % safeOptions.length + safeOptions.length) % safeOptions.length
    setHoverIndex(n)
  }

  const typeahead = (ch) => {
    const now = (typeaheadRef.current + ch).toLowerCase()
    typeaheadRef.current = now
    if (typeTimerRef.current) clearTimeout(typeTimerRef.current)
    typeTimerRef.current = setTimeout(() => { typeaheadRef.current = '' }, 600)
    const i = safeOptions.findIndex(o => String(o.label || '').toLowerCase().startsWith(now))
    if (i >= 0) {
      if (!open) openMenu()
      setHoverIndex(i)
    }
  }

  const onButtonKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!open) openMenu(); else moveHover(+1); break
      case 'ArrowUp': e.preventDefault(); if (!open) openMenu(); else moveHover(-1); break
      case 'Home': e.preventDefault(); if (!open) openMenu(); setHoverIndex(0); break
      case 'End': e.preventDefault(); if (!open) openMenu(); setHoverIndex(Math.max(0, safeOptions.length - 1)); break
      case 'Enter':
      case ' ': // Space
        e.preventDefault(); if (!open) openMenu(); else commitSelection(hoverIndex >= 0 ? hoverIndex : Math.max(0, safeOptions.findIndex(o => o.value === value))); break
      case 'Escape': if (open) { e.preventDefault(); closeMenu() } break
      default:
        if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(e.key)
        break
    }
  }

  const listboxId = `${idRef.current}_list`

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={`${variant === 'button' ? 'btn h-8 py-0 justify-between' : 'input h-8 py-0 text-left bg-zinc-800 text-white'} whitespace-nowrap overflow-hidden text-ellipsis focus:outline-none ${variant === 'button' ? '' : 'focus:ring-2 focus:ring-cyan-400/70'} ${buttonClassName}`}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onButtonKeyDown}
        title={tooltip ? `${label} — ${tooltip}` : label}
      >
        <span className="inline-flex items-center gap-2">
          {prefix ? <span className="inline-flex items-center opacity-80">{prefix}</span> : null}
          <span>{label}</span>
        </span>
        <span className="float-right opacity-70 select-none">▾</span>
      </button>
      {open && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 mt-1 w-full min-w-[10rem] max-h-64 overflow-auto rounded-md border border-white/10 bg-zinc-800 text-white shadow-soft"
        >
          {safeOptions.map((o, i) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              ref={(el) => (optionRefs.current[i] = el)}
              className={`px-3 py-1.5 cursor-pointer ${i === hoverIndex ? 'bg-white/20' : (o.value === value ? 'bg-white/10' : 'hover:bg-white/10')}`}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseDown={(e) => { e.preventDefault(); commitSelection(i) }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
