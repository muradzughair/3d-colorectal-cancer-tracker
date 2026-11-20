// Videos: plays the chosen visit's video. The findings the detector found in it are listed as
// timestamps ("Polyp at 00:07"); clicking one jumps the video to that moment.
import { useRef, useState } from 'react'
import { SAMPLES_FOLDER } from '../data/record'
import { formatDate } from '../lib/dates'
import { formatSize } from '../lib/findings'
import type { Visit } from '../types'

interface Props {
  visit: Visit
  visits: Visit[] // oldest first, to point to the visits that do have a video
  onVisit: (id: string) => void
}

// 67 seconds -> "01:07"
function clock(seconds: number): string {
  const s = Math.floor(seconds)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const SHOWN_FOR = 3 // seconds a moment stays highlighted while the video plays past it

export default function VideosPage({ visit, visits, onVisit }: Props) {
  const player = useRef<HTMLVideoElement>(null)
  const [now, setNow] = useState(0) // current time of the video, in seconds
  const video = visit.video

  if (!video) {
    const withVideo = visits.filter((v) => v.video)
    return (
      <div className="page page-text">
        <div className="doc">
          <p className="muted">This visit ({formatDate(visit.date)}) has no video.</p>
          {withVideo.length > 0 && (
            <p className="video-elsewhere">
              Visits with a video:{' '}
              {withVideo.map((v) => (
                <button key={v.id} className="link-button" onClick={() => onVisit(v.id)}>
                  {formatDate(v.date)} · {v.title}
                </button>
              ))}
            </p>
          )}
        </div>
      </div>
    )
  }

  const jumpTo = (seconds: number) => {
    const element = player.current
    if (!element) return
    element.currentTime = seconds
    element.play().catch(() => {}) // the browser may refuse to start playing by itself; the jump still works
  }

  return (
    <div className="page video-page">
      <div className="video-stage">
        <video
          ref={player}
          src={SAMPLES_FOLDER + video.file}
          controls
          preload="metadata"
          onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
        />
      </div>

      <aside className="video-side">
        <h2>{video.name}</h2>
        <p className="muted">
          {formatDate(visit.date)} · {visit.title}
        </p>

        <h3>Found in this video</h3>
        {video.moments.length === 0 ? (
          <p className="muted">Nothing found, or no pre-computed result in demo mode.</p>
        ) : (
          <ul className="moment-list">
            {video.moments.map((m, i) => {
              const active = now >= m.time && now < m.time + SHOWN_FOR
              return (
                <li key={i}>
                  <button className={`moment moment-${m.kind}${active ? ' is-active' : ''}`} onClick={() => jumpTo(m.time)}>
                    <span className={`dot dot-${m.kind}`} />
                    <span>
                      {m.kind === 'polyp' ? 'Polyp' : 'Tumor'} at <strong>{clock(m.time)}</strong>
                    </span>
                    <span className="muted">{formatSize(m.size)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="muted small-note">Click a time to jump to that moment. In demo mode these results are pre-computed.</p>
      </aside>
    </div>
  )
}
