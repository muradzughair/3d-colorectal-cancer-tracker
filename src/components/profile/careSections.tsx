// Patient page sections 6 and 8 to 14: medications, labs, imaging and procedures, medical
// history, family history, lifestyle, symptoms and examination, care team. Read-only.
import { Fragment } from 'react'
import { formatDate, today } from '../../lib/dates'
import { bmi, findLab, formatLabValue, labFlag, rangeText } from '../../lib/patientInfo'
import type { LabGroup, Medication, MedicationGroup, PatientProfile } from '../../profileTypes'
import type { GoTo } from '../../PatientView'
import { KeyValueGrid, Missing, Section, Source, TrendChart } from './parts'

// ---------- 6. Medications ----------

const MEDICATION_GROUPS: MedicationGroup[] = [
  'Cancer treatment',
  'Blood thinners and antiplatelets',
  'Heart and blood pressure',
  'Diabetes',
  'Supportive',
  'Other',
]

function MedicationRow({ m, stopped }: { m: Medication; stopped?: boolean }) {
  const thinner = m.group === 'Blood thinners and antiplatelets' && !stopped
  return (
    <tr className={thinner ? 'is-thinner' : undefined}>
      <td>
        <strong>{m.name}</strong>
        {thinner && <span className="thinner-note">Check before any procedure</span>}
        {m.note && <span className="source-note">{m.note}</span>}
      </td>
      <td>{m.dose}</td>
      <td>{m.route}</td>
      <td>{m.frequency}</td>
      <td>{m.purpose}</td>
      <td>
        {formatDate(m.start)}
        <span className="source-note">{m.source}</span>
      </td>
      {stopped && (
        <td>
          {formatDate(m.stopped!.date)}
          <span className="source-note">{m.stopped!.reason}</span>
        </td>
      )}
    </tr>
  )
}

export function MedicationsSection({ profile }: { profile: PatientProfile }) {
  const current = profile.medications.filter((m) => !m.stopped)
  const stopped = profile.medications.filter((m) => m.stopped)
  const head = (withStop: boolean) => (
    <thead>
      <tr>
        <th>Medicine</th>
        <th>Dose</th>
        <th>Route</th>
        <th>Frequency</th>
        <th>For</th>
        <th>Started</th>
        {withStop && <th>Stopped</th>}
      </tr>
    </thead>
  )
  return (
    <Section id="medications" title="Medications">
      <table className="doc-table profile-table med-table">
        {head(false)}
        <tbody>
          {MEDICATION_GROUPS.map((group) => {
            const meds = current.filter((m) => m.group === group)
            return (
              <Fragment key={group}>
                <tr className="group-row">
                  <th colSpan={6}>{group}</th>
                </tr>
                {meds.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <Missing text="None" />
                    </td>
                  </tr>
                ) : (
                  meds.map((m) => <MedicationRow key={m.name} m={m} />)
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>

      <h3 className="sub-heading">Stopped</h3>
      {stopped.length === 0 ? (
        <Missing text="None" />
      ) : (
        <table className="doc-table profile-table med-table">
          {head(true)}
          <tbody>
            {stopped.map((m) => (
              <MedicationRow key={m.name + m.start} m={m} stopped />
            ))}
          </tbody>
        </table>
      )}
    </Section>
  )
}

// ---------- 8. Labs ----------

const LAB_GROUPS: LabGroup[] = [
  'Blood count',
  'Iron',
  'Kidney and electrolytes',
  'Liver',
  'Clotting',
  'Inflammation',
  'Tumor markers',
  'Diabetes',
  'Stool test',
]

export function LabsSection({ profile }: { profile: PatientProfile }) {
  // The three trend lines: CEA, hemoglobin and creatinine.
  const trends = ['cea', 'hb', 'creat'].map((id) => findLab(profile, id))
  return (
    <Section id="labs" title="Labs">
      <div className="trend-row">
        {trends.map(
          (test, i) =>
            test ? (
              <TrendChart
                key={test.id}
                title={test.name}
                unit={test.unit}
                low={test.low}
                high={test.high}
                points={test.results.map((r) => ({ date: r.date, value: r.value, label: formatLabValue(test, r.value), flag: labFlag(test, r.value) }))}
                emptyText={test.note ?? 'Not done'}
              />
            ) : (
              <TrendChart key={i} title={['CEA', 'Hemoglobin', 'Creatinine'][i]} unit="" points={[]} />
            ),
        )}
      </div>
      <p className="small-note muted">Shaded band: reference range. H = above, L = below the range. Source of all values: Lab.</p>

      <table className="doc-table profile-table lab-table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Unit</th>
            <th>Range</th>
            <th>Results, oldest to newest (date)</th>
          </tr>
        </thead>
        <tbody>
          {LAB_GROUPS.map((group) => {
            const tests = profile.labs.filter((t) => t.group === group)
            if (tests.length === 0) return null // groups that are not relevant for this patient
            return (
              <Fragment key={group}>
                <tr className="group-row">
                  <th colSpan={4}>{group}</th>
                </tr>
                {tests.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong>
                    </td>
                    <td className="muted">{t.unit || 'ratio'}</td>
                    <td className="muted">{rangeText(t)}</td>
                    <td>
                      {t.results.length === 0 ? (
                        <Missing text={t.note ?? 'Not done'} />
                      ) : (
                        <span className="lab-values">
                          {t.results.map((r) => {
                            const flag = labFlag(t, r.value)
                            return (
                              <span key={r.date} className={`lab-value${flag ? ' is-flagged' : ''}`}>
                                <strong>
                                  {formatLabValue(t, r.value)}
                                  {flag && <span className="lab-flag">{flag}</span>}
                                </strong>
                                <span className="lab-date">{formatDate(r.date)}</span>
                              </span>
                            )
                          })}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </Section>
  )
}

// ---------- 9. Imaging and procedures ----------

export function ImagingSection({ profile, goTo }: { profile: PatientProfile; goTo: GoTo }) {
  return (
    <Section id="imaging" title="Imaging and procedures">
      <table className="doc-table profile-table imaging-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type and region</th>
            <th>Key findings</th>
            <th>Impression</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {profile.imaging.map((item) => (
            <tr key={item.date + item.type}>
              <td>
                {formatDate(item.date)}
                <span className="source-note">{item.source}</span>
              </td>
              <td>
                <strong>{item.type}</strong>
                <span className="source-note">{item.region}</span>
              </td>
              <td>{item.findings}</td>
              <td>{item.impression}</td>
              <td className="row-link">
                {item.visitId && (
                  <button className="link-button" onClick={() => goTo('colon', { visitId: item.visitId })}>
                    Open visit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}

// ---------- 10. Medical history ----------

export function HistorySection({ profile }: { profile: PatientProfile }) {
  const h = profile.history
  return (
    <Section id="history" title="Medical history">
      <div className="two-columns">
        <div>
          <h3 className="sub-heading">Conditions</h3>
          {h.conditions.length === 0 ? (
            <Missing text="None known" />
          ) : (
            <ul className="plain-list">
              {h.conditions.map((c) => (
                <li key={c.name}>
                  <strong>{c.name}</strong> <span className="muted">since {c.since}</span>
                  {c.note && <span className="muted"> · {c.note}</span>}
                  <Source source={c.source} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="sub-heading">Past surgery and procedures</h3>
          {h.surgeries.length === 0 ? (
            <Missing text="None" />
          ) : (
            <ul className="plain-list">
              {h.surgeries.map((s) => (
                <li key={s.name + s.date}>
                  <strong>{s.name}</strong>
                  <Source date={s.date} source={s.source} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="sub-heading">Hospital stays</h3>
          {h.stays.length === 0 ? (
            <Missing text="None" />
          ) : (
            <ul className="plain-list">
              {h.stays.map((s) => (
                <li key={s.from}>
                  <strong>{s.reason}</strong> <span className="muted">· {s.place}</span>
                  <span className="source-note">
                    {formatDate(s.from)} to {formatDate(s.to)} · {s.source}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="sub-heading">Performance status</h3>
          <ul className="plain-list">
            <li>
              <strong>ECOG {h.ecog.value}</strong>
              <Source date={h.ecog.date} source={h.ecog.source} />
            </li>
            <li>
              <strong>{h.asa.value}</strong>
              <Source date={h.asa.date} source={h.asa.source} />
            </li>
          </ul>
        </div>
      </div>
    </Section>
  )
}

// ---------- 11. Family history ----------

export function FamilySection({ profile }: { profile: PatientProfile }) {
  return (
    <Section id="family" title="Family history">
      {profile.family.length === 0 ? (
        <p>
          <Missing text="None known" />
        </p>
      ) : (
        <table className="doc-table profile-table">
          <thead>
            <tr>
              <th>Relative</th>
              <th>Cancer or condition</th>
              <th>Age at diagnosis</th>
              <th>Recorded</th>
            </tr>
          </thead>
          <tbody>
            {profile.family.map((f) => (
              <tr key={f.relative + f.condition}>
                <td>
                  <strong>{f.relative}</strong>
                </td>
                <td>{f.condition}</td>
                <td>{f.ageAtDiagnosis ?? <Missing />}</td>
                <td>
                  <Source date={f.date} source={f.source} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="small-note">{profile.familyNote}</p>
    </Section>
  )
}

// ---------- 12. Lifestyle ----------

export function LifestyleSection({ profile }: { profile: PatientProfile }) {
  const l = profile.lifestyle
  const latest = l.weights[l.weights.length - 1]
  const index = bmi(profile)
  return (
    <Section id="lifestyle" title="Lifestyle">
      <div className="lifestyle-grid">
        <KeyValueGrid
          items={[
            {
              label: 'Smoking',
              value: `${l.smoking.status}${l.smoking.packYears !== null ? `, ${l.smoking.packYears} pack-years` : ''}. ${l.smoking.detail}`,
              source: <Source date={l.smoking.date} source={l.smoking.source} />,
            },
            { label: 'Alcohol', value: l.alcohol.text, source: <Source date={l.alcohol.date} source={l.alcohol.source} /> },
            { label: 'Physical activity', value: l.activity.text, source: <Source date={l.activity.date} source={l.activity.source} /> },
            { label: 'Diet', value: l.diet.text, source: <Source date={l.diet.date} source={l.diet.source} /> },
            { label: 'Height', value: `${l.heightCm.value} cm`, source: <Source date={l.heightCm.date} source={l.heightCm.source} /> },
            { label: 'Weight', value: latest ? `${latest.kg} kg` : '', source: latest && <Source date={latest.date} source={latest.source} /> },
            { label: 'BMI', value: index !== null ? `${index} kg/m2` : '', source: <span className="source-note">Calculated from height and the latest weight</span> },
          ]}
        />
        <TrendChart title="Weight" unit="kg" points={l.weights.map((w) => ({ date: w.date, value: w.kg }))} />
      </div>
    </Section>
  )
}

// ---------- 13. Symptoms and examination ----------

export function SymptomsSection({ profile }: { profile: PatientProfile }) {
  const v = profile.vitals
  return (
    <Section id="symptoms" title="Symptoms and examination">
      <h3 className="sub-heading">
        Current symptoms <Source date={profile.symptoms.date} source={profile.symptoms.source} />
      </h3>
      <table className="doc-table profile-table">
        <tbody>
          {profile.symptoms.items.map((s) => (
            <tr key={s.name}>
              <td className="label-cell">{s.name}</td>
              <td>{s.detail}</td>
              <td className="muted">{s.since ? `Since ${formatDate(s.since)}` : 'Not applicable'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="sub-heading">
        Latest vital signs <Source date={v.date} source={v.source} />
      </h3>
      <KeyValueGrid
        items={[
          { label: 'Blood pressure', value: `${v.bloodPressure} mmHg` },
          { label: 'Pulse', value: `${v.pulse} per minute` },
          { label: 'Temperature', value: `${v.temperature} °C` },
          { label: 'Oxygen saturation', value: `${v.oxygen} %` },
        ]}
      />

      <h3 className="sub-heading">
        Latest examination <Source date={profile.exam.date} source={profile.exam.source} />
      </h3>
      <p>{profile.exam.text}</p>
    </Section>
  )
}

// ---------- 14. Care team and appointments ----------

export function CareTeamSection({ profile }: { profile: PatientProfile }) {
  const upcoming = profile.appointments.filter((a) => a.date >= today())
  return (
    <Section id="care-team" title="Care team and appointments">
      <div className="two-columns">
        <div>
          <h3 className="sub-heading">Care team</h3>
          <ul className="plain-list team-list">
            {profile.careTeam.map((m) => (
              <li key={m.role}>
                <span className="muted">{m.role}</span>
                {m.name === 'Not involved' ? <Missing text="Not involved" /> : <strong>{m.name}</strong>}
                {m.name !== 'Not involved' && <span className="source-note">{m.clinic}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="sub-heading">Upcoming appointments</h3>
          {upcoming.length === 0 ? (
            <Missing text="None booked" />
          ) : (
            <ul className="plain-list">
              {upcoming.map((a) => (
                <li key={a.date + a.what}>
                  <strong>{formatDate(a.date)}</strong> · {a.what}
                  <span className="source-note">With {a.with}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  )
}
