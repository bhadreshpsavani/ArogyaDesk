import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PatientCard from '../components/PatientCard'
import EditDoctorModal from '../components/EditDoctorModal'
import LocalImage from '../components/LocalImage'
import styles from './Home.module.css'

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [showEditDoctor, setShowEditDoctor] = useState(false)

  const search = useCallback(async (q) => {
    setLoading(true)
    try {
      const results = await window.electronAPI.searchPatients(q)
      setPatients(results)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    window.electronAPI.getDoctorProfile().then(setDoctor)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250)
    return () => clearTimeout(timer)
  }, [query, search])

  const doctorInitials = doctor?.name
    ?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>Clinic</span>
          <div>
            <h1 className={styles.brandName}>ArogyaDesk</h1>
            {doctor?.clinic_name && (
              <span className={styles.clinicName}>{doctor.clinic_name}</span>
            )}
          </div>
        </div>

        {doctor && (
          <button className={styles.doctorBtn} onClick={() => setShowEditDoctor(true)}>
            <div className={styles.doctorAvatar}>
              {doctor.photo_path ? (
                <LocalImage filePath={doctor.photo_path} alt={doctor.name} className={styles.doctorPhoto} />
              ) : (
                <span className={styles.doctorInitials}>{doctorInitials}</span>
              )}
            </div>
            <div className={styles.doctorInfo}>
              <span className={styles.doctorName}>{doctor.name}</span>
              {doctor.specialization && (
                <span className={styles.doctorSpec}>{doctor.specialization}</span>
              )}
            </div>
            <span className={styles.editIcon}>Edit</span>
          </button>
        )}
      </header>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>Search</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by name or phone number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button className={styles.clearBtn} onClick={() => setQuery('')} aria-label="Clear search">x</button>
            )}
          </div>
          <button
            className={`btn btn-primary btn-lg ${styles.newBtn}`}
            onClick={() => navigate('/patient/new')}
          >
            + New Patient
          </button>
        </div>

        <div className={styles.resultsHeader}>
          <span className={styles.resultsCount}>
            {loading ? 'Searching...' : `${patients.length} patient${patients.length !== 1 ? 's' : ''}${query ? ` for "${query}"` : ''}`}
          </span>
        </div>

        {!loading && patients.length === 0 ? (
          <div className="empty-state">
            <div className="icon">Patient</div>
            <p>{query ? `No patients found for "${query}"` : 'No patients yet'}</p>
            <small>{query ? 'Try a different name or phone number' : 'Add your first patient to get started'}</small>
            {!query && (
              <button className="btn btn-primary" onClick={() => navigate('/patient/new')}>
                + Add First Patient
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {patients.map((p) => (
              <PatientCard
                key={p.id}
                patient={p}
                onClick={() => navigate(`/patient/${p.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {showEditDoctor && (
        <EditDoctorModal
          doctor={doctor}
          onSave={(updated) => { setDoctor(updated); setShowEditDoctor(false) }}
          onClose={() => setShowEditDoctor(false)}
        />
      )}
    </div>
  )
}
