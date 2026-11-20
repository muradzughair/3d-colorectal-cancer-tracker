// The content of the sliding pictures panel: choose a picture (sample or upload), run the
// detector, and show its marks. Colonoscopy: the AI boxes the polyps and the doctor picks the
// colon segment. CT scan: the AI outlines the tumor and reports its size and segment.
// The opened pictures live in App (the `pictures` list), so they are still there when the
// panel is closed and opened again.
import { useRef, useState } from 'react'
import { detect } from '../detector'
import { SAMPLES } from '../data/samples'
import { SEGMENTS, getSegment, type SegmentId } from '../data/segments'
import { formatSize, newId } from '../lib/findings'
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

// Where the sample pictures are (works locally and on GitHub Pages).
const SAMPLES_FOLDER = `${import.meta.env.BASE_URL}samples/`

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
    // If this picture was opened before, keep the segment the doctor chose then.
    const before = pictures.find((p) => p.name === next.name)
    onPicture({ ...next, result: found, segment: before?.segment ?? '' })

    if (!found) return onImageFindings(next.name, [])
    if (next.type === 'ct') {
      // A CT scan shows where the tumor is, so it goes straight onto the 3D map.
      const tumor = found.tumor
      onImageFindings(
        next.name,
        tumor ? [{ id: newId(), kind: 'tumor', segment: tumor.segment, size: tumor.size, source: 'ai', imageName: next.name }] : [],
      )
    }
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
    onPicture({ ...picture, segment: id })
    onImageFindings(
      picture.name,
      picture.result.polyps.map((p) => ({ id: newId(), kind: 'polyp', segment: id, size: p.size, source: 'ai', imageName: picture.name })),
    )
  }

  function pickSample(file: string) {
    const sample = SAMPLES.find((s) => s.file === file)!
    if (pictures.some((p) => p.name === sample.label)) return showPicture(sample.label, sample.type)
    analyse({ name: sample.label, url: `${SAMPLES_FOLDER}${sample.file}`, type: sample.type }, sample.file)
  }

  function upload(file: File | undefined) {
    if (!file) return
    analyse({ name: file.name, url: URL.createObjectURL(file), type: uploadType }, file.name)
  }

  // Small thumbnails: the 3 samples, then the pictures the doctor uploaded.
  const uploaded = pictures.filter((p) => !SAMPLES.some((s) => s.label === p.name))

  return (
    <div className="image-panel">
      <div className="panel-title">
        <h2>Medical pictures</h2>
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

      <div className="sample-row">
        {SAMPLES.map((s) => (
          <button
            key={s.file}
            className={`sample-thumb${shown?.name === s.label ? ' is-active' : ''}`}
            onClick={() => pickSample(s.file)}
            title={s.label}
          >
            <img src={`${SAMPLES_FOLDER}${s.file}`} alt="" />
            <span>{s.short}</span>
          </button>
        ))}
        {uploaded.map((p) => (
          <button
            key={p.name}
            className={`sample-thumb${shown?.name === p.name ? ' is-active' : ''}`}
            onClick={() => showPicture(p.name, p.type)}
            title={p.name}
          >
            <img src={p.url} alt="" />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="image-stage">
        {shown ? (
          <ImageMarks url={shown.url} alt={shown.name} result={result} />
        ) : (
          <p className="stage-note">Pick a sample or upload a {uploadType === 'ct' ? 'CT scan' : 'colonoscopy'} picture.</p>
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
