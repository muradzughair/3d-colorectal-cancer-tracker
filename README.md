# Colorectal Cancer Decision Support (Demo)

A simple web tool that helps doctors look at colorectal findings in one place. It has four pages, chosen with the tabs in the top bar. The web address changes with the page (`#/colon`, `#/time`, `#/compare`, `#/patient`), so the browser back button works.

All pages share the same findings, patient details and treatment plan. They are kept in memory only, so reloading the page starts again.

## The four pages

**1. 3D colon** (`#/colon`)
- Every finding appears on one 3D colon: blue pins for polyps, a red pin for a tumor. Drag to rotate, scroll to zoom.
- The findings list is a slim column on the right: name, segment, size, AI or Manual, and whether the position is "estimated" or "exact". Click a finding to highlight its pin. Manual marks can be removed with the x.
- **Mark by hand:** at the bottom centre, choose Polyp or Tumor, then click once on the colon. The mode switches off after the click.
- **Add picture** (top left) opens the pictures panel (see below).

**2. Over time** (`#/time`)
- A what-if time slider. Left: a 3D close-up of the selected polyp on the colon. A small growth sits on the colon surface and grows as the slider moves: blue while it is a polyp, red once it becomes a tumor. Right: the colon wall if the polyp is removed now, and if it is left in place.
- Select a polyp on the 3D colon page to see that polyp. With no polyp selected, an example polyp in the sigmoid colon is shown.
- It is an illustration with assumed settings, not a prediction for any patient.

**3. Before / after** (`#/compare`)
- Two 3D colons side by side, "Before treatment" and "After treatment (planned)". Rotating or zooming one does the same to the other.
- The "after" view follows the treatment plan from the Patient page, finding by finding (see below).

**4. Patient & plan** (`#/patient`)
- A fictional demo patient (all fields can be edited), a summary of the findings, the treatment plan and a follow-up date.

## The pictures panel

On the 3D colon page, **Add picture** slides a panel in from the left. In it:
- **Polyp finder:** choose Colonoscopy, then upload a picture or pick a sample. The AI draws a blue box around each polyp ("Polyp detected"). The doctor chooses which colon segment the picture is from, and the polyps appear on the 3D colon.
- **Tumor finder:** choose CT scan, then upload a picture or pick the sample. The AI outlines the tumor in red ("Tumor outlined") and reports its size and segment.

The close button slides the panel away; the findings stay on the 3D colon. Once at least one picture has been analysed, the button reads "Pictures (2)" (the number of analysed pictures). Open it again to look at those pictures.

## The treatment plan and the Before / after page

On the Patient page the doctor chooses an action for every finding, plus a planned date and a note. The AI never suggests a treatment. The default is "Not decided". The "after" view on the Before / after page shows:

| Finding | Action chosen | After treatment |
| --- | --- | --- |
| Polyp | Remove (polypectomy) | small grey "removed" mark instead of the blue pin |
| Polyp | Monitor | stays a blue pin |
| Tumor | Surgery (remove segment) | the colon segment is greyed out, slightly transparent, labelled "Removed segment" |
| Tumor | Referred to oncology | stays a red pin |
| Either | Not decided | unchanged, with a dashed ring on the pin |

The tool is only a helper. **The doctor makes the final decision.**

## Demo mode

The real AI model is not ready yet. In demo mode the tool does not analyse pictures. It shows **pre-computed results** for the three sample pictures, stored in `public/samples/results.json`. Uploading any other picture shows the picture with the message "no pre-computed result".

The time slider uses **assumed** growth times (slow 15, medium 10, fast 5 years). They are an illustration, not a prediction for any patient. You can change them at the top of `src/pages/TimePage.tsx`.

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
  App.tsx                 the app shell; keeps the shared data (findings, pictures, patient, plan)
  main.tsx                starts the app and loads the styles
  types.ts                the shapes of findings, pictures, patient and detector results
  styles.css              colours, page frame, top bar and shared controls
  styles/                 viewer.css (3D view, pins, labels), colon-page.css (page 1, pictures panel),
                          pictures.css (inside the panel), pages.css (pages 2 and 3), patient.css (page 4)
  pages/                  one file per page
    ColonPage.tsx         page 1: 3D colon, findings column, marking buttons, pictures panel
    TimePage.tsx          page 2: the time slider (ASSUMED settings at the top)
    ComparePage.tsx       page 3: before / after, built from the treatment plan
    PatientPage.tsx       page 4: patient, findings summary, plan, follow-up date
  components/             the parts of the screen
    TopBar.tsx            title, page tabs, demo tag, decision-support line
    ImagePanel.tsx        inside the pictures panel: picture picker, upload, segment choice
    ImageMarks.tsx        draws boxes and outlines on the picture
    ColonViewer.tsx       the 3D colon, pins, labels and manual marking
    FindingsList.tsx      the findings list
    PolypCloseup.tsx      the 3D close-up of the growing polyp (page 2)
    WallCrossSection.tsx  the colon wall drawing with its layers
  lib/                    helper code
    route.ts              the page tabs and the hash routing
    colonScene.ts         3D renderer, camera, lights, mouse controls
    colonModel.ts         loads and smooths the model, finds points on segments, greys out segments
    labels.ts             segment labels with leader lines
    pins.ts               finding pins on the 3D colon
    pinPositions.ts       where each finding sits on the colon (same on every page)
    linkViews.ts          links the two 3D views on the Before / after page
    plan.ts               the treatment actions and the plan data
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

## References

1. Human Reference Atlas (HRA). *Large Intestine, Female* (3D reference organ, file `hra-reference-organ-large-intestine-female-v1.2.glb`). NIH 3D, entry 3DPX-020971. License: CC-BY 4.0. https://3d.nih.gov/entries/3DPX-020971 (accessed 19 Nov 2026). Note: this model was not based on direct imaging data.
2. HRA 3D Reference Object Library. https://humanatlas.io/3d-reference-library

3D colon model shown in the app: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
