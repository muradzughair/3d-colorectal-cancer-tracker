# Colorectal Cancer Decision Support (Demo)

A simple web tool that helps doctors look at colorectal findings in one place.

- **Polyp finder:** upload a colonoscopy picture (or pick a sample). The AI draws a blue box around each polyp. The doctor chooses which colon segment the picture is from.
- **Tumor finder:** upload a CT scan image (or pick the sample). The AI outlines the tumor in red and reports its size and segment.
- **3D colon map:** every finding appears on one 3D colon (blue numbered pins for polyps, a red pin for a tumor), next to a findings list. Drag to rotate, scroll to zoom.
- **Manual marking:** choose Polyp or Tumor, then click on the 3D colon to mark a finding by hand.
- **Time slider (what-if):** shows how a polyp left in place could grow into the colon wall over the years, next to the same wall if it is removed now.

The tool is only a helper. **The doctor makes the final decision.**

## Demo mode

The real AI model is not ready yet. In demo mode the tool does not analyse pictures. It shows **pre-computed results** for the three sample pictures, stored in `public/samples/results.json`. Uploading any other picture shows the picture with the message "no pre-computed result".

The time slider uses **assumed** growth times (slow 15, medium 10, fast 5 years). They are an illustration, not a prediction for any patient. You can change them at the top of `src/components/TimeSlider.tsx`.

## How to run

You need [Node.js](https://nodejs.org) (version 22 recommended; 20.19 or newer works).

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

To check that everything builds: `npm run build`.

## Hosting on GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds the app and publishes it every time you push to `main`.

One-time setup: in the repository on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**. The site is then at `https://<your-username>.github.io/<repository-name>/`.

## Folder structure

```
public/
  models/colon.glb        the 3D colon model (not changed by the code)
  samples/                sample pictures and their pre-computed results (results.json)
src/
  detector.ts             the AI detector, the one file to replace with a real model
  App.tsx                 the page layout; keeps the list of findings
  types.ts                the shapes of findings and detector results
  styles.css              all page styles (polyps blue, tumors red)
  components/             the parts of the screen
    Header.tsx            title, demo tag, decision-support line
    ImagePanel.tsx        picture picker, upload, segment choice
    ImageMarks.tsx        draws boxes and outlines on the picture
    ColonViewer.tsx       the 3D colon map, pins and manual marking
    FindingsList.tsx      the findings list
    TimeSlider.tsx        the what-if time slider (ASSUMED settings at the top)
    WallCrossSection.tsx  the colon wall drawing with its layers
  lib/                    helper code
    colonScene.ts         3D renderer, camera, lights, mouse controls
    colonModel.ts         loads and smooths the model, finds points on segments
    labels.ts             segment labels with leader lines
    pins.ts               finding pins on the 3D colon
    findings.ts           finding names, numbers and sizes
  data/
    segments.ts           colon segments: names, colours, model part names
    samples.ts            the list of sample pictures
```

## Using real sample pictures

The pictures in `public/samples/` are generated placeholders marked "PLACEHOLDER". To use real ones:

1. Put your images in `public/samples/` with the same names: `colonoscopy-1.png`, `colonoscopy-2.png`, `ct-1.png`. To use other names, edit `src/data/samples.ts`.
2. Update `public/samples/results.json` so the boxes and outlines match your images. All numbers are **pixels of the original image**, measured from the top-left corner:
   - polyp: `"box": { "x": left, "y": top, "w": width, "h": height }` and `"size": { "value": 6, "unit": "mm" }`
   - tumor: `"outline": [[x, y], [x, y], ...]`, `"size": { "value": 3.4, "unit": "cm" }` and `"segment"` (one of `cecum`, `appendix`, `ascending`, `hepatic`, `transverse`, `splenic`, `descending`, `sigmoid`, `rectum`)

## Replacing the demo detector with a real model

All AI calls go through one function in `src/detector.ts`:

```ts
detect(image: { name: string; url: string }, type: 'colonoscopy' | 'ct'): Promise<DetectionResult | null>
```

To plug in a real model, rewrite the body of `detect` so it sends the picture (load it from `image.url`) to your model and returns the same shape:

```ts
{
  polyps: [{ box: { x, y, w, h }, size: { value, unit: 'mm' } }],
  tumor: { outline: [[x, y], ...], size: { value, unit: 'cm' }, segment: 'sigmoid' } // or null
}
```

Return `null` if the model gives no result. Then set `DEMO_MODE = false` in the same file to hide the "Demo mode" tag. No other file needs to change.

## Credits

3D colon model: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
