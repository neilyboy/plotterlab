
import React from 'react'
import Select from '../Select.jsx'
import { Icon } from '../Icon.jsx'
import {
  mdiLayersOutline,
  mdiLayersPlus,
  mdiArrowCollapseVertical,
  mdiArrowExpandVertical,
  mdiEye,
  mdiEyeOff,
  mdiPlus,
  mdiMinus,
  mdiDotsVertical,
  mdiContentSave,
  mdiArrowUp,
  mdiArrowDown,
  mdiCrosshairsGps,
  mdiDelete,
  mdiEraser,
  mdiVectorSelection,
  mdiCheck,
  mdiVectorSquare,
  mdiClose,
  mdiFitToPageOutline
} from '@mdi/js'
import { mdiIconOptions } from '../../lib/generators/mdiPattern.js'

export default function LayersPanel({
  compactUI = true,
  layers = [],
  GENERATORS = {},
  COLOR_OPTIONS = [],
  labelClass = '',
  labelRowClass = '',
  layerMenuId = null,
  bitmaps = {},
  toggleVisible,
  addLayer,
  removeLayer,
  moveLayer,
  setAllLayersCollapsed,
  setLayers,
  fitToLayer,
  openImageForLayer,
  clearLayerImage,
  renderNumParam,
  isGroupOpen,
  toggleGroup,
  downloadLayerSvg,
  setLayerMenuId,
  isoPresetValues,
  qcPresetValues,
  superPresetValues,
  fitIsoSeparation,
  picker,
  setPicker,
  transform,
  setTransform,
  numEdit = {},
  setNumEdit,
}) {
  return (
    <>

          <>
          <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur flex items-center justify-between py-2 mt-4 border-b border-white/10">
            <h2 className="font-medium flex items-center gap-2"><Icon path={mdiLayersOutline}/> <span>Layers</span></h2>
            <div className="flex gap-2">
              <button className="btn" title="New Layer" onClick={addLayer}>
                {compactUI ? (<Icon path={mdiLayersPlus}/>) : (<><Icon path={mdiLayersPlus}/> New Layer</>)}
              </button>
              <button className="btn" onClick={()=>setAllLayersCollapsed(true)} title="Collapse All">
                {compactUI ? (<Icon path={mdiArrowCollapseVertical}/>) : (<><Icon path={mdiArrowCollapseVertical}/> Collapse All</>)}
              </button>
              <button className="btn" onClick={()=>setAllLayersCollapsed(false)} title="Expand All">
                {compactUI ? (<Icon path={mdiArrowExpandVertical}/>) : (<><Icon path={mdiArrowExpandVertical}/> Expand All</>)}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {layers.map((layer, idx) => (
              <div key={layer.id} className="rounded-lg border border-white/5 bg-black/20">
                <header className={`relative flex items-center justify-between ${compactUI ? 'px-2 py-1' : 'px-3 py-2'} border-b border-white/5`}>
                  <div className="flex items-center gap-2">
                    <button className="icon" onClick={()=>toggleVisible(layer.id)} title={layer.visible? 'Hide' : 'Show'}>
                      <Icon path={layer.visible? mdiEye : mdiEyeOff} />
                    </button>
                    <input className="bg-transparent outline-none text-sm font-medium" value={layer.name} onChange={e=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,name:e.target.value}:l))}/>
                    {compactUI && (
                      <span className="text-[10px] opacity-80 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                        {GENERATORS[layer.generator]?.name || layer.generator}
                      </span>
                    )}
                  </div>
                  <div className={`flex flex-wrap items-center ${compactUI ? 'gap-1' : 'gap-2'}`}>
                    <button className="icon" title={layer.uiCollapsed ? 'Expand' : 'Collapse'}
                      onClick={()=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,uiCollapsed:!l.uiCollapsed}:l))}>
                      <Icon path={layer.uiCollapsed ? mdiPlus : mdiMinus} />
                    </button>
                    {!compactUI && (
                      <Select className="w-auto" value={layer.generator} onChange={v=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,generator:v,params:{...GENERATORS[v].params}}:l))}
                        options={Object.entries(GENERATORS).map(([k,v])=>({ label: v.name, value: k }))}
                        tooltip="Change this layer's generator. Switching resets its parameters to sensible defaults."
                      />
                    )}
                    {compactUI ? (
                      <input type="color" className="w-8 h-8 rounded border border-white/10 flex-shrink-0" value={layer.color} onChange={e=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,color:e.target.value}:l))} title="Pick color" />
                    ) : (
                      <>
                        <Select className="w-auto" value={layer.color} onChange={v=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,color:v}:l))}
                          options={COLOR_OPTIONS}
                          tooltip="Choose a palette color. Use the picker next to it for a custom value."
                        />
                        <input type="color" className="w-8 h-8 rounded border border-white/10 flex-shrink-0" value={layer.color} onChange={e=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,color:e.target.value}:l))} title="Pick color" />
                      </>
                    )}
                    {/* Status chips */}
                    {(() => {
                      const p = layer.params || {}
                      let chip = null
                      if (p.clipLayerId) {
                        const src = layers.find(l=>l.id===p.clipLayerId)
                        const mode = p.clipMode || 'all'
                        const modeText = (mode === 'largest')
                          ? 'Largest'
                          : (mode === 'index'
                              ? (Array.isArray(p.clipIndices) && p.clipIndices.length ? '#' + p.clipIndices.join(',#') : `#${Math.max(0, Math.floor(p.clipIndex||0))}`)
                              : 'All')
                        chip = `Clip: ${src ? src.name : 'Layer'} · ${modeText}`
                      } else if (p.clipToPrevious) {
                        const mode = p.clipMode || 'all'
                        const modeText = (mode === 'largest')
                          ? 'Largest'
                          : (mode === 'index'
                              ? (Array.isArray(p.clipIndices) && p.clipIndices.length ? '#' + p.clipIndices.join(',#') : `#${Math.max(0, Math.floor(p.clipIndex||0))}`)
                              : 'All')
                        chip = `Clip: Prev · ${modeText}`
                      }
                      return chip ? (<span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{chip}</span>) : null
                    })()}
                    {layer.generator === 'hatchFill' && layer.params?.cross && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">Cross</span>
                    )}
                    {(() => {
                      const p = layer.params || {}
                      const rule = (p.clipRule || 'union')
                      if (!p.clipLayerId && !p.clipToPrevious) return null
                      if (rule === 'union') return null
                      const label = rule === 'evenodd' ? 'Even-Odd' : (rule.charAt(0).toUpperCase()+rule.slice(1))
                      return (<span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">Rule: {label}</span>)
                    })()}
                    <button className="icon" title="More" onClick={(e)=>{ e.stopPropagation(); setLayerMenuId(id => id===layer.id ? null : layer.id) }}>
                      <Icon path={mdiDotsVertical}/>
                    </button>
                    {layerMenuId === layer.id && (
                      <div className="absolute right-2 top-full mt-2 z-30 bg-zinc-800 border border-white/10 rounded-md shadow-soft min-w-[160px]"
                        onClick={(e)=>e.stopPropagation()}>
                        <div className="px-2 py-1 hover:bg-white/10 cursor-pointer flex items-center gap-2" onClick={()=>{ downloadLayerSvg(layer.id); setLayerMenuId(null) }}>
                          <Icon path={mdiContentSave}/> <span>Save SVG</span>
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 cursor-pointer flex items-center gap-2" onClick={()=>{ moveLayer(layer.id,-1); setLayerMenuId(null) }}>
                          <Icon path={mdiArrowUp}/> <span>Move Up</span>
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 cursor-pointer flex items-center gap-2" onClick={()=>{ moveLayer(layer.id,1); setLayerMenuId(null) }}>
                          <Icon path={mdiArrowDown}/> <span>Move Down</span>
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 cursor-pointer flex items-center gap-2" onClick={()=>{ fitToLayer(layer.id); setLayerMenuId(null) }}>
                          <Icon path={mdiCrosshairsGps}/> <span>Zoom to Layer</span>
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 cursor-pointer flex items-center gap-2 text-red-300" onClick={()=>{ removeLayer(layer.id); setLayerMenuId(null) }}>
                          <Icon path={mdiDelete}/> <span>Delete</span>
                        </div>
                      </div>
                    )}
                  </div>
                </header>
                {!layer.uiCollapsed && (
                  <div className={`p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${compactUI ? 'gap-1' : 'gap-2'} text-sm`}>
                  {compactUI && (
                    <label className={labelClass}>
                      Generator
                      <Select value={layer.generator} onChange={v=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,generator:v,params:{...GENERATORS[v].params}}:l))}
                        options={Object.entries(GENERATORS).map(([k,v])=>({ label: v.name, value: k }))}
                        tooltip="Change this layer's generator. Switching resets its parameters to sensible defaults."
                      />
                    </label>
                  )}
                  {/* Grouped controls for MDI Icon Field */}
                  {layer.generator === 'mdiIconField' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">MDI Icon Field</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'mdiIconField')}>{isGroupOpen(layer.id,'mdiIconField')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'mdiIconField') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <label className={labelClass}>Icons (CSV)
                            <input className="input" type="text" placeholder="mdiFlower,mdiRobot"
                              value={(numEdit[`L:${layer.id}:namesCsv`] ?? (layer.params.namesCsv ?? ''))}
                              onChange={e=>{
                                const txt = e.target.value
                                setNumEdit(m=>({ ...m, [`L:${layer.id}:namesCsv`]: txt }))
                              }}
                              onBlur={e=>{
                                const txt = e.target.value
                                setNumEdit(m=>{ const n={...m}; delete n[`L:${layer.id}:namesCsv`]; return n })
                                setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,namesCsv: txt}}:l))
                              }}
                            />
                          </label>
                          <div className="flex items-end">
                            <button className="btn" onClick={()=>{
                              setNumEdit(m=>{ const n={...m}; delete n[`L:${layer.id}:namesCsv`]; return n })
                              setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,namesCsv: ''}}:l))
                            }}>
                              <Icon path={mdiEraser}/> {compactUI ? 'Clear' : 'Clear list'}
                            </button>
                          </div>
                          {renderNumParam(layer,'rows','Rows')}
                          {renderNumParam(layer,'cols','Cols')}
                          {renderNumParam(layer,'spacing','Spacing')}
                          {renderNumParam(layer,'jitter','Jitter')}
                          {renderNumParam(layer,'scaleMin','ScaleMin')}
                          {renderNumParam(layer,'scaleMax','ScaleMax')}
                          {renderNumParam(layer,'rotationJitter','RotationJitter')}
                          {renderNumParam(layer,'samples','Samples')}
                          {renderNumParam(layer,'margin','Margin')}
                          {renderNumParam(layer,'simplifyTol','SimplifyTol')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Hatch Fill */}
                  {layer.generator === 'hatchFill' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Hatch Fill</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'hatchFill')}>{isGroupOpen(layer.id,'hatchFill')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'hatchFill') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'angleDeg','AngleDeg')}
                          {renderNumParam(layer,'spacing','Spacing')}
                          {renderNumParam(layer,'offset','Offset')}
                          {renderNumParam(layer,'crossOffset','CrossOffset')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Halftone core sampling */}
                  {layer.generator === 'halftone' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Halftone · Core</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'halftoneCore')}>{isGroupOpen(layer.id,'halftoneCore')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'halftoneCore') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'angleDeg','AngleDeg')}
                          {renderNumParam(layer,'spacing','Spacing')}
                          {renderNumParam(layer,'segment','Segment')}
                          {renderNumParam(layer,'gamma','Gamma')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Halftone dots & radial options */}
                  {layer.generator === 'halftone' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Halftone · Dots / Radial</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'halftoneDots')}>{isGroupOpen(layer.id,'halftoneDots')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'halftoneDots') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'dotMin','DotMin')}
                          {renderNumParam(layer,'dotMax','DotMax')}
                          {renderNumParam(layer,'dotAspect','DotAspect')}
                          {renderNumParam(layer,'radialCenterX','RadialCenterX')}
                          {renderNumParam(layer,'radialCenterY','RadialCenterY')}
                          {renderNumParam(layer,'angStepDeg','AngStepDeg')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Halftone squiggle */}
                  {layer.generator === 'halftone' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Halftone · Squiggle</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'halftoneSquiggle')}>{isGroupOpen(layer.id,'halftoneSquiggle')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'halftoneSquiggle') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'squiggleAmp','SquiggleAmp')}
                          {renderNumParam(layer,'squigglePeriod','SquigglePeriod')}
                          {renderNumParam(layer,'squiggleJitterAmp','JitterAmp')}
                          {renderNumParam(layer,'squiggleJitterScale','JitterScale')}
                          {renderNumParam(layer,'squigglePhaseJitter','PhaseJitter')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for MDI Pattern */}
                  {layer.generator === 'mdiPattern' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">MDI Pattern</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'mdiPattern')}>{isGroupOpen(layer.id,'mdiPattern')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'mdiPattern') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'cols','Cols')}
                          {renderNumParam(layer,'rows','Rows')}
                          {renderNumParam(layer,'spacing','Spacing')}
                          {renderNumParam(layer,'scale','Scale')}
                          {renderNumParam(layer,'rotation','Rotation')}
                          {renderNumParam(layer,'jitter','Jitter')}
                          {renderNumParam(layer,'samples','Samples')}
                          {renderNumParam(layer,'margin','Margin')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Pixel Mosaic */}
                  {layer.generator === 'pixelMosaic' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Pixel Mosaic</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'pixelMosaic')}>{isGroupOpen(layer.id,'pixelMosaic')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'pixelMosaic') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'cols','Cols')}
                          {renderNumParam(layer,'rows','Rows')}
                          {renderNumParam(layer,'density','Density')}
                          {renderNumParam(layer,'jitter','Jitter')}
                          {renderNumParam(layer,'levels','Levels')}
                          {renderNumParam(layer,'margin','Margin')}
                          {renderNumParam(layer,'simplifyTol','SimplifyTol')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for SVG Import transform */}
                  {layer.generator === 'svgImport' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">SVG Import · Transform</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'svgTransform')}>{isGroupOpen(layer.id,'svgTransform')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'svgTransform') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'scale','Scale')}
                          {renderNumParam(layer,'rotateDeg','RotateDeg')}
                          {renderNumParam(layer,'offsetX','OffsetX')}
                          {renderNumParam(layer,'offsetY','OffsetY')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for L-system */}
                  {layer.generator === 'lsystem' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">L-system</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'lsys')}>{isGroupOpen(layer.id,'lsys')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'lsys') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <label className={labelClass}>Preset
                            <Select value={layer.params.preset || 'koch'}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, preset:v}}:l))}
                              options={[{label:'Koch snowflake',value:'koch'},{label:'Dragon',value:'dragon'},{label:'Plant',value:'plant'}]}
                            />
                          </label>
                          {renderNumParam(layer,'iterations','Iterations')}
                          {renderNumParam(layer,'angleDeg','AngleDeg')}
                          {renderNumParam(layer,'step','Step')}
                          {renderNumParam(layer,'jitter','Jitter')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Truchet */}
                  {layer.generator === 'truchet' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Truchet Tiles</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'truchet')}>{isGroupOpen(layer.id,'truchet')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'truchet') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'cols','Cols')}
                          {renderNumParam(layer,'rows','Rows')}
                          <label className={labelClass}>Variant
                            <Select value={layer.params.variant || 'curves'}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, variant:v}}:l))}
                              options={[{label:'Curves (quarter-circles)',value:'curves'},{label:'Lines (diagonals)',value:'lines'}]}
                            />
                          </label>
                          {renderNumParam(layer,'jitter','Jitter')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Phyllotaxis */}
                  {layer.generator === 'phyllotaxis' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Phyllotaxis</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'phyl')}>{isGroupOpen(layer.id,'phyl')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'phyl') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'count','Count')}
                          {renderNumParam(layer,'spacing','Spacing')}
                          {renderNumParam(layer,'angleDeg','AngleDeg')}
                          {renderNumParam(layer,'jitter','Jitter')}
                          <label className={labelRowClass}>
                            <input type="checkbox" className="w-4 h-4" checked={!!layer.params.connect}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, connect:e.target.checked}}:l))} />
                            Connect seeds (single path)
                          </label>
                          {renderNumParam(layer,'dotSize','DotSize')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Path Warp (links to another layer) */}
                  {layer.generator === 'pathWarp' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Path Warp (link to source layer)</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'warp')}>{isGroupOpen(layer.id,'warp')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'warp') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <label className={labelClass}>Source Layer
                            <Select value={layer.params.srcLayerId || ''}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, srcLayerId:v, srcToPrevious:false}}:l))}
                              options={[{label:'(None)', value:''}, ...layers.filter(l=>l.id!==layer.id).map(l=>({label:l.name, value:l.id}))]}
                            />
                          </label>
                          <label className={labelRowClass}>
                            <input type="checkbox" className="w-4 h-4" checked={!!layer.params.srcToPrevious} disabled={!!layer.params.srcLayerId}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, srcToPrevious:e.target.checked}}:l))} />
                            Or: use previous visible layer
                          </label>
                          {renderNumParam(layer,'amp','Amplitude')}
                          {renderNumParam(layer,'scale','NoiseScale')}
                          {renderNumParam(layer,'step','ResampleStep')}
                          {renderNumParam(layer,'copies','Copies')}
                          <label className={labelRowClass}>
                            <input type="checkbox" className="w-4 h-4" checked={!!layer.params.rotateFlow}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, rotateFlow:e.target.checked}}:l))} />
                            Use vector field (ignore tangent)
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Image-based generators: Halftone, Pixel Mosaic, Image Contours, Poisson Stipple, TSP Art */}
                  {(['halftone','pixelMosaic','imageContours','poissonStipple','tspArt'].includes(layer.generator)) && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Image Source</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'img')}>{isGroupOpen(layer.id,'img')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'img') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <div className="flex items-center gap-2">
                            <button className="btn" onClick={()=>openImageForLayer(layer.id)}>Load Image</button>
                            <button className="btn" disabled={!bitmaps[layer.id]} onClick={()=>clearLayerImage(layer.id)}>Clear</button>
                          </div>
                          <div className="text-xs opacity-70 col-span-2">
                            {layer.params?.imageInfo ? `Loaded: ${layer.params.imageInfo}` : 'No image loaded'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {layer.generator === 'combinator' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Combinator Sources</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'comb')}>{isGroupOpen(layer.id,'comb')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'comb') && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <label className={labelClass}>Source A
                            <Select value={layer.params.srcA || ''}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, srcA:v}}:l))}
                              options={[{label:'(None)', value:''}, ...layers.filter(l=>l.id!==layer.id).map(l=>({label:l.name, value:l.id}))]}
                            />
                          </label>
                          <label className={labelClass}>Source B
                            <Select value={layer.params.srcB || ''}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, srcB:v}}:l))}
                              options={[{label:'(None)', value:''}, ...layers.filter(l=>l.id!==layer.id).map(l=>({label:l.name, value:l.id}))]}
                            />
                          </label>
                          <label className={labelClass}>Operation
                            <Select value={layer.params.op || 'intersect'}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, op:v}}:l))}
                              options={[
                                { label:'Intersect', value:'intersect' },
                                { label:'Union', value:'union' },
                                { label:'Difference (A - B)', value:'difference' },
                                { label:'XOR', value:'xor' }
                              ]}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  {Object.entries(GENERATORS[layer.generator].params).map(([k,def]) => {
                    // Skip clip UI keys we render via custom block for these generators
                    if ((layer.generator === 'hatchFill' || layer.generator === 'halftone' || layer.generator === 'mdiPattern' || layer.generator === 'svgImport') && (
                      k === 'clipToPrevious' || k === 'clipLayerId' || k === 'clipMode' || k === 'clipIndex' || k === 'clipRule'
                    )) return null
                    // Skip keys we render in grouped blocks
                    if (layer.generator === 'mdiIconField' && (
                      ['namesCsv','rows','cols','spacing','jitter','scaleMin','scaleMax','rotationJitter','samples','margin','simplifyTol'].includes(k)
                    )) return null
                    if (layer.generator === 'hatchFill' && (
                      ['angleDeg','spacing','offset','crossOffset'].includes(k)
                    )) return null
                    if (layer.generator === 'halftone' && (
                      ['angleDeg','spacing','segment','gamma','dotMin','dotMax','dotAspect','radialCenterX','radialCenterY','angStepDeg','squiggleAmp','squigglePeriod','squiggleJitterAmp','squiggleJitterScale','squigglePhaseJitter'].includes(k)
                    )) return null
                    if (layer.generator === 'svgImport' && (
                      ['scale','rotateDeg','offsetX','offsetY'].includes(k)
                    )) return null
                    if (layer.generator === 'lsystem' && (
                      ['preset'].includes(k)
                    )) return null
                    if (layer.generator === 'truchet' && (
                      ['variant','cols','rows','jitter'].includes(k)
                    )) return null
                    if (layer.generator === 'phyllotaxis' && (
                      ['connect','count','spacing','angleDeg','jitter','dotSize'].includes(k)
                    )) return null
                    if (layer.generator === 'pathWarp' && (
                      ['srcLayerId','srcToPrevious','amp','scale','step','copies','rotateFlow'].includes(k)
                    )) return null
                    if (k === 'imageInfo') return null
                    if (layer.generator === 'mdiPattern' && (
                      ['cols','rows','spacing','scale','rotation','jitter','samples','margin'].includes(k)
                    )) return null
                    if (layer.generator === 'pixelMosaic' && (
                      ['cols','rows','density','jitter','levels','margin','simplifyTol'].includes(k)
                    )) return null
                    if (layer.generator === 'combinator' && (
                      ['srcA','srcB','op'].includes(k)
                    )) return null
                    // Boolean controls
                    if (typeof def === 'boolean') {
                      // Avoid duplicate 'Clip To Previous' control: we render a custom section below
                      if ((layer.generator === 'hatchFill' || layer.generator === 'halftone') && k === 'clipToPrevious') return null
                      return (
                        <label key={k} className={labelRowClass}>
                          <input type="checkbox" className="w-4 h-4" checked={!!layer.params[k]}
                            onChange={e=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,[k]:e.target.checked}}:l))} />
                          {k.replace(/([A-Z])/g,' $1')}
                        </label>
                      )
                    }
                    if (layer.generator === 'pixelMosaic' && k === 'style') {
                      return (
                        <label key={k} className={labelClass}>
                          Style
                          <Select value={layer.params.style}
                            onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,style:v}}:l))}
                            options={[
                              { label: 'Squares', value: 'squares' },
                              { label: 'Cross', value: 'cross' },
                              { label: 'Plus', value: 'plus' },
                              { label: 'Random', value: 'random' }
                            ]}
                          />
                        </label>
                      )
                    }
                    if (layer.generator === 'halftone' && k === 'shape') {
                      return (
                        <label key={k} className={labelClass}>
                          Shape
                          <Select value={layer.params.shape}
                            onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,shape:v}}:l))}
                            options={[
                              {label:'Lines (scanline dither)', value:'lines'},
                              {label:'Dots – Circle', value:'circle'},
                              {label:'Dots – Ellipse', value:'ellipse'},
                              {label:'Dots – Square', value:'square'},
                              {label:'Rings (radial)', value:'rings'},
                              {label:'Radial Dots (rings)', value:'radialDots'}
                            ]}
                          />
                        </label>
                      )
                    }
                    if (layer.generator === 'halftone' && k === 'method') {
                      return (
                        <label key={k} className={labelClass}>
                          Method
                          <Select value={layer.params.method}
                            onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,method:v}}:l))}
                            options={[
                              {label:'Bayer 8x8',value:'bayer'},
                              {label:'Threshold 0.5',value:'threshold'},
                              {label:'Floyd–Steinberg',value:'floyd'}
                            ]}
                          />
                        </label>
                      )
                    }
                    if (layer.generator === 'halftone' && k === 'squiggleMode') {
                      return (
                        <label key={k} className={labelClass}>
                          Squiggle Mode
                          <Select value={layer.params.squiggleMode}
                            onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,squiggleMode:v}}:l))}
                            options={[
                              {label:'Sine', value:'sine'},
                              {label:'Zigzag', value:'zigzag'}
                            ]}
                          />
                        </label>
                      )
                    }
                    if (layer.generator === 'mdiPattern' && k === 'iconIndex') {
                      return (
                        <label key={k} className={labelClass}>
                          Icon
                          <Select value={layer.params.iconIndex}
                            onChange={(idx)=>{
                              const name = mdiIconOptions[idx]?.name || layer.params.iconName
                              setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,iconIndex:idx,iconName:name}}:l))
                            }}
                            options={mdiIconOptions.map(o=>({label:o.label,value:o.value}))}
                          />
                        </label>
                      )
                    }
                    if (layer.generator === 'mdiPattern' && k === 'iconName') {
                      return (
                        <label key={k} className={labelClass}>
                          Icon Name (e.g. "mdi:robot" or "robot")
                          <input className="input" value={layer.params.iconName}
                            onChange={e=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,iconName:e.target.value}}:l))}/>
                        </label>
                      )
                    }
                    if (layer.generator === 'stripeBands' && k === 'tubeCurve') {
                      return (
                        <label key={k} className={labelClass}>
                          Tube Curve
                          <Select value={layer.params.tubeCurve || 'tri'}
                            onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,tubeCurve:v}}:l))}
                            options={[{label:'Triangular', value:'tri'},{label:'Sine', value:'sin'}]}
                          />
                        </label>
                      )
                    }
                    // Numeric input with ephemeral editing buffer so backspace can clear fully
                    const editKey = `L:${layer.id}:${k}`
                    const displayVal = (numEdit && Object.prototype.hasOwnProperty.call(numEdit, editKey))
                      ? numEdit[editKey]
                      : String(layer.params[k] ?? def)
                    return (
                      <label key={k} className={labelClass}>
                        {k}
                        <input className="input" type="text" inputMode="decimal" value={displayVal}
                          onChange={e=>{
                            const txt = e.target.value
                            setNumEdit(m=>({ ...m, [editKey]: txt }))
                            const v = parseFloat(txt)
                            if (txt !== '' && Number.isFinite(v)) {
                              setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,[k]: v}}:l))
                            }
                          }}
                          onBlur={()=>{
                            setNumEdit(m=>{ const n={...m}; delete n[editKey]; return n })
                          }}
                        />
                      </label>
                    )
                  })}
                  {(
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Pattern Fill</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'fill')}>{isGroupOpen(layer.id,'fill')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'fill') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <label className={labelRowClass}>
                            <input type="checkbox" className="w-4 h-4" checked={layer.params.clipEnabled !== false}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, clipEnabled: e.target.checked}}:l))} />
                            Enable Fill
                          </label>
                          <label className={labelClass}>Fill From Layer
                            <Select value={layer.params.clipLayerId || ''}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>{
                                if (l.id!==layer.id) return l
                                return { ...l, params: { ...l.params, clipLayerId: v, clipToPrevious: false } }
                              }))}
                              options={[{label:'(None)', value:''}, ...layers.filter(l=>l.id!==layer.id).map(l=>({label:l.name, value:l.id}))]}
                            />
                          </label>
                          <label className={labelRowClass}>
                            <input type="checkbox" className="w-4 h-4" checked={!!layer.params.clipToPrevious}
                              disabled={!!layer.params.clipLayerId}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipToPrevious:e.target.checked}}:l))} />
                            Or: Use previous visible layer
                          </label>
                          <label className={labelClass}>Clip Mode
                            <Select value={layer.params.clipMode || 'all'}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipMode:v}}:l))}
                              options={[{label:'All polygons',value:'all'},{label:'Largest polygon',value:'largest'},{label:'# Index',value:'index'}]}
                            />
                          </label>
                          <label className={labelClass}>Clip Index
                            <input className="input" type="number" min="0" step="1" value={layer.params.clipIndex || 0}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipIndex:Math.max(0,Math.floor(+e.target.value||0))}}:l))} />
                          </label>
                          <label className={labelClass}>Clip Rule
                            <Select value={layer.params.clipRule || 'union'}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipRule:v}}:l))}
                              options={
                                (layer.generator==='halftone')
                                  ? [
                                      {label:'Union (default)', value:'union'}
                                    ]
                                  : [
                                      {label:'Union (default)', value:'union'},
                                      {label:'Even-Odd', value:'evenodd'},
                                      ...((layer.generator==='hatchFill'||layer.generator==='mdiPattern'||layer.generator==='svgImport')
                                        ? [
                                            {label:'Intersect', value:'intersect'},
                                            {label:'Difference (first - others)', value:'difference'}
                                          ] : [])
                                    ]
                              }
                            />
                          </label>
                          <div className="col-span-2 flex gap-2">
                            <button className="btn" onClick={()=>setPicker(p => (p.active && p.targetLayerId === layer.id) ? { active: false, targetLayerId: null } : { active: true, targetLayerId: layer.id })}>
                              {picker.active && picker.targetLayerId === layer.id
                                ? (compactUI ? (<><Icon path={mdiCheck}/> Done</>) : (<><Icon path={mdiCheck}/> Done Picking</>))
                                : (compactUI ? (<><Icon path={mdiVectorSelection}/> Pick</>) : (<><Icon path={mdiVectorSelection}/> Pick shape on canvas</>))}
                            </button>
                            {layer.generator === 'svgImport' && (
                              <>
                                {!transform.active || transform.layerId !== layer.id ? (
                                  <button className="btn" onClick={()=>setTransform({ active: true, layerId: layer.id })}>
                                    {compactUI ? (<><Icon path={mdiVectorSquare}/> Transform</>) : (<><Icon path={mdiVectorSquare}/> Transform on canvas</>)}
                                  </button>
                                ) : (
                                  <button className="btn" onClick={()=>setTransform({ active: false, layerId: null })}>
                                    {compactUI ? (<><Icon path={mdiCheck}/> Done</>) : (<><Icon path={mdiCheck}/> Done Transform</>)}
                                  </button>
                                )}
                              </>
                            )}
                            {picker.active && picker.targetLayerId === layer.id && (
                              <span className="text-xs opacity-80 self-center">Click inside a shape to set Clip Layer + Index</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {(layer.params.clipMode || 'all') === 'index' && (
                    <div className="col-span-2 lg:col-span-3 grid grid-cols-1 gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs opacity-80">Selected:</span>
                        {(() => {
                          const sel = Array.isArray(layer.params.clipIndices)
                            ? layer.params.clipIndices
                            : (Number.isFinite(layer.params.clipIndex) ? [Math.max(0, Math.floor(layer.params.clipIndex))] : [])
                          return sel.length ? sel.map((idx, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-xs">
                              #{idx}
                              <button className="icon" title="Remove" onClick={()=>setLayers(ls=>ls.map(l=>{
                                if (l.id!==layer.id) return l
                                const arr = sel.filter(v=>v!==idx)
                                return { ...l, params: { ...l.params, clipIndices: arr } }
                              }))}><Icon path={mdiClose}/></button>
                            </span>
                          )) : (<span className="text-xs opacity-60">(none)</span>)
                        })()}
                        <button className="btn" onClick={()=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipIndices:[]}}:l))}>
                          <Icon path={mdiEraser}/> {compactUI ? 'Clear' : 'Clear indices'}
                        </button>
                      </div>
                      <label className={labelClass}>Clip Indices (CSV)
                        <input className="input" type="text" value={(numEdit[`L:${layer.id}:clipCsv`] ?? (
                            Array.isArray(layer.params.clipIndices)
                              ? layer.params.clipIndices.join(',')
                              : (Number.isFinite(layer.params.clipIndex) ? String(layer.params.clipIndex) : '')
                          ))}
                          onChange={(e)=>{
                            const txt = e.target.value
                            setNumEdit(m=>({ ...m, [`L:${layer.id}:clipCsv`]: txt }))
                            const parts = String(txt).split(/[;\,\s]+/).filter(Boolean)
                            const arr = Array.from(new Set(parts.map(t=>Math.max(0, Math.floor(+t||0))).filter(n=>Number.isFinite(n))))
                            setLayers(ls=>ls.map(l=>{
                              if (l.id!==layer.id) return l
                              const nextParams = { ...l.params, clipIndices: arr }
                              delete nextParams.clipIndex
                              return { ...l, params: nextParams }
                            }))
                          }}
                          onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n[`L:${layer.id}:clipCsv`]; return n })}
                        />
                      </label>
                    </div>
                  )}
                  {layer.generator === 'isoContours' && (
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">Preset
                        <Select value={layer.params.presetName || ''}
                          onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params, ...isoPresetValues(v), presetName: v}}:l))}
                          options={[
                            {label:'(None)', value:''},
                            {label:'Hourglass', value:'hourglass'},
                            {label:'Lens', value:'lens'},
                            {label:'Bulb', value:'bulb'},
                            {label:'Triple', value:'triple'},
                          ]}
                        />
                      </label>
                      <div className="flex items-end gap-2">
                        <button className="btn" onClick={()=>fitIsoSeparation(layer.id)}><Icon path={mdiFitToPageOutline}/> {compactUI ? 'Fit Sep' : 'Fit Separation'}</button>
                      </div>
                    </div>
                  )}
                  {layer.generator === 'quasicrystalContours' && (
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="flex flex-col gap-1">Preset
                        <Select value={layer.params.presetName || ''}
                          onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params, ...qcPresetValues(v), presetName: v}}:l))}
                          options={[
                            {label:'(None)', value:''},
                            {label:'Star (7)', value:'star-7'},
                            {label:'Bloom (9)', value:'bloom-9'},
                            {label:'Flower (5)', value:'flower-5'},
                          ]}
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4" checked={!!layer.params.animatePhase}
                          onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,animatePhase:e.target.checked}}:l))}/>
                        Animate Phase
                      </label>
                      <label className="flex flex-col gap-1">Phase Speed
                        <input className="input" type="range" min="-4" max="4" step="0.05" value={layer.params.phaseSpeed ?? 1}
                          onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,phaseSpeed:+e.target.value}}:l))} />
                      </label>
                    </div>
                  )}
                  {layer.generator === 'superformulaRings' && (
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="flex flex-col gap-1">Preset
                        <Select value={layer.params.presetName || ''}
                          onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params, ...superPresetValues(v), presetName: v}}:l))}
                          options={[
                            {label:'(None)', value:''},
                            {label:'Star', value:'star'},
                            {label:'Gear', value:'gear'},
                            {label:'Petal', value:'petal'},
                            {label:'Bloom', value:'bloom'},
                            {label:'Spiky', value:'spiky'},
                          ]}
                        />
                      </label>
                      <label className="flex flex-col gap-1">Morph
                        <input className="input" type="range" min="0" max="1" step="0.01" value={layer.params.morph ?? 0}
                          onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,morph:+e.target.value}}:l))} />
                      </label>
                      <label className="flex flex-col gap-1">Twist (deg/ring)
                        <input className="input" type="range" min="-45" max="45" step="1" value={layer.params.twistDeg ?? 0}
                          onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,twistDeg:+e.target.value}}:l))} />
                      </label>
                      <div className="col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" checked={!!layer.params.n23Lock}
                            onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,n23Lock:e.target.checked}}:l))} />
                          Lock n2 = n3
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" checked={layer.params.mRound ?? true}
                            onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,mRound:e.target.checked}}:l))} />
                          Round m
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" checked={!!layer.params.mEven}
                            onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,mEven:e.target.checked}}:l))} />
                          Force even m
                        </label>
                      </div>
                    </div>
                  )}
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        
    </>
  )
}
