import React from 'react'
import { Icon } from '../Icon.jsx'
import { mdiImageMultipleOutline, mdiPalette } from '@mdi/js'

export default function ImportPanel({
  compactUI = false,
  imageRef,
  onImageFilePicked,
  photoRef,
  onPhotoSelected,
  onPickPhoto
}) {
  return (
    <>
      <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur py-2 border-b border-white/10">
        <h2 className="font-medium px-1 flex items-center gap-2"><Icon path={mdiImageMultipleOutline}/> <span>Import</span></h2>
      </div>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-2 items-start mt-2">
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={onImageFilePicked} />
        <div className="flex gap-2 items-center col-span-2 lg:col-span-2">
          <button className="btn flex-1" onClick={()=>onPickPhoto && onPickPhoto('mono')}>
            {compactUI ? (<><Icon path={mdiImageMultipleOutline}/> Mono</>) : (<><Icon path={mdiImageMultipleOutline}/> Photo → Mono Halftone</>)}
          </button>
          <button className="btn flex-1" onClick={()=>onPickPhoto && onPickPhoto('cmyk')}>
            {compactUI ? (<><Icon path={mdiPalette}/> CMYK</>) : (<><Icon path={mdiPalette}/> Photo → CMYK Halftone</>)}
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelected} />
        </div>
      </div>
    </>
  )
}
