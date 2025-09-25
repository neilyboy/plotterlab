import React from 'react'
import { Icon } from '../Icon.jsx'
import Select from '../Select.jsx'
import { mdiFileDocumentOutline, mdiContentSave, mdiDelete, mdiStarPlus, mdiStar, mdiSwapHorizontal, mdiShuffleVariant } from '@mdi/js'

export default function ToolsPanel({
  compactUI = false,
  superCompact = true,
  doc,
  setDoc,
  labelClass,
  paperOptions = [],
  paperFavorites = [],
  saveCurrentPaperAs,
  deleteCurrentCustomPaper,
  toggleFavoritePaper,
  applyPaperSize,
  applyOrientation,
  computeStart,
  numEdit,
  setNumEdit,
  regenerateSeed
}) {
  return (
    <div className="rounded-lg p-3 bg-black/20 border border-white/5">
      <h2 className="font-medium mb-2 flex items-center gap-2"><Icon path={mdiFileDocumentOutline}/> <span>Document</span></h2>
      <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
        <label className="flex flex-col gap-1" title="Preset paper sizes. 'Custom' uses your Width/Height below.">Paper Size
          <Select value={doc.paperSize || 'custom'} onChange={(v)=>applyPaperSize(v)}
            options={paperOptions.map(p=>({label:p.label, value:p.key}))}
          />
        </label>
        <label className="flex flex-col gap-1" title="Rotate the page; swaps Width/Height when needed.">Orientation
          <Select value={doc.orientation || 'landscape'} onChange={(v)=>applyOrientation(v)}
            options={[{label:'Landscape', value:'landscape'},{label:'Portrait', value:'portrait'}]}
          />
        </label>
        <div className="col-span-2 lg:col-span-3 flex flex-wrap gap-2 items-center">
          <button className="btn" onClick={saveCurrentPaperAs} title="Save current paper size">
            {compactUI ? (<><Icon path={mdiContentSave}/> Save</>) : (<><Icon path={mdiContentSave}/> Save Size</>)}
          </button>
          <button className="btn" onClick={deleteCurrentCustomPaper} disabled={!String(doc.paperSize||'').startsWith('CUST_')} title="Delete current custom size">
            {compactUI ? (<><Icon path={mdiDelete}/> Delete</>) : (<><Icon path={mdiDelete}/> Delete</>)}
          </button>
          <button className="btn" onClick={()=>toggleFavoritePaper(doc.paperSize || '')} disabled={!doc.paperSize || doc.paperSize==='custom'} title={paperFavorites.includes(doc.paperSize||'') ? 'Remove favorite size' : 'Add favorite size'}>
            {paperFavorites.includes(doc.paperSize||'')
              ? (compactUI ? (<><Icon path={mdiStar}/> Unfav</>) : (<><Icon path={mdiStar}/> Unfavorite</>))
              : (compactUI ? (<><Icon path={mdiStarPlus}/> Fav</>) : (<><Icon path={mdiStarPlus}/> Add Favorite</>))}
          </button>
          <button className="btn" title="Swap Width / Height" onClick={()=>{
            setDoc(d=>{
              const w = d.height, h = d.width
              const ori = w >= h ? 'landscape' : 'portrait'
              if (d.startPreset && d.startPreset !== 'custom') {
                const mx = Number.isFinite(d.marginX) ? d.marginX : d.margin
                const my = Number.isFinite(d.marginY) ? d.marginY : d.margin
                const { x, y } = computeStart(d.startPreset, w, h, mx, my, d.startUseMargin)
                return { ...d, width: w, height: h, orientation: ori, paperSize: 'custom', startX: x, startY: y }
              }
              return { ...d, width: w, height: h, orientation: ori, paperSize: 'custom' }
            })
          }}>{compactUI ? (<><Icon path={mdiSwapHorizontal}/> Swap</>) : (<><Icon path={mdiSwapHorizontal}/> Swap W/H</>)}</button>
        </div>
        <div className="col-span-2 lg:col-span-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1" title="Page width (mm). Setting values switches to Custom size.">Width
            <input className="input" type="text" inputMode="decimal" value={(numEdit['D:width'] ?? String(doc.width))}
              onChange={e=>{
                const txt = e.target.value
                setNumEdit(m=>({ ...m, ['D:width']: txt }))
                const w = parseFloat(txt)
                if (txt !== '' && Number.isFinite(w)) {
                  setDoc(d=>{
                    if (d.startPreset && d.startPreset !== 'custom') {
                      const mx = Number.isFinite(d.marginX) ? d.marginX : d.margin
                      const my = Number.isFinite(d.marginY) ? d.marginY : d.margin
                      const { x, y } = computeStart(d.startPreset, w, d.height, mx, my, d.startUseMargin)
                      return { ...d, width: w, paperSize: 'custom', startX: x, startY: y }
                    }
                    return { ...d, width: w, paperSize: 'custom' }
                  })
                }
              }}
              onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:width']; return n })}
            />
          </label>
          <label className="flex flex-col gap-1" title="Page height (mm). Setting values switches to Custom size.">Height
            <input className="input" type="text" inputMode="decimal" value={(numEdit['D:height'] ?? String(doc.height))}
              onChange={e=>{
                const txt = e.target.value
                setNumEdit(m=>({ ...m, ['D:height']: txt }))
                const h = parseFloat(txt)
                if (txt !== '' && Number.isFinite(h)) {
                  setDoc(d=>{
                    if (d.startPreset && d.startPreset !== 'custom') {
                      const mx = Number.isFinite(d.marginX) ? d.marginX : d.margin
                      const my = Number.isFinite(d.marginY) ? d.marginY : d.margin
                      const { x, y } = computeStart(d.startPreset, d.width, h, mx, my, d.startUseMargin)
                      return { ...d, height: h, paperSize: 'custom', startX: x, startY: y }
                    }
                    return { ...d, height: h, paperSize: 'custom' }
                  })
                }
              }}
              onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:height']; return n })}
            />
          </label>
        </div>
        <div className="col-span-2 lg:col-span-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1" title="Uniform margin (mm) used by start presets and clipping.">Margin
            <input className="input" type="text" inputMode="decimal" value={(numEdit['D:margin'] ?? String(doc.margin))}
              onChange={e=>{
                const txt = e.target.value
                setNumEdit(m=>({ ...m, ['D:margin']: txt }))
                const mVal = parseFloat(txt)
                if (txt !== '' && Number.isFinite(mVal)) {
                  setDoc(d=>{
                    const m = mVal
                    if (d.startPreset && d.startPreset !== 'custom') {
                      const mx = Number.isFinite(d.marginX) ? d.marginX : m
                      const my = Number.isFinite(d.marginY) ? d.marginY : m
                      const { x, y } = computeStart(d.startPreset, d.width, d.height, mx, my, d.startUseMargin)
                      return { ...d, margin: m, startX: x, startY: y }
                    }
                    return { ...d, margin: m }
                  })
                }
              }}
              onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:margin']; return n })}
            />
          </label>
          <label className="flex flex-col gap-1" title="Optional overflow past the paper edge (mm) for exports.">Bleed (mm)
            <input className="input" type="text" inputMode="decimal" value={(numEdit['D:bleed'] ?? String(doc.bleed))}
              onChange={e=>{
                const txt = e.target.value
                setNumEdit(m=>({ ...m, ['D:bleed']: txt }))
                const v = parseFloat(txt)
                if (txt !== '' && Number.isFinite(v)) setDoc(d=>({ ...d, bleed: Math.max(0, v) }))
              }}
              onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:bleed']; return n })}
            />
          </label>
        </div>
        <div className="col-span-2 lg:col-span-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1" title="Override horizontal margin (mm). Falls back to Margin if blank.">Margin X (optional)
            <input className="input" type="text" inputMode="decimal" value={(numEdit['D:marginX'] ?? (Number.isFinite(doc.marginX)? String(doc.marginX) : ''))}
              placeholder={String(doc.margin)}
              onChange={e=>{
                const txt = e.target.value
                setNumEdit(m=>({ ...m, ['D:marginX']: txt }))
                const v = parseFloat(txt)
                if (txt !== '' && Number.isFinite(v)) {
                  setDoc(d=>{
                    if (d.startPreset && d.startPreset !== 'custom') {
                      const my = Number.isFinite(d.marginY) ? d.marginY : d.margin
                      const { x, y } = computeStart(d.startPreset, d.width, d.height, v, my, d.startUseMargin)
                      return { ...d, marginX: v, startX: x, startY: y }
                    }
                    return { ...d, marginX: v }
                  })
                }
              }}
              onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:marginX']; return n })}
            />
          </label>
          <label className="flex flex-col gap-1" title="Override vertical margin (mm). Falls back to Margin if blank.">Margin Y (optional)
            <input className="input" type="text" inputMode="decimal" value={(numEdit['D:marginY'] ?? (Number.isFinite(doc.marginY)? String(doc.marginY) : ''))}
              placeholder={String(doc.margin)}
              onChange={e=>{
                const txt = e.target.value
                setNumEdit(m=>({ ...m, ['D:marginY']: txt }))
                const v = parseFloat(txt)
                if (txt !== '' && Number.isFinite(v)) {
                  setDoc(d=>{
                    if (d.startPreset && d.startPreset !== 'custom') {
                      const mx = Number.isFinite(d.marginX) ? d.marginX : d.margin
                      const { x, y } = computeStart(d.startPreset, d.width, d.height, mx, v, d.startUseMargin)
                      return { ...d, marginY: v, startX: x, startY: y }
                    }
                    return { ...d, marginY: v }
                  })
                }
              }}
              onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:marginY']; return n })}
            />
          </label>
        </div>
        <div className="col-span-2 lg:col-span-3 grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1" title="Stroke width (mm) used in preview and SVG export.">Stroke
            <input className="input" type="text" inputMode="decimal" value={(numEdit['D:stroke'] ?? String(doc.strokeWidth))}
              onChange={e=>{
                const txt = e.target.value
                setNumEdit(m=>({ ...m, ['D:stroke']: txt }))
                const v = parseFloat(txt)
                if (txt !== '' && Number.isFinite(v)) setDoc(d=>({...d, strokeWidth: v}))
              }}
              onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:stroke']; return n })}
            />
          </label>
          <label className="flex items-center gap-2" title="Faster previews by reducing samples/steps. Use the Quality slider to trade speed for detail.">
            <input type="checkbox" className="w-4 h-4" checked={!!doc.fastPreview} onChange={e=>setDoc(d=>({...d,fastPreview:e.target.checked}))} />
            Fast Preview
          </label>
          <label className="flex flex-col gap-1" title="Preview quality factor (0.2–1). Lower values are faster but less detailed.">Quality
            <input className="input" type="range" min="0.2" max="1" step="0.05" value={doc.previewQuality} onChange={e=>setDoc(d=>({...d,previewQuality:+e.target.value}))} disabled={!doc.fastPreview} />
          </label>
        </div>
        <div className="col-span-2 lg:col-span-3 grid grid-cols-1 gap-2">
          <label className={labelClass} title="Paper color used for preview background (also exported in SVG as background rectangle if desired).">
            <span>Paper Color</span>
            <div className="flex items-center gap-2">
              <input type="color" className="w-8 h-8 rounded border border-white/10" value={doc.bg} onChange={e=>setDoc(d=>({...d,bg:e.target.value}))} />
              {!superCompact && (<code className="text-[10px] opacity-70">{doc.bg}</code>)}
            </div>
          </label>
          <label className={labelClass} title="Viewport background color around the paper (for contrast and comfort).">
            <span>Viewport Background</span>
            <div className="flex items-center gap-2">
              <input type="color" className="w-8 h-8 rounded border border-white/10" value={doc.appBg} onChange={e=>setDoc(d=>({...d,appBg:e.target.value}))} />
              {!superCompact && (<code className="text-[10px] opacity-70">{doc.appBg}</code>)}
            </div>
          </label>
          <label className={labelClass} title="Preview-only color for the paper border (toggle below).">
            <span>Border Color</span>
            <div className="flex items-center gap-2">
              <input type="color" className="w-8 h-8 rounded border border-white/10" value={doc.paperBorderColor} onChange={e=>setDoc(d=>({...d,paperBorderColor:e.target.value}))} disabled={!doc.showPaperBorder} />
              {!superCompact && (<code className="text-[10px] opacity-70">{doc.paperBorderColor}</code>)}
            </div>
            <label className="mt-1 flex items-center gap-2 text-xs opacity-80">
              <input type="checkbox" className="w-4 h-4" checked={!!doc.showPaperBorder} onChange={e=>setDoc(d=>({...d,showPaperBorder:e.target.checked}))} />
              Show Paper Border
            </label>
          </label>
          <label className={labelClass} title="Preview-only color for the margin border (toggle below).">
            <span>Margin Border Color</span>
            <div className="flex items-center gap-2">
              <input type="color" className="w-8 h-8 rounded border border-white/10" value={doc.marginBorderColor} onChange={e=>setDoc(d=>({...d,marginBorderColor:e.target.value}))} disabled={!doc.showMarginBorder} />
              {!superCompact && (<code className="text-[10px] opacity-70">{doc.marginBorderColor}</code>)}
            </div>
            <label className="mt-1 flex items-center gap-2 text-xs opacity-80">
              <input type="checkbox" className="w-4 h-4" checked={!!doc.showMarginBorder} onChange={e=>setDoc(d=>({...d,showMarginBorder:e.target.checked}))} />
              Show Margin Border
            </label>
          </label>
        </div>
        <div className="col-span-2 lg:col-span-3 grid grid-cols-1 gap-2">
          <label className={labelClass} title="Clip the output to the paper or margin rectangle when exporting.">
            <span>Output Clip</span>
            <Select value={doc.clipOutput || 'none'} onChange={(v)=>setDoc(d=>({ ...d, clipOutput: v }))}
              options={[{label:'None', value:'none'},{label:'Paper', value:'paper'},{label:'Margin', value:'margin'}]}
            />
          </label>
        </div>
        <div className="col-span-2 flex items-end gap-2">
          <label className="flex-1 flex flex-col gap-1" title="Random seed used by many generators. Change then regenerate to explore.">Seed
            <input className="input" value={doc.seed} onChange={e=>setDoc(d=>({...d,seed:e.target.value}))}/>
          </label>
          <button className="btn" title="Randomize" onClick={regenerateSeed}><Icon path={mdiShuffleVariant}/></button>
        </div>
      </div>
    </div>
  )
}
