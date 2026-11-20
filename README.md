# Colorectal Care Record (Demo)

A web platform for hospitals that keeps a colorectal cancer patient's whole history in one place and shows it on a 3D colon. Every CT scan, colonoscopy picture, video and test is saved as a **dated visit**. The doctor opens the colon as it was on any date, compares two dates, and reads every treatment and medicine that was given or planned. A new doctor who takes over the case sees what happened and what the previous doctor intended.

The tool is only a helper. **The doctor makes every decision, and the app never suggests a treatment or a medicine.**

This version is the **hospital doctor view** (doctors, the MDT, radiologists) for one **fictional demo patient**. The patient view and the outside-doctor view come later and will reuse the same data (see `src/data`).

## The pages

The tabs in the top bar choose the page; the web address changes with it (`#/visits`, `#/colon`, ...), so the browser back button works. The **Visit** selector next to the tabs chooses the visit that every page shows.

| Page | What it does |
| --- | --- |
| **Patient & visits** (`#/visits`) | The patient's details (editable) and the 4 dated visits: pictures, video, tests and findings of each. Click a visit to open it everywhere. The doctor can add a visit (date and what was done) and edit the test notes. |
| **3D colon** (`#/colon`) | The chosen visit's colon: blue pins for polyps, a red pin for a tumor. Drag to rotate, scroll to zoom. The findings list is on the right: select a finding to edit its size and segment. **Mark by hand** adds a polyp or tumor by clicking the colon. **Pictures** opens the visit's pictures with the AI marks, and lets the doctor upload a new one. |
| **Fly-through** (on the 3D colon page) | Select a finding, then **Fly-through**: the camera flies inside the colon to the finding. A demo only: "Demo fly-through, not built from real scan data." It looks plain because the model has no texture inside. |
| **Videos** (`#/videos`) | Plays the visit's video. Findings in it are listed as timestamps ("Polyp at 00:07"); a click jumps to that moment. |
| **Over time** (`#/time`) | How a polyp could grow into the colon wall, starting from its measured size (editable), with slow, medium or fast growth. Always says: "Illustration with assumed settings. Not a prediction for any patient." |
| **Compare dates** (`#/compare`) | Two colons side by side for any two visits (rotating one turns the other), and a table of how each finding's size changed. Findings are matched by kind and segment. |
| **Treatment record** (`#/treatment`) | Dated treatment and medicine entries written by the doctor, each Done, In progress or Planned, with a note, in date order. A progress bar shows the steps done out of all steps. |
| **Report** (`#/report`) | A report for the radiologist about the chosen visit: filled in from its findings, with a snapshot of the 3D colon. The text is editable. **Print** and **Save as PDF** use the browser's print window. The app writes no medical advice and no AI-written text. |

Always on screen: the **Demo mode** tag, "Decision-support tool. The doctor makes the final decision." and the 3D model credit.

## Demo mode and saved data

- The real AI is not ready. The pictures and videos in `public/samples/` are generated **placeholders** (marked "PLACEHOLDER"), and their AI results are **pre-computed** in `public/samples/results.json`. When the app starts for the first time it runs the detector on every pre-loaded picture and video to build the 4 visits.
- Everything the doctor changes (patient details, added visits, edited findings, manual marks, test notes, treatment entries, report text) is saved in the browser (`localStorage`), so it stays after a refresh.
- An uploaded picture only stays until the page is refreshed (browsers cannot keep the file); its findings are kept.
- To start the demo again from the beginning, clear this site's data in the browser (for example: DevTools → Application → Local storage → delete `colorectal-care-record-v1`).

## How to run

You need [Node.js](https://nodejs.org) (version 22 recommended; 20.19 or newer works).

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173). To check that everything builds: `npm run build`.

## Hosting on GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds the app and publishes it every time you push to `main`.

One-time setup: in the repository on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**. The site is then at `https://<your-username>.github.io/<repository-name>/`.

## Folder structure

```
public/
  models/colon.glb        the 3D colon model (not changed by the code)
  samples/                placeholder pictures and videos of the 4 visits, and results.json (pre-computed AI results)
src/
  detector.ts             the AI detector: the one function to replace with a real model
  App.tsx                 the app shell: top bar, current page, footer; the chosen visit and selection
  main.tsx                starts the app and loads the styles
  types.ts                the shapes of visits, findings, pictures, treatment entries, reports, detector results
  data/                   the shared data (later reused by the patient and outside-doctor views)
    record.ts             the patient record: builds the demo, saves to localStorage, the changes a doctor can make
    demoPatient.ts        the fictional patient, the 4 visits and the treatment entries
    segments.ts           colon segments: names, colours, model part names
  pages/                  one file per page
    VisitsPage.tsx        Patient & visits
    ColonPage.tsx         3D colon, findings list, marking, pictures panel, fly-through
    VideosPage.tsx        Videos
    TimePage.tsx          Over time (ASSUMED growth settings at the top)
    ComparePage.tsx       Compare dates
    TreatmentPage.tsx     Treatment and medicine record
    ReportPage.tsx        Report
  components/             parts of the screen
    TopBar.tsx            title, tabs, demo tag, decision-support line, visit selector
    ColonViewer.tsx       the 3D colon with labels, pins, manual marking and the fly-through
    FindingsList.tsx      the findings list with size and segment editing
    ImagePanel.tsx        the pictures panel: the visit's pictures, upload, segment choice
    ImageMarks.tsx        draws boxes and outlines on a picture
    PolypCloseup.tsx      the 3D close-up of the growing polyp (Over time)
    WallCrossSection.tsx  the colon wall drawing with its layers (Over time)
  lib/                    helper code
    route.ts              the page tabs and the hash routing
    colonScene.ts         3D renderer, camera, lights, mouse controls
    colonModel.ts         loads and smooths the model, finds points on segments
    flyThrough.ts         the fly-through camera flight
    snapshot.ts           the still picture of the 3D colon for the report
    labels.ts, pins.ts    segment labels and finding pins on the 3D view
    pinPositions.ts       where each finding sits on the colon (same on every page)
    linkViews.ts          links the two 3D views on Compare dates
    compare.ts            matches findings of two dates and works out the size change
    findings.ts, dates.ts finding names and sizes; date formatting
  styles.css, styles/     page styles (polyps blue, tumors red)
```

## Using real pictures and videos

1. Put the files in `public/samples/`, and list them for each visit in `src/data/demoPatient.ts` (file name, name shown to the doctor, `colonoscopy` or `ct`, and for colonoscopy pictures the segment).
2. Add their results to `public/samples/results.json`, under the file name. All picture numbers are **pixels of the original image**, from the top-left corner:
   - polyp: `"box": { "x": left, "y": top, "w": width, "h": height }` and `"size": { "value": 6, "unit": "mm" }`
   - tumor: `"outline": [[x, y], [x, y], ...]`, `"size": { "value": 3.4, "unit": "cm" }` and `"segment"` (one of `cecum`, `appendix`, `ascending`, `hepatic`, `transverse`, `splenic`, `descending`, `sigmoid`, `rectum`)
   - video: `"moments": [{ "time": 7, "kind": "polyp", "size": { "value": 6, "unit": "mm" } }]` (time in seconds)
3. Clear the saved demo data in the browser (see above) so the visits are built again.

## Replacing the demo detector with a real model

All AI calls go through one function in `src/detector.ts`:

```ts
detect(media: { name: string; url: string }, type: 'colonoscopy' | 'ct' | 'video'): Promise<DetectionResult | null>
```

Rewrite its body so it sends the picture or video (load it from `media.url`) to your model and returns the same shape:

```ts
{
  polyps: [{ box: { x, y, w, h }, size: { value, unit: 'mm' } }],
  tumor: { outline: [[x, y], ...], size: { value, unit: 'cm' }, segment: 'sigmoid' }, // or null
  moments: [{ time, kind: 'polyp', size: { value, unit: 'mm' } }] // videos only
}
```

Return `null` if the model gives no result. Then set `DEMO_MODE = false` in the same file to hide the "Demo mode" tag. No other file needs to change.

## Not included

Treatment or medicine suggestions, login, insurance features, and privacy and consent features (to be defined before any real patient data is used).

## References

1. Human Reference Atlas (HRA). *Large Intestine, Female* (3D reference organ, file `hra-reference-organ-large-intestine-female-v1.2.glb`). NIH 3D, entry 3DPX-020971. License: CC-BY 4.0. https://3d.nih.gov/entries/3DPX-020971 (accessed 19 Nov 2026). Note: this model was not based on direct imaging data.
2. HRA 3D Reference Object Library. https://humanatlas.io/3d-reference-library

3D colon model shown in the app: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
