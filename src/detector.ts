// THE AI DETECTOR. This is the only file you need to change to plug in a real model.
//
// detect(media, type) receives one still picture or one video and returns what the AI found:
//   - polyps: a box (x, y, w, h in image pixels) and a size in mm
//   - tumor:  an outline polygon (image pixels), a size in cm and the colon segment
//   - moments (videos only): the time in seconds where a polyp or tumor is seen, with its size
// It returns null when it has no result.
//
// DEMO MODE: the real AI is not ready yet, so this version just looks up pre-computed
// results for the sample files in public/samples/results.json.
import type { DetectionResult, MediaType } from './types'

// Shows the "Demo mode" tag at the top of the page. Set to false when the real model is used.
export const DEMO_MODE = true

export interface InputMedia {
  name: string // file name, e.g. "v2-ct.png"
  url: string // address the browser can load the picture or video from
}

const RESULTS_URL = `${import.meta.env.BASE_URL}samples/results.json`

export async function detect(media: InputMedia, type: MediaType): Promise<DetectionResult | null> {
  // A real model would load the pixels from media.url and use `type` to choose between
  // the polyp model (colonoscopy pictures and videos) and the tumor model (CT).
  void type

  const response = await fetch(RESULTS_URL)
  const results = (await response.json()) as Record<string, DetectionResult>
  return results[media.name] ?? null
}
