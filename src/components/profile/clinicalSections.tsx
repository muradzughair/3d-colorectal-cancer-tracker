// Patient page sections 1 to 5 and 7: alerts, endoscopy findings, diagnosis and staging,
// pathology, biomarkers and genetics, allergies. Read-only.
import { getSegment } from '../../data/segments'
import { formatDate } from '../../lib/dates'
import { formatSize } from '../../lib/findings'
import { lesionName, type LesionCode } from '../../lib/lesions'
import { currentBloodThinners } from '../../lib/patientInfo'
import type { Allergy, CancerSpecimen, PatientProfile, PolypSpecimen, TestResult } from '../../profileTypes'
import type { GoTo } from '../../PatientView'
import type { Visit } from '../../types'
import { KeyValueGrid, Missing, Section, Source } from './parts'

// ---------- 1. Alerts ----------

export function AlertsSection({ profile }: { profile: PatientProfile }) {
  const thinners = currentBloodThinners(profile)
  return (
    <Section id="alerts" title="Alerts">
      <ul className="alert-list">
        {profile.allergies.length === 0 ? (
          <li className="alert-none">No known allergies</li>
        ) : (
          profile.allergies.map((a) => (
            <li key={a.substance} className="alert">
              <strong>Allergy: {a.substance}</strong> ({a.type.toLowerCase()}) · {a.reaction} · {a.severity}
              <Source date={a.date} source={a.source} />
            </li>
          ))
        )}
        {thinners.length === 0 ? (
          <li className="alert-none">No blood thinners or antiplatelets</li>
        ) : (
          thinners.map((m) => (
            <li key={m.name} className="alert">
              <strong>
                Blood thinner / antiplatelet: {m.name} {m.dose} {m.frequency.toLowerCase()}
              </strong>{' '}
              · {m.purpose} · Check before any procedure
              <Source date={m.start} source={m.source} />
            </li>
          ))
        )}
        {profile.precautions.length === 0 ? (
          <li className="alert-none">No special precautions</li>
        ) : (
          profile.precautions.map((p) => (
            <li key={p.text} className="alert">
              <strong>Precaution:</strong> {p.text}
              <Source date={p.date} source={p.source} />
            </li>
          ))
        )}
      </ul>
    </Section>
  )
}

// ---------- 2. Endoscopy findings ----------

export function FindingsSection({ profile, visits, codes, goTo }: { profile: PatientProfile; visits: Visit[]; codes: Record<string, LesionCode>; goTo: GoTo }) {
  const rows = visits.flatMap((visit) => visit.findings.map((f) => ({ visit, f, name: lesionName(f, codes) })))
  // The status is written in the data for each visit, kind and segment (never guessed).
  const statusOf = (visitId: string, f: Visit['findings'][number]) =>
    profile.findingStatus.find((s) => s.visitId === visitId && s.kind === f.kind && s.segment === f.segment)

  return (
    <Section id="findings" title="Endoscopy findings">
      {rows.length === 0 ? (
        <p>
          <Missing text="No findings recorded" />
        </p>
      ) : (
        <table className="doc-table profile-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Segment</th>
              <th>Size</th>
              <th>Visit</th>
              <th>Status</th>
              <th>Source</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ visit, f, name }) => {
              const status = statusOf(visit.id, f)
              return (
                <tr key={`${visit.id}-${f.id}`}>
                  <td>
                    <span className={`dot dot-${f.kind}`} />
                    {name}
                  </td>
                  <td>{getSegment(f.segment).name}</td>
                  <td>{formatSize(f.size)}</td>
                  <td>
                    {formatDate(visit.date)}
                    <span className="source-note">{visit.title}</span>
                  </td>
                  <td>
                    {status ? <span className={`finding-status finding-status-${status.status.toLowerCase()}`}>{status.status}</span> : <Missing text="Not recorded" />}
                    {status?.note && <span className="source-note">{status.note}</span>}
                  </td>
                  <td className="muted">{f.source === 'ai' ? 'Detected by AI (demo)' : 'Entered by the doctor'}</td>
                  <td className="row-link">
                    <button className="link-button" onClick={() => goTo('colon', { visitId: visit.id, findingId: f.id })}>
                      Show on 3D colon
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Section>
  )
}

// ---------- 3. Diagnosis and staging ----------

export function DiagnosisSection({ profile }: { profile: PatientProfile }) {
  const d = profile.diagnosis
  return (
    <Section id="diagnosis" title="Diagnosis and staging">
      {!d ? (
        <p className="plain-statement">No cancer diagnosed. Polyps only.</p>
      ) : (
        <KeyValueGrid
          items={[
            { label: 'Date of diagnosis', value: formatDate(d.date), source: <Source source={d.source} /> },
            {
              label: 'Primary site',
              value: d.distanceFromAnalVergeCm !== null ? `${d.site}, ${d.distanceFromAnalVergeCm} cm from the anal verge` : d.site,
            },
            { label: 'Sidedness', value: d.sidedness },
            { label: 'Histologic type', value: d.histology },
            { label: 'Grade', value: d.grade },
            {
              label: 'Clinical stage',
              value: (
                <>
                  <strong>{d.clinicalStage.tnm}</strong> · stage {d.clinicalStage.group}
                </>
              ),
              source: <Source date={d.clinicalStage.date} source={d.clinicalStage.source} />,
            },
            {
              label: 'Pathologic stage',
              value: d.pathologicStage ? (
                <>
                  <strong>{d.pathologicStage.tnm}</strong> · stage {d.pathologicStage.group}
                </>
              ) : (
                <Missing text={`Not available${d.pathologicStageNote ? ` (${d.pathologicStageNote.toLowerCase()})` : ''}`} />
              ),
              source: d.pathologicStage && <Source date={d.pathologicStage.date} source={d.pathologicStage.source} />,
            },
            {
              label: 'Tumor size',
              value: (
                <ul className="plain-list">
                  {d.tumorSize.map((t) => (
                    <li key={t.text}>
                      {t.text}
                      <Source date={t.date} source={t.source} />
                    </li>
                  ))}
                </ul>
              ),
            },
            { label: 'Presenting symptoms', value: d.symptoms, wide: true },
            { label: 'Synchronous lesions', value: d.synchronousLesions, wide: true },
          ]}
        />
      )}
    </Section>
  )
}

// ---------- 4. Pathology ----------

function CancerSpecimenView({ s }: { s: CancerSpecimen }) {
  return (
    <KeyValueGrid
      items={[
        { label: 'Procedure', value: s.procedure, wide: true },
        { label: 'Site', value: s.site },
        { label: 'Histologic type', value: s.histology },
        { label: 'Grade', value: s.grade },
        { label: 'Depth of invasion', value: s.depth },
        { label: 'Lymphovascular invasion', value: s.lymphovascular },
        { label: 'Perineural invasion', value: s.perineural },
        { label: 'Tumor budding', value: s.budding },
        { label: 'Extramural venous invasion', value: s.emvi },
        { label: 'Proximal margin', value: s.margins.proximal },
        { label: 'Distal margin', value: s.margins.distal },
        { label: 'Radial margin', value: s.margins.radial },
        { label: 'Lymph nodes', value: s.nodes },
        { label: 'Tumor deposits', value: s.deposits },
        { label: 'Treatment effect', value: s.regression },
        { label: 'pTNM', value: <strong>{s.ptnm}</strong> },
        { label: 'Comment', value: s.comment, wide: true },
      ]}
    />
  )
}

function PolypSpecimenView({ s }: { s: PolypSpecimen }) {
  return (
    <KeyValueGrid
      items={[
        { label: 'Procedure', value: s.procedure, wide: true },
        { label: 'Site', value: s.site },
        { label: 'Size', value: s.size },
        { label: 'Histology', value: s.histology },
        { label: 'Dysplasia', value: s.dysplasia },
        { label: 'Completeness of removal', value: s.completeness },
        { label: 'Comment', value: s.comment, wide: true },
      ]}
    />
  )
}

export function PathologySection({ profile }: { profile: PatientProfile }) {
  return (
    <Section id="pathology" title="Pathology">
      {profile.pathology.length === 0 && (
        <p>
          <Missing text="Not done" />
        </p>
      )}
      {profile.pathology.map((s) => (
        <div key={s.label} className="specimen">
          <h3>
            {s.label}: {s.kind === 'polyp' ? 'polyp' : s.procedure.toLowerCase().includes('biopsy') ? 'biopsy' : 'resection'}, {s.site.toLowerCase()}
            <Source date={s.date} source={s.source} />
          </h3>
          {s.kind === 'cancer' ? <CancerSpecimenView s={s} /> : <PolypSpecimenView s={s} />}
        </div>
      ))}
    </Section>
  )
}

// ---------- 5. Biomarkers and genetics ----------

// The text for one test result, never blank.
function TestValue({ test }: { test: TestResult }) {
  const note = test.note ? <span className="source-note">{test.note}</span> : null
  switch (test.state) {
    case 'done':
      return (
        <>
          <strong>{test.result}</strong>
          <Source date={test.date} source={test.source} />
          {note}
        </>
      )
    case 'pending':
      return (
        <>
          <span className="pending">Pending</span>
          {note}
        </>
      )
    case 'not-required':
      return (
        <>
          <Missing text="Not required at this stage" />
          {note}
        </>
      )
    default:
      return (
        <>
          <Missing text="Not done" />
          {note}
        </>
      )
  }
}

export function BiomarkersSection({ profile }: { profile: PatientProfile }) {
  const b = profile.biomarkers
  const stains = b.mmr.stains
  return (
    <Section id="biomarkers" title="Biomarkers and genetics">
      <KeyValueGrid
        items={[
          {
            label: 'MMR proteins (MLH1, MSH2, MSH6, PMS2)',
            value: stains ? (
              <>
                MLH1 {stains.mlh1.toLowerCase()}, MSH2 {stains.msh2.toLowerCase()}, MSH6 {stains.msh6.toLowerCase()}, PMS2 {stains.pms2.toLowerCase()}
              </>
            ) : (
              <TestValue test={b.mmr} />
            ),
            wide: true,
          },
          { label: 'MMR result', value: stains ? <TestValue test={b.mmr} /> : <TestValue test={{ state: b.mmr.state }} /> },
          { label: 'MSI status', value: <TestValue test={b.msi} /> },
          { label: 'KRAS', value: <TestValue test={b.kras} /> },
          { label: 'NRAS', value: <TestValue test={b.nras} /> },
          { label: 'BRAF V600E', value: <TestValue test={b.braf} /> },
          { label: 'HER2', value: <TestValue test={b.her2} /> },
          { label: 'NTRK', value: <TestValue test={b.ntrk} /> },
          { label: 'DPYD genotype', value: <TestValue test={b.dpyd} /> },
          { label: 'Germline testing', value: <TestValue test={b.germline} /> },
          { label: 'Family-risk note', value: b.familyRisk, wide: true },
        ]}
      />
    </Section>
  )
}

// ---------- 7. Allergies ----------

export function AllergiesSection({ allergies }: { allergies: Allergy[] }) {
  return (
    <Section id="allergies" title="Allergies">
      {allergies.length === 0 ? (
        <p className="plain-statement">No known allergies.</p>
      ) : (
        <table className="doc-table profile-table">
          <thead>
            <tr>
              <th>Substance</th>
              <th>Type</th>
              <th>Reaction</th>
              <th>Severity</th>
              <th>Recorded</th>
            </tr>
          </thead>
          <tbody>
            {allergies.map((a) => (
              <tr key={a.substance}>
                <td className="alert-text">
                  <strong>{a.substance}</strong>
                </td>
                <td>{a.type}</td>
                <td>{a.reaction}</td>
                <td>{a.severity}</td>
                <td>
                  <Source date={a.date} source={a.source} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  )
}
