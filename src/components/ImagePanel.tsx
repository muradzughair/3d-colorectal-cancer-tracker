// The content of the sliding pictures panel: the chosen visit's pictures, and uploading a new
// one (the detector runs on it). Each picture is shown with its marks. Colonoscopy: the AI
// boxes the polyps and the doctor picks the colon segment. CT scan: the AI outlines the tumor
// and reports its size and segment. The pictures are stored with the visit.
import { useRef, useState } from 'react'
import { detect } from '../detector'
import { pictureUrl } from '../data/record'
import { SEGMENTS, getSegment, type SegmentId } from '../data/segments'
import { findingsFromPicture, formatSize } from '../lib/findings'
import type { Finding, ImageType, Picture } from '../types'
import ImageMarks from './ImageMarks'

interface Props {
  pictures: Picture[]
  // Add a picture to the list, or replace the one with the same name.
  onPicture: (picture: Picture) => void
  // Replace all findings that came from one picture with a new list.
  onImageFindings: (imageName: string, findings: Finding[]) => void
  onClose: () => void
}

// A picture that is being analysed right now.
interface Pending {
  name: string
  url: string
  type: ImageType
}

// A colonoscope cannot reach the appendix, so it is not in this list.
const COLONOSCOPY_SEGMENTS = SEGMENTS.filter((s) => s.id !== 'appendix')

export default function ImagePanel({ pictures, onPicture, onImageFindings, onClose }: Props) {
  const [uploadType, setUploadType] = useState<ImageType>('colonoscopy')
  const [shownName, setShownName] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const request = useRef(0) // ignores old answers if the doctor switches pictures quickly

  // The picture on screen: the one being analysed, the one chosen, or the latest opened one.
  const picture = pictures.find((p) => p.name === shownName) ?? pictures[pictures.length - 1] ?? null
  const shown = pending ?? picture
  const result = pending ? null : (picture?.result ?? null)
  const status = pending ? 'analysing' : !picture ? 'idle' : picture.result ? 'done' : 'no-result'

  // Show a picture and ask the detector about it.
  async function analyse(next: Pending, fileName: string) {
    const thisRequest = ++request.current
    setShownName(next.name)
    setPending(next)
    setUploadType(next.type)

    const found = await detect({ name: fileName, url: next.url }, next.type)
    if (thisRequest !== request.current) return
    setPending(null)
    const picture: Picture = { name: next.name, type: next.type, url: next.url, result: found, segment: '' }
    onPicture(picture)
    onImageFindings(next.name, findingsFromPicture(picture)) // CT: the tumor goes straight onto the 3D map
  }

  // Look at a picture that was already opened (no new analysis).
  function showPicture(name: string, type: ImageType) {
    request.current++ // forget any analysis still running
    setPending(null)
    setShownName(name)
    setUploadType(type)
  }

  // Colonoscopy: once the doctor picks the segment, the polyps go onto the 3D map.
  function chooseSegment(id: SegmentId) {
    if (!picture || !picture.result) return
    const changed = { ...picture, segment: id }
    onPicture(changed)
    onImageFindings(picture.name, findingsFromPicture(changed))
  }

  function upload(file: File | undefined) {
    if (!file) return
    analyse({ name: file.name, url: URL.createObjectURL(file), type: uploadType }, file.name)
  }

  const shownUrl = pending ? pending.url : picture ? pictureUrl(picture) : null

  return (
    <div className="image-panel">
      <div className="panel-title">
        <h2>Pictures of this visit</h2>
        <button className="close-button" onClick={onClose} aria-label="Close pictures panel" title="Close">
          ×
        </button>
      </div>

      <div className="image-toolbar">
        <div className="type-switch" role="group" aria-label="Picture type">
          <button className={uploadType === 'colonoscopy' ? 'is-active' : ''} onClick={() => setUploadType('colonoscopy')}>
            Colonoscopy
          </button>
          <button className={uploadType === 'ct' ? 'is-active' : ''} onClick={() => setUploadType('ct')}>
            CT scan
          </button>
        </div>

        <label className="button upload-button">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              upload(e.target.files?.[0])
              e.target.value = '' // so the same file can be uploaded again
            }}
          />
          Upload image
        </label>
      </div>

      {pictures.length > 0 && (
        <div className="sample-row">
          {pictures.map((p) => (
            <button
              key={p.name}
              className={`sample-thumb${shown?.name === p.name ? ' is-active' : ''}`}
              onClick={() => showPicture(p.name, p.type)}
              title={p.name}
            >
              {pictureUrl(p) ? <img src={pictureUrl(p)!} alt="" /> : <span className="thumb-missing" />}
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="image-stage">
        {shown && shownUrl ? (
          <ImageMarks url={shownUrl} alt={shown.name} result={result} />
        ) : shown ? (
          <p className="stage-note">This uploaded picture is not kept after a page refresh. Its findings are kept.</p>
        ) : (
          <p className="stage-note">This visit has no pictures yet. Upload a {uploadType === 'ct' ? 'CT scan' : 'colonoscopy'} picture.</p>
        )}
      </div>

      {shown && (
        <div className="image-result">
          <div className="image-name">{shown.name}</div>
          {status === 'analysing' && <p className="muted">Analysing…</p>}
          {status === 'no-result' && <p className="muted">Demo mode: no pre-computed result for this image.</p>}

          {status === 'done' && result && shown.type === 'colonoscopy' && (
            <>
              <p>
                <span className="dot dot-polyp" />
                {result.polyps.length === 0
                  ? 'No polyps detected'
                  : `${result.polyps.length} ${result.polyps.length === 1 ? 'polyp' : 'polyps'} detected · ${result.polyps.map((p) => formatSize(p.size)).join(', ')}`}
              </p>
              {result.polyps.length > 0 && (
                <label className="segment-pick">
                  <span>Colon segment</span>
                  <select value={picture?.segment ?? ''} onChange={(e) => chooseSegment(e.target.value as SegmentId)}>
                    <option value="" disabled>
                      Where was this picture taken?
                    </option>
                    {COLONOSCOPY_SEGMENTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}

          {status === 'done' && result && shown.type === 'ct' && (
            <p>
              <span className="dot dot-tumor" />
              {result.tumor
                ? `Tumor outlined · ${getSegment(result.tumor.segment).name} · ${formatSize(result.tumor.size)}`
                : 'No tumor found'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
