# Colorectal Care Record (Demo)

A web platform for hospitals that keeps a colorectal cancer patient's whole history in one place and shows it on a 3D colon. Every CT scan and colonoscopy picture is saved with a **dated visit**. The doctor opens the colon as it was on any date, compares two dates, and reads every treatment and medicine that was given or planned. A new doctor who takes over the case sees what happened and what the previous doctor intended.

The tool is only a helper. **The doctor makes every decision, and the app never suggests a treatment or a medicine.**

This version is the **hospital doctor view** (doctors, the MDT, radiologists) with **five fictional demo patients**. All patient data is invented for the demo (a small "Demo data" tag is shown wherever it appears), but it is medically consistent: dates, drugs, lab values and stages agree with each other. The patient view and the outside-doctor view come later and will reuse the same data (see `src/data`).

## Patients

The app opens on the **patient list** (`#/patients`): ID, name, age and sex, diagnosis, stage, status, last visit, next appointment and an allergy mark. Click a column header to sort, type in the search box to find a patient by name or ID, and click a row to open the patient. **Reset demo data** (at the bottom) clears every saved change after a confirm.

| ID | Patient | Story |
| --- | --- | --- |
| PT-1001 | Layla Nasser, 58, F | Sigmoid cancer found at screening, chemotherapy before surgery, sigmoid colectomy (ypT3 N0, ypIIA); ascending colon polyp booked for removal. Her pictures go through the demo detector. |
| PT-1002 | Omar Haddad, 64, M | Positive FIT, two adenomas removed, no cancer; on apixaban; surveillance colonoscopy in 2029. |
| PT-1003 | Sara Khalil, 47, F | Mid-rectal cancer cT3 N1 M0 (IIIB), chemoradiotherapy done, awaiting low anterior resection. Latex allergy. |
| PT-1004 | Yousef Mansour, 71, M | Ascending colon cancer, right hemicolectomy pT3 N1b (IIIB), CAPOX done, in follow-up; aspirin, metformin. |
| PT-1005 | Nadia Qasem, 53, F | Sigmoid cancer with liver metastases (cT4a N2 M1a, IVA), KRAS G12D, on FOLFOX plus bevacizumab. Contrast allergy. |

Patients 2 to 5 have no pictures yet: their findings are written in the data (source "manual").

Every page of a patient has its own address, for example `#/patients/PT-1003/colon` (`/time`, `/compare`, `/treatment`, `/profile`), so a reload keeps the same patient. The top bar shows the page tabs, and on the right the patient's name and ID (click to open the Patient page) and **All patients**. Opening another patient starts every page fresh: nothing of the previous patient stays on screen.

## The pages

The tabs in the top bar choose the page; the web address changes with it, so the browser back button works. On the 3D pages the small **Visit date** dropdown next to the tabs chooses which dated visit is shown (it is a selector, not a page).

| Page | What it does |
| --- | --- |
| **3D colon** (`/colon`) | The main page. A switch at the top chooses **Outside** or **Inside**. **Outside:** the chosen visit's colon with the lesion markers (see below) and the colon map; drag to rotate, scroll to zoom. **Mark by hand** adds a polyp or tumor by clicking the colon. **Inside:** a simulated endoscopy (see below). In both views the findings list is on the right (select a finding to edit its size and segment), and **Pictures** opens a side panel with the visit's CT and colonoscopy pictures: **Download** saves the original file, and clicking a thumbnail enlarges it with the AI marks. |
| **Over time** (`/time`) | How a polyp could grow into the colon wall, starting from its measured size (editable), with slow, medium or fast growth. Always says: "Illustration with assumed settings. Not a prediction for any patient." |
| **Before/after** (`/compare`) | Two colons side by side for any two visits (rotating one turns the other), and a table of how each finding's size changed. Findings are matched by kind and segment. |
| **Treatment** (`/treatment`) | The treatment plan as a graph: every phase, what is done, what is happening now and what is planned. See below. |
| **Patient** (`/profile`) | The whole patient file on one page (read-only), so the doctor never has to go back to paper. See below. |

## The Treatment page (treatment plan graph)

Time runs from left to right. Each **phase** the doctor entered (for example "Diagnosis and staging", "Neoadjuvant treatment", "Surgery", "Surveillance") is a column with its name on top; only phases that exist for the patient are shown. The rows are **lanes**: Procedures, Medicine, Imaging and tests, Reviews. Each step is a node in its phase and lane, in date order; steps on the same date in different lanes (for example radiotherapy and capecitabine) sit at the same position. Thin curved lines join each step to the steps it follows.

- **Done**: green fill with a check; **In progress**: half filled, with a slow pulse; **Planned**: dashed outline. (Red and blue are kept for tumors and polyps.) A small shape shows the kind of step (procedure, medicine, radiotherapy, imaging, lab, review).
- A repeated treatment is **one node** with a row of cycle dots and the text "Cycle 10 of 12" (filled = done, outline = planned). Repeated tests (CEA every 3 months) work the same way.
- A dashed **Today** line with the date. The status of each step is stored, not computed from the date.
- Above the graph: the patient, the current phase, "N of M steps done", the next planned step and a legend. The graph scrolls sideways; **Fit to screen** shows it all, **Jump to today** scrolls to the Today line. Nodes can be reached with Tab and opened with Enter.
- **Click a step** to open its details on the right (Esc or × closes): status, dates, phase, lane, what was done, who and where, medicine (drugs, dose, route, schedule, each cycle with its date and note), radiotherapy (dose and fractions), result, side effects with grade, notes, and links: **Open the visit** (Over time page on that visit), **Show the lesion on the 3D colon** and **Open in Patient page** (for example the pathology or lab section).
- **Add step** (bottom right), **Edit** and **Delete** (with a confirm) change the plan. Changes are saved per patient.

There are no team meetings and no decision boxes in the graph, and the app never suggests a step: it shows only what the doctor entered.

## The Patient page

A compact strip stays at the top while scrolling: name, age, sex, ID, blood group, diagnosis, stage, status, ECOG, allergies and blood thinners in red, the last CEA with a trend arrow, and the next appointment. A thin section list on the left jumps to each section and highlights the one in view:

1. Alerts (allergies, blood thinners and antiplatelets, special precautions)
2. Endoscopy findings of all visits, with status and a **Show on 3D colon** link
3. Diagnosis and staging (clinical and pathologic TNM)
4. Pathology, one entry per specimen (standard colorectal report elements; histology, dysplasia and completeness for polyps)
5. Biomarkers and genetics (MMR, MSI, KRAS, NRAS, BRAF V600E, HER2, NTRK, DPYD, germline)
6. Medications by group, with stopped medicines and the reason; blood thinners say "Check before any procedure"
7. Allergies in detail
8. Labs by group with unit, reference range and date, H / L flags outside the range, and small trend lines for CEA, hemoglobin and creatinine (hover a point to see the value)
9. Imaging and procedures, linked to the visit when there is one
10. Medical history, ECOG and ASA
11. Family history
12. Lifestyle, with a weight trend and the BMI (calculated by the app)
13. Symptoms, latest vital signs and examination
14. Care team and upcoming appointments

Every value shows its date and where it came from (for example "Pathology report", "Lab", "Clinic note"). A value that does not exist says "Not done", "Not available" or "Not required at this stage", never a blank. The only automatic mark is the H / L reference-range flag on lab values; the app does not interpret results.

Always on screen: the **Demo mode** tag, "Decision-support tool. The doctor makes the final decision." and the 3D model credit.

## The Inside view (simulated endoscopy)

A simulation, **not a real video and not from patient scan data**. The page always says: "Simulation based on a reference model. Not a real video and not from patient scan data."

- **Free camera**, like a first-person game. Hold the left mouse button and drag to look around (up and down limited to about 85 degrees, no roll). **W** forward, **S** back, **A** left, **D** right, **Q** down, **E** up, all relative to where the camera looks; the mouse wheel moves forward and back in small steps. Movement speeds up gently and stops smoothly at one fixed speed, the same at any frame rate. Keys do nothing while typing in a field. A short hint at the bottom fades after a few seconds; **?** shows it again.
- **Staying inside**: the camera starts at the anal end and can go anywhere inside the lumen, but never through the wall. Every move is checked against the colon's centerline (`src/data/centerline.ts`) and the inner radius at the nearest point (searched near the last point, so it is fast), with half the radius kept free for the wall and the folds. A move past the limit slides along the wall instead of stopping. The camera stops at both ends (anal end and cecum). The near clipping plane is very small, so the wall is not cut open when looking at it from close by. (The limit was tested by pushing a camera against the model wall thousands of times: it never got out and stayed about 3 mm from the wall.)
- **Go to finding** glides to a point about 5 cm in front of the finding, looking at it. **Re-center** puts the camera back on the centerline at the same place, looking along the colon. A small label appears next to a finding when the camera is close.
- **Now in**: the colon part the camera is in and its approximate distance from the anal verge (for example "Sigmoid colon · about 28 cm from the anal verge").
- **Mini-map** (bottom left): a flat front view of the centerline with a dot for the camera, a short arrow for its heading, and blue (polyp) and red (tumor) marks. Click a point on it to move the camera there.
- **Look**: a wide 100° lens with a faint round vignette; a light on the camera that fades with distance, and dark fog, so far parts fade to black. The wall is a wet, pink-red lining (`src/lib/mucosa.ts`) with ring-shaped folds drawn by the shader. Plain three.js only; no post-processing libraries. Leaving the view removes all its listeners and 3D objects.

## Lesions: data, markers, detail card and colon map

**What is recorded for each lesion** (as in standard colonoscopy and pathology reports; all optional): distance from the anal verge in cm, how the position was obtained (**estimated**, **measured** or **confirmed at surgery**; AI findings are always estimated), clock position for the rectum, notes; for polyps the **Paris type** (0-Ip, 0-Isp, 0-Is, 0-IIa, 0-IIb, 0-IIc, 0-IIa+IIc, 0-III), optional optical diagnosis (NICE, Kudo), histology (only from a pathology report) and resection (method, en bloc or piecemeal, complete, date); for tumors the morphology (polypoid, ulcerated, annular, flat), length, how much of the wall it goes around, the lumen, and the stage as written. The app never fills in histology or stage by itself: a missing histology says "Pathology result not available".

**Distance in cm** (`src/lib/colonDistance.ts`): the 3D model is a generic atlas colon, not the patient's own, so a cm value worked out from the model is always shown as "about" or "~". Typical adult values per part are spread along the centerline: rectum 0 to 15, sigmoid 15 to 40, descending 40 to 65, splenic flexure about 65, transverse 65 to 110, hepatic flexure about 110, ascending 110 to 135, cecum 135 to 150. The same helper places the markers, draws the map and gives the cm in the Inside view.

**Markers on the 3D colon** (3D colon and Before/after pages; they replace the old pins):
- A thin flat ring on the wall, blue for a polyp and red for a tumor, sized from the lesion size (never smaller than a clearly visible minimum). **Solid** = position measured or confirmed at surgery, **dashed** = estimated. A lesion with a distance is placed from it (rectal lesions on their clock side); old AI findings keep their estimated place.
- A lesion removed on an earlier visit shows as a **faint grey ring with a line through it**, only on the visits after the removal.
- A thin leader line to a one-line label, for example `P1 - Polyp - 8 mm - Sigmoid - ~30 cm`. Codes are per patient (P1, P2 ... polyps, T1 ... tumors) in order of distance from the anal verge, the same on every page. Labels are pushed apart so they never overlap, and keep clear of the part names and the findings list.
- Hover highlights the marker and its label; click opens the **detail card**.

**Detail card** (slides in from the right): code and type; position (part, cm, how it was obtained, clock position); size and shape (Paris type with a short description, or tumor morphology, length, extent around the wall, lumen); optical diagnosis if entered; histology or "Pathology result not available"; resection or "Not removed"; stage for tumors with a link to the Patient page; source ("Detected by AI (demo)" or "Entered by the doctor", with the visit date; AI findings add "Position is approximate. Confirm it with the colonoscopy report."). Buttons: **Show inside** (opens the Inside view at this lesion), **Edit** (a simple form for all the fields above, saved per patient) and **Delete** (with a confirm).

**Colon map** (bottom right of the 3D colon page, **Map** on/off): a flat diagram of the colon from the cecum to the anal verge, with the part names (they follow the Names toggle), a ruler with a tick every 10 cm, and a mark for each lesion at its cm position with its code (click to open the card). The Inside view keeps its own small mini-map, because it shows the real 3D shape of the colon with the camera position and heading, which the flat diagram cannot.

## Lesion shapes in the Inside view

In the Inside view each polyp and tumor is drawn from its recorded data (`src/lib/lesionMesh.ts`), so the shape follows the report, not a stock model:
- **Polyps** follow their Paris type: stalked (0-Ip, with a stalk and head), semi-stalked (0-Isp), sessile dome (0-Is), slightly raised plaque (0-IIa), flat (0-IIb), slightly depressed (0-IIc and 0-IIa+IIc) and excavated (0-III), sized from the recorded size. The surface has a fine granular texture and a moist sheen.
- **Tumors** follow their morphology: polypoid (a heaped, lobulated mass), ulcerated (a raised rolled rim around a crater with pale fibrin), annular (a ring around the wall that narrows the lumen as recorded: narrowed or nearly blocked) and flat. Length and extent around the wall come from the record; the folds around a tumor are pulled towards it.
- **Go to finding** moves along the colon and stops a few cm before the lesion so it is in view.

These are simulated shapes for orientation only. They are not pictures of the patient.

## Part names toggle

A floating **Names** on/off button on the 3D colon, Over time and Before/after pages shows or hides only the colon part names and their leader lines (the findings are not affected). It is on by default, remembered in the browser, and shared by all pages. Keyboard shortcut: **N** (ignored while typing in a field).

## Demo mode and saved data

- The real AI is not ready. The pictures in `public/samples/` are generated **placeholders** (marked "PLACEHOLDER"), and their AI results are **pre-computed** in `public/samples/results.json`. When the app starts for the first time it runs the detector on every picture to build the 4 visits.
- Everything the doctor changes (edited findings, manual marks, treatment plan steps) is saved in the browser (`localStorage`, key `colorectal-care-record-v3`, one record per patient), so it stays after a refresh. The Patient page data is read-only and comes from `src/data/patients`.
- To start the demo again from the beginning, use **Reset demo data** at the bottom of the patient list.

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
  samples/                placeholder pictures of the 4 visits, and results.json (pre-computed AI results)
src/
  detector.ts             the AI detector: the one function to replace with a real model
  App.tsx                 the app shell: patient list or the open patient, footer
  PatientView.tsx         one open patient: top bar, current page, chosen visit and selection
  profileTypes.ts         the shapes of the Patient page data (diagnosis, pathology, labs, ...)
  main.tsx                starts the app and loads the styles
  types.ts                the shapes of visits, findings, pictures, treatment plan steps, detector results
  data/                   the shared data (later reused by the patient and outside-doctor views)
    centerline.ts         the centerline through the colon model, its inner radius, and which part each point is in
    record.ts             the patient records: builds them from the demo data, saves to localStorage, the changes a doctor can make
    demoPatient.ts        PT-1001's 4 visits with pictures and her treatment plan
    patients/             the five patients: profile (pt1001.ts ... pt1005.ts), visits, treatment plan, lab ranges, care team
    segments.ts           colon segments: names, colours, model part names
  pages/                  one file per page
    ColonPage.tsx         3D colon: Outside | Inside switch, findings list, marking, pictures panel
    TimePage.tsx          Over time (ASSUMED growth settings at the top)
    ComparePage.tsx       Before/after
    TreatmentPage.tsx     Treatment plan graph: header, legend, Fit to screen, Jump to today, Add step
    PatientListPage.tsx   the patient list
    PatientPage.tsx       the Patient page (summary strip, section list)
  components/             parts of the screen
    TopBar.tsx            title, tabs, demo tag, decision-support line, visit date dropdown, patient name
    profile/              the sections of the Patient page and its small parts (trend line)
    treatment/            the treatment graph drawing and the step details panel with its edit form
    ColonViewer.tsx       the Outside view: 3D colon with labels, lesion markers and manual marking
    InsideView.tsx        the Inside view: free camera, Go to finding, Re-center, position text
    InsideMiniMap.tsx     the small front-view map of the colon in the Inside view
    LesionCard.tsx        the lesion detail card with its edit form
    ColonMap.tsx          the flat colon map with the cm ruler and lesion marks
    NamesToggle.tsx       the Names on/off button (N key)
    FindingsList.tsx      the findings list with size and segment editing
    ImagePanel.tsx        the pictures panel: thumbnails, Download, enlarged picture
    ImageMarks.tsx        draws boxes and outlines on a picture
    PolypCloseup.tsx      the 3D close-up of the growing polyp (Over time)
    WallCrossSection.tsx  the colon wall drawing with its layers (Over time)
  lib/                    helper code
    route.ts              the page tabs and the hash routing (#/patients/:id/:page)
    patientInfo.ts        small helpers for patient data (next appointment, lab flags, BMI)
    treatmentGraph.ts     layout of the treatment graph: phase columns, lanes, nodes, lines, Today line
    colonScene.ts         3D renderer, camera, lights, mouse controls
    colonModel.ts         loads and smooths the model, finds points on segments
    insideScene.ts        the Inside view's 3D scene: wall, headlight, fog, findings on the wall
    insideControls.ts     the free camera: drag to look, W A S D Q E, wheel, glide to a spot
    colonTube.ts          the inside of the colon around its centerline: keeps the camera inside, colon part names
    namesSetting.ts       the shared, remembered Names on/off setting
    mucosa.ts             the wet lining material (folds, veins, fine surface)
    subdivide.ts          makes the wall finer and rounder for the Inside view
    labels.ts             segment labels on the 3D view
    lesionMarkers.ts      the rings, leader lines and labels of the lesions on the 3D view
    lesions.ts            lesion codes (P1, T1), removed lesions, label text, Paris types
    colonDistance.ts      cm from the anal verge along the colon (approximate)
    pinPositions.ts       where each finding sits on the colon (same on every page)
    linkViews.ts          links the two 3D views on Before/after
    compare.ts            matches findings of two dates and works out the size change
    findings.ts, dates.ts finding sizes and the AI findings of a picture; date formatting
  styles.css, styles/     page styles (polyps blue, tumors red)
```

## Using real pictures

1. Put the pictures in `public/samples/`, and list them for each visit in `src/data/demoPatient.ts` (PT-1001) (file name, name shown to the doctor, `colonoscopy` or `ct`, and for colonoscopy pictures the segment).
2. Add their results to `public/samples/results.json`, under the file name. All picture numbers are **pixels of the original image**, from the top-left corner:
   - polyp: `"box": { "x": left, "y": top, "w": width, "h": height }` and `"size": { "value": 6, "unit": "mm" }`
   - tumor: `"outline": [[x, y], [x, y], ...]`, `"size": { "value": 3.4, "unit": "cm" }` and `"segment"` (one of `cecum`, `appendix`, `ascending`, `hepatic`, `transverse`, `splenic`, `descending`, `sigmoid`, `rectum`)
3. Use **Reset demo data** on the patient list so the visits are built again.

## Replacing the demo detector with a real model

All AI calls go through one function in `src/detector.ts`:

```ts
detect(image: { name: string; url: string }, type: 'colonoscopy' | 'ct'): Promise<DetectionResult | null>
```

Rewrite its body so it sends the picture (load it from `image.url`) to your model and returns the same shape:

```ts
{
  polyps: [{ box: { x, y, w, h }, size: { value, unit: 'mm' } }],
  tumor: { outline: [[x, y], ...], size: { value, unit: 'cm' }, segment: 'sigmoid' } // or null
}
```

Return `null` if the model gives no result. Then set `DEMO_MODE = false` in the same file to hide the "Demo mode" tag. No other file needs to change.

## Not included

Treatment or medicine suggestions, login, insurance features, and privacy and consent features (to be defined before any real patient data is used).

## References

1. Human Reference Atlas (HRA). *Large Intestine, Female* (3D reference organ, file `hra-reference-organ-large-intestine-female-v1.2.glb`). NIH 3D, entry 3DPX-020971. License: CC-BY 4.0. https://3d.nih.gov/entries/3DPX-020971 (accessed 19 Nov 2026). Note: this model was not based on direct imaging data.
2. HRA 3D Reference Object Library. https://humanatlas.io/3d-reference-library

3D colon model shown in the app: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
