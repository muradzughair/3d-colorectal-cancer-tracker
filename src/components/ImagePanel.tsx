// The content of the sliding "Pictures" panel: thumbnails of the chosen visit's CT and
// colonoscopy pictures. Each has a Download button (the original file). Clicking a thumbnail
// enlarges the picture, with the AI's marks drawn on it (blue boxes for polyps, red outline
// for a tumor).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { pictureUrl } from '../data/record'
import { formatDate } from '../lib/dates'
import type { Picture, Visit } from '../types'
import ImageMarks from './ImageMarks'

interface Props {
  visit: Visit
  onClose: () => void
}

// The Download link for one picture: the browser saves the original file.
function DownloadLink({ picture }: { picture: Picture }) {
  return (
    <a className="button button-light download-button" href={pictureUrl(picture)} download={picture.file}>
      Download
    </a>
  )
}

export default function ImagePanel({ visit, onClose }: Props) {
  const [enlarged, setEnlarged] = useState<Picture | null>(null)

  // Escape closes the enlarged picture.
  useEffect(() => {
    if (!enlarged) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setEnlarged(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enlarged])

  return (
    <div className="image-panel">
      <div className="panel-title">
        <h2>Pictures · {formatDate(visit.date)}</h2>
        <button className="close-button" onClick={onClose} aria-label="Close the pictures panel" title="Close">
          ×
        </button>
      </div>

      {visit.pictures.length === 0 ? (
        <p className="muted">This visit has no pictures.</p>
      ) : (
        <ul className="picture-grid">
          {visit.pictures.map((p) => (
            <li key={p.file} className="picture-card">
              <button className="picture-thumb" onClick={() => setEnlarged(p)} title="Click to enlarge">
                <img src={pictureUrl(p)} alt={p.name} />
              </button>
              <div className="picture-info">
                <strong>{p.name}</strong>
                <span className="muted">{p.file}</span>
              </div>
              <DownloadLink picture={p} />
            </li>
          ))}
        </ul>
      )}

      {/* The enlarged picture covers the whole page (drawn straight into the page body, so the
          sliding panel does not limit it); click outside it, ×, or Escape to close. */}
      {enlarged &&
        createPortal(
          <div className="lightbox" onClick={() => setEnlarged(null)} role="dialog" aria-label={enlarged.name}>
            <div className="lightbox-body" onClick={(e) => e.stopPropagation()}>
              <div className="lightbox-head">
                <strong>{enlarged.name}</strong>
                <span className="muted">{formatDate(visit.date)}</span>
                <DownloadLink picture={enlarged} />
                <button
                  className="close-button"
                  onClick={() => setEnlarged(null)}
                  aria-label="Close the enlarged picture"
                  title="Close"
                >
                  ×
                </button>
              </div>
              <div className="lightbox-image">
                <ImageMarks url={pictureUrl(enlarged)} alt={enlarged.name} result={enlarged.result} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
