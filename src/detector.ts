// THE AI DETECTOR. This is the only file you need to change to plug in a real model.
//
// detect(image, type) receives one still picture and returns what the AI found:
//   - polyps: a box (x, y, w, h in image pixels) and a size in mm
//   - tumor:  an outline polygon (image pixels), a size in cm and the colon segment
// It returns null when it has no result for the picture.
//
// DEMO MODE: the real AI is not ready yet, so this version just looks up pre-computed
// results for the sample pictures in public/samples/results.json.
import type { DetectionResult, ImageType } from './types'

// Shows the "Demo mode" tag at the top of the page. Set to false when the real model is used.
export const DEMO_MODE = true

export interface InputImage {
  name: string // file name, e.g. "colonoscopy-1.png"
  url: string // address the browser can load the picture from
}

const RESULTS_URL = '/samples/results.json'

export async function detect(image: InputImage, type: ImageType): Promise<DetectionResult | null> {
  // A real model would load the pixels from image.url and use `type` to choose between
  // the polyp model (colonoscopy) and the tumor model (CT). The demo does not need it.
  void type

  const response = await fetch(RESULTS_URL)
  const results = (await response.json()) as Record<string, DetectionResult>
  return results[image.name] ?? null
}
