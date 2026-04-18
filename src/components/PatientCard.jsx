import styles from './PatientCard.module.css'
import LocalImage from './LocalImage'

export default function PatientCard({ patient, onClick }) {
  const initials = patient.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()

  const lastVisit = patient.last_visit
    ? new Date(patient.last_visit + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.avatar}>
        {patient.photo_path ? (
          <LocalImage filePath={patient.photo_path} alt={patient.name} className={styles.photo} />
        ) : (
          <span className={styles.initials}>{initials}</span>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{patient.name}</div>
        <div className={styles.meta}>
          {patient.age && <span>{patient.age}y</span>}
          {patient.age && patient.gender && <span className={styles.dot}>-</span>}
          {patient.gender && <span>{patient.gender}</span>}
          {(patient.age || patient.gender) && patient.phone && <span className={styles.dot}>-</span>}
          {patient.phone && <span>{patient.phone}</span>}
        </div>
        <div className={styles.footer}>
          {lastVisit ? (
            <span className={styles.lastVisit}>Last visit: {lastVisit}</span>
          ) : (
            <span className={styles.noVisit}>No visits yet</span>
          )}
          <span className="badge badge-blue">{patient.visit_count} visit{patient.visit_count !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
