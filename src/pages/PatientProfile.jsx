import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import VisitHistory from '../components/VisitHistory'
import VisitForm from '../components/VisitForm'
import EditPatientModal from '../components/EditPatientModal'
import PatientRecords from '../components/PatientRecords'
import styles from './PatientProfile.module.css'
import LocalImage from '../components/LocalImage'

export default function PatientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [visits, setVisits] = useState([])
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [editingVisit, setEditingVisit] = useState(null)
  const [showEditPatient, setShowEditPatient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [doctor, setDoctor] = useState(null)

  const load = useCallback(async (isCurrent) => {
    const patientId = parseInt(id, 10)
    const [p, v, d] = await Promise.all([
      window.electronAPI.getPatient(patientId),
      window.electronAPI.getVisitsByPatient(patientId),
      window.electronAPI.getDoctorProfile(),
    ])
    if (isCurrent()) {
      setPatient(p)
      setVisits(v)
      setDoctor(d)
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    let active = true
    load(() => active)
    return () => { active = false }
  }, [load])

  const handleDeletePatient = async () => {
    if (!window.confirm(`Delete ${patient.name} and all their visits? This cannot be undone.`)) return
    await window.electronAPI.deletePatient(patient.id)
    navigate('/')
  }

  const handleVisitSaved = async () => {
    const patientId = parseInt(id, 10)
    setShowVisitForm(false)
    setEditingVisit(null)
    const v = await window.electronAPI.getVisitsByPatient(patientId)
    setVisits(v)
  }

  const handlePatientUpdated = (updated) => {
    setPatient(updated)
    setShowEditPatient(false)
  }

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (!patient) return <div className={styles.loading}>Patient not found.</div>

  const initials = patient.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase()
  const totalRevenue = visits.reduce((sum, v) => sum + (v.final_amount || 0), 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back</button>
        <div className={styles.headerActions}>
          <button className="btn btn-secondary" onClick={() => setShowEditPatient(true)}>Edit Patient</button>
          <button className="btn btn-danger" onClick={handleDeletePatient}>Delete</button>
          <button className="btn btn-primary btn-lg" onClick={() => setShowVisitForm(true)}>+ Add Visit</button>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            {patient.photo_path ? (
              <LocalImage filePath={patient.photo_path} alt={patient.name} className={styles.photo} />
            ) : (
              <span className={styles.initials}>{initials}</span>
            )}
          </div>
          <div className={styles.profileInfo}>
            <h2 className={styles.patientName}>{patient.name}</h2>
            <div className={styles.patientMeta}>
              {patient.age && <span>{patient.age} years</span>}
              {patient.gender && <span>{patient.gender}</span>}
              {patient.phone && <span>Phone: {patient.phone}</span>}
            </div>
            {patient.address && <div className={styles.address}>Address: {patient.address}</div>}
            {patient.notes && <div className={styles.patientNotes}>{patient.notes}</div>}
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{visits.length}</span>
              <span className={styles.statLabel}>Visits</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>Rs {totalRevenue.toLocaleString('en-IN')}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Patient Records</h3>
          <PatientRecords patientId={parseInt(id, 10)} />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Visit History</h3>
          <VisitHistory
            visits={visits}
            patient={patient}
            doctor={doctor}
            onEdit={(v) => { setEditingVisit(v); setShowVisitForm(true) }}
            onDelete={async (visitId) => {
              if (!window.confirm('Delete this visit?')) return
              await window.electronAPI.deleteVisit(visitId)
              setVisits((vs) => vs.filter((v) => v.id !== visitId))
            }}
          />
        </div>
      </div>

      {showVisitForm && (
        <VisitForm
          patientId={parseInt(id, 10)}
          visit={editingVisit}
          onSave={handleVisitSaved}
          onClose={() => { setShowVisitForm(false); setEditingVisit(null) }}
        />
      )}

      {showEditPatient && (
        <EditPatientModal
          patient={patient}
          onSave={handlePatientUpdated}
          onClose={() => setShowEditPatient(false)}
        />
      )}
    </div>
  )
}
