import React, { useEffect, useMemo, useState } from 'react'
import { mdiFolderOpen, mdiLightbulbOutline, mdiStarOff, mdiStarPlus } from '@mdi/js'
import Select from '../Select.jsx'
import { Icon } from '../Icon.jsx'

export default function ExamplesPanel({ compactUI = false, onLoadExample, onSetDefault, onClearDefault }) {
  const [examples, setExamples] = useState([])
  const [examplesQuery, setExamplesQuery] = useState('')
  const [selected, setSelected] = useState('')
  const [tagFilter, setTagFilter] = useState([])

  useEffect(() => {
    let cancelled = false
    fetch('/presets/index.json')
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        if (!cancelled && Array.isArray(list)) {
          const sorted = list.slice().sort((a, b) => String(a.label || '').localeCompare(String(b.label || '')))
          setExamples(sorted)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const allTags = useMemo(() => {
    const s = new Set()
    for (const e of examples) {
      const tags = Array.isArray(e.tags) ? e.tags : []
      for (const t of tags) s.add(String(t).toLowerCase())
    }
    return Array.from(s).sort()
  }, [examples])

  const filteredExamples = useMemo(() => {
    const q = (examplesQuery || '').toLowerCase().trim()
    let list = examples
    if (q) list = list.filter(e => String(e.label || '').toLowerCase().includes(q))
    if (tagFilter.length) {
      list = list.filter(e => {
        const tags = (e.tags || []).map(t => String(t).toLowerCase())
        return tagFilter.some(t => tags.includes(t))
      })
    }
    return list
  }, [examples, examplesQuery, tagFilter])

  const toggleTag = (t) => setTagFilter(list => list.includes(t) ? list.filter(x=>x!==t) : [...list, t])

  const setDefaultExample = () => {
    if (!selected) return
    if (typeof onSetDefault === 'function') {
      onSetDefault(selected)
    } else {
      try { localStorage.setItem('plotterlab:defaultPreset', selected) } catch {}
    }
  }
  const clearDefaultExample = () => {
    if (typeof onClearDefault === 'function') {
      onClearDefault()
    } else {
      try { localStorage.removeItem('plotterlab:defaultPreset') } catch {}
    }
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur py-2 border-b border-white/10 col-span-2 lg:col-span-3 mt-2">
        <h2 className="font-medium px-1 flex items-center gap-2"><Icon path={mdiLightbulbOutline}/> <span>Examples</span></h2>
      </div>
      <div className="flex gap-2 items-center col-span-2 lg:col-span-3">
        <input className="input flex-1" placeholder="Search examples…" value={examplesQuery} onChange={e=>setExamplesQuery(e.target.value)} />
        <Select className="flex-1" value={selected}
          onChange={(v)=>setSelected(v)}
          options={[{ label: '(Examples)', value: '' }, ...filteredExamples.map(e => ({ label: e.label, value: e.file }))]}
        />
        <button className="btn" onClick={()=>onLoadExample && onLoadExample(selected)} disabled={!selected} title="Load Example">
          {compactUI ? (<><Icon path={mdiFolderOpen}/> Load</>) : (<><Icon path={mdiFolderOpen}/> Load Example</>)}
        </button>
        <button className="btn" onClick={setDefaultExample} disabled={!selected} title="Set Default Example">
          {compactUI ? (<><Icon path={mdiStarPlus}/> Set</>) : (<><Icon path={mdiStarPlus}/> Set Default</>)}
        </button>
        <button className="btn" onClick={clearDefaultExample} title="Clear Default Example">
          {compactUI ? (<><Icon path={mdiStarOff}/> Clear</>) : (<><Icon path={mdiStarOff}/> Clear Default</>)}
        </button>
      </div>
      {allTags.length > 0 && (
        <div className="col-span-2 lg:col-span-3 flex flex-wrap gap-2 -mt-1">
          {allTags.map(t => (
            <button key={t} className={`btn text-xs ${tagFilter.includes(t) ? 'bg-white/10 border-white/30' : ''}`} onClick={()=>toggleTag(t)} title={`Filter: ${t}`}>
              #{t}
            </button>
          ))}
          {tagFilter.length > 0 && (
            <button className="btn text-xs" onClick={()=>setTagFilter([])} title="Clear tag filters">Clear tags</button>
          )}
        </div>
      )}
    </>
  )
}
