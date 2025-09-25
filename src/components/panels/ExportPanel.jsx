import React from 'react'
import { mdiContentSave, mdiFileCode, mdiFolderOpen, mdiZipBox, mdiPalette, mdiExportVariant } from '@mdi/js'
import Select from '../Select.jsx'
import { Icon } from '../Icon.jsx'

export default function ExportPanel({
  compactUI = false,
  exportMode = 'layers',
  onChangeExportMode,
  onDownloadSVGs,
  onDownloadGcode,
  onExportPreset,
  onOpenImport,
  fileRef,
  onHandleImport
}) {
  return (
    <>
      <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur py-2 border-b border-white/10">
        <h2 className="font-medium px-1 flex items-center gap-2"><Icon path={mdiExportVariant}/> <span>Export</span></h2>
      </div>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-2 items-start mt-2">
        <div className="flex gap-2 col-span-2 lg:col-span-1">
          <button className="btn flex-1" onClick={onDownloadSVGs} title="Export SVG Layers (ZIP)">
            {compactUI ? (<><Icon path={mdiContentSave}/> SVG</>) : (<><Icon path={mdiContentSave}/> Export SVG Layers (ZIP)</>)}
          </button>
        </div>
        <div className="flex gap-2 items-center col-span-2 lg:col-span-2">
          <Select
            className="flex-1"
            value={exportMode}
            onChange={v=>onChangeExportMode && onChangeExportMode(v)}
            prefix={<Icon path={exportMode === 'combined' ? mdiFileCode : (exportMode === 'colors' ? mdiPalette : mdiZipBox)} />}
            variant="button"
            tooltip="Choose how G-code files are grouped: Per Layer (ZIP), Per Color (ZIP), or a single Combined file."
            options={[
              { label: '[ZIP] Per Layer', value: 'layers' },
              { label: '[ZIP] Per Color', value: 'colors' },
              { label: '[Single] Combined', value: 'combined' }
            ]}
          />
          <button className="btn flex-1" onClick={onDownloadGcode} title="Export G-code using selected mode">
            {compactUI ? (<><Icon path={mdiFileCode}/> G-code</>) : (<><Icon path={mdiFileCode}/> Export G-code</>)}
          </button>
        </div>
        <div className="flex gap-2 items-center col-span-2 lg:col-span-2">
          <button className="btn flex-1" onClick={onExportPreset} title="Save Setup">
            {compactUI ? (<><Icon path={mdiContentSave}/> Save</>) : (<><Icon path={mdiContentSave}/> Save Setup</>)}
          </button>
          <button className="btn flex-1" onClick={onOpenImport} title="Load Setup">
            {compactUI ? (<><Icon path={mdiFolderOpen}/> Load</>) : (<><Icon path={mdiFolderOpen}/> Load Setup</>)}
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onHandleImport} />
        </div>
      </div>
    </>
  )
}
