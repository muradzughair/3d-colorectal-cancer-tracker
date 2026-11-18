// Left panel: choose a picture (sample or upload), run the detector, and show its marks.
// Colonoscopy: the AI boxes the polyps; the doctor picks the colon segment.
// CT scan: the AI outlines the tumor and reports its size and segment.
import { useRef, useState } from 'react'
import { detect } from '../detector'
import { SAMPLES } from '../data/samples'
import { SEGMENTS, getSegment, type SegmentId } from '../data/segments'
import { formatSize, newId } from '../lib/findings'
import type { DetectionResult, Finding, ImageType } from '../types'
import ImageMarks from './ImageMarks'

interface Props {
  findings: Finding[]
  // Replace all findings that came from one picture with a new list.
  onImageFindings: (imageName: string, findings: Finding[]) => void
}

interface CurrentImage {
  name: string // shown to the doctor, and stored on each finding
  url: string
  type: ImageType
}

// A colonoscope cannot reach the appendix, so it is not in this list.
const COLONOSCOPY_SEGMENTS = SEGMENTS.filter((s) => s.id !== 'appendix')

export default function ImagePanel({ findings, onImageFindings }: Props) {
  const [uploadType, setUploadType] = useState<ImageType>('colonoscopy')
  const [image, setImage] = useState<CurrentImage | null>(null)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [status, setStatus] = useState<'idle' | 'analysing' | 'done' | 'no-result'>('idle')
  const [segment, setSegment] = useState<SegmentId | ''>('')
  const uploadUrl = useRef<string | null>(null)
  const request = useRef(0) // ignores old answers if the doctor switches pictures quickly

  // Show a picture and ask the detector about it.
  async function analyse(next: CurrentImage, fileName: string) {
    const thisRequest = ++request.current
    setImage(next)
    setResult(null)
    setStatus('analysing')
    setUploadType(next.type)
    // If this picture was analysed before, keep the segment the doctor chose then.
    setSegment(findings.find((f) => f.imageName === next.name)?.segment ?? '')

    const found = await detect({ name: fileName, url: next.url }, next.type)
    if (thisRequest !== request.current) return
    setResult(found)
    setStatus(found ? 'done' : 'no-result')

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

  // Colonoscopy: once the doctor picks the segment, the polyps go onto the 3D map.
  function chooseSegment(id: SegmentId) {
    setSegment(id)
    if (!image || !result) return
    onImageFindings(
      image.name,
      result.polyps.map((p) => ({ id: newId(), kind: 'polyp', segment: id, size: p.size, source: 'ai', imageName: image.name })),
    )
  }

  function pickSample(file: string) {
    const sample = SAMPLES.find((s) => s.file === file)!
    analyse({ name: sample.label, url: `/samples/${sample.file}`, type: sample.type }, sample.file)
  }

  function upload(file: File | undefined) {
    if (!file) return
    if (uploadUrl.current) URL.revokeObjectURL(uploadUrl.current) // free the previous upload
    uploadUrl.current = URL.createObjectURL(file)
    analyse({ name: file.name, url: uploadUrl.current, type: uploadType }, file.name)
  }

  return (
    <div className="image-panel">
      <div className="image-toolbar">
        <div className="type-switch" role="group" aria-label="Picture type">
          <button className={uploadType === 'colonoscopy' ? 'is-active' : ''} onClick={() => setUploadType('colonoscopy')}>
            Colonoscopy
          </button>
          <button className={uploadType === 'ct' ? 'is-active' : ''} onClick={() => setUploadType('ct')}>
            CT scan
          </button>
        </div>

        <label className="upload-button">
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
            className={`sample-thumb${image?.name === s.label ? ' is-active' : ''}`}
            onClick={() => pickSample(s.file)}
            title={s.label}
          >
            <img src={`/samples/${s.file}`} alt="" />
            <span>{s.short}</span>
          </button>
        ))}
      </div>

      <div className="image-stage">
        {image ? (
          <ImageMarks url={image.url} alt={image.name} result={result} />
        ) : (
          <p className="stage-note">Pick a sample or upload a {uploadType === 'ct' ? 'CT scan' : 'colonoscopy'} picture.</p>
        )}
      </div>

      {image && (
        <div className="image-result">
          <div className="image-name">{image.name}</div>
          {status === 'analysing' && <p className="muted">Analysing…</p>}
          {status === 'no-result' && <p className="muted">Demo mode: no pre-computed result for this image.</p>}

          {status === 'done' && result && image.type === 'colonoscopy' && (
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
                  <select value={segment} onChange={(e) => chooseSegment(e.target.value as SegmentId)}>
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

          {status === 'done' && result && image.type === 'ct' && (
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
