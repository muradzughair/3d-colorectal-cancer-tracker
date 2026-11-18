// Shows a medical picture with the AI's marks drawn on top:
// a blue box for each polyp and a red outline for a tumor.
import { useState } from 'react'
import type { DetectionResult } from '../types'

interface Props {
  url: string
  alt: string
  result: DetectionResult | null
}

export default function ImageMarks({ url, alt, result }: Props) {
  // The picture's real size in pixels. The marks use the same pixel numbers, so the
  // drawing layer gets the same size and always lines up with the picture.
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const fontSize = size ? Math.max(12, size.w * 0.042) : 12

  return (
    <div className="image-marks">
      <img
        src={url}
        alt={alt}
        onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      />
      {size && result && (
        <svg viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="xMidYMid meet">
          {result.polyps.map((polyp, i) => (
            <g key={i} className="mark-polyp">
              <rect x={polyp.box.x} y={polyp.box.y} width={polyp.box.w} height={polyp.box.h} rx={4} />
              <MarkLabel x={polyp.box.x} y={polyp.box.y} text="Polyp detected" fontSize={fontSize} />
            </g>
          ))}
          {result.tumor && (
            <g className="mark-tumor">
              <polygon points={result.tumor.outline.map((p) => p.join(',')).join(' ')} />
              <MarkLabel
                x={Math.min(...result.tumor.outline.map((p) => p[0]))}
                y={Math.min(...result.tumor.outline.map((p) => p[1]))}
                text="Tumor outlined"
                fontSize={fontSize}
              />
            </g>
          )}
        </svg>
      )}
    </div>
  )
}

// A small coloured tag with white text, sitting just above a mark.
function MarkLabel({ x, y, text, fontSize }: { x: number; y: number; text: string; fontSize: number }) {
  const height = fontSize * 1.6
  const width = text.length * fontSize * 0.58 + fontSize
  return (
    <g className="mark-label">
      <rect x={x} y={y - height - 3} width={width} height={height} rx={3} />
      <text x={x + fontSize / 2} y={y - height / 2 - 3} fontSize={fontSize} dominantBaseline="central">
        {text}
      </text>
    </g>
  )
}
