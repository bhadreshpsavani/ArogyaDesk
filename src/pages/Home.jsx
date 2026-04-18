import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PatientCard from '../components/PatientCard'
import EditDoctorModal from '../components/EditDoctorModal'
import LocalImage from '../components/LocalImage'
import { useTheme } from '../ThemeProvider'
import styles from './Home.module.css'

export default function Home() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ query: '', gender: '', visitDate: '', age: '' })
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [showEditDoctor, setShowEditDoctor] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'system') setTheme('light')
    else if (theme === 'light') setTheme('dark')
    else setTheme('system')
  }

  const themeIcon = theme === 'system' ? '💻' : theme === 'light' ? '🌞' : '🌙'

  const search = useCallback(async (f, isCurrent) => {
    setLoading(true)
    try {
      const results = await window.electronAPI.searchPatients(f)
      if (isCurrent()) setPatients(results)
    } finally {
      if (isCurrent()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    window.electronAPI.getDoctorProfile().then(setDoctor)
  }, [])

  useEffect(() => {
    let active = true
    const isCurrent = () => active
    const timer = setTimeout(() => search(filters, isCurrent), 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [filters, search])

  const hasFilters = filters.query || filters.gender || filters.visitDate || filters.age

  const doctorInitials = doctor?.name
    ?.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase()

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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              className={styles.doctorBtn}
              onClick={() => navigate('/settings')}
              title="Settings"
              style={{ padding: '8px 12px', justifyContent: 'center' }}
            >
              <span style={{ fontSize: '16px' }}>⚙️</span>
            </button>
            <button
              className={styles.doctorBtn}
              onClick={toggleTheme}
              title={`Current Theme: ${theme}`}
              style={{ padding: '8px 12px', justifyContent: 'center' }}
            >
              <span style={{ fontSize: '16px' }}>{themeIcon}</span>
            </button>
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
          </div>
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
              value={filters.query}
              onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))}
              autoFocus
            />
            {filters.query && (
              <button className={styles.clearBtn} onClick={() => setFilters(f => ({ ...f, query: '' }))} aria-label="Clear search">x</button>
            )}
          </div>
          <button
            className={`btn btn-primary btn-lg ${styles.newBtn}`}
            onClick={() => navigate('/patient/new')}
          >
            + New Patient
          </button>
        </div>

        <div className={styles.filterBar}>
          <select 
            className="form-control" 
            value={filters.gender} 
            onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}
            style={{ width: '160px' }}
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <input 
            type="number" 
            className="form-control" 
            placeholder="Age"
            value={filters.age}
            onChange={e => setFilters(f => ({ ...f, age: e.target.value }))}
            style={{ width: '100px' }}
          />

          <input 
            type="date" 
            className="form-control" 
            value={filters.visitDate}
            onChange={e => setFilters(f => ({ ...f, visitDate: e.target.value }))}
            style={{ width: '180px' }}
          />

          {(filters.gender || filters.visitDate || filters.age) && (
            <button className="btn btn-secondary" onClick={() => setFilters(f => ({ ...f, gender: '', visitDate: '', age: '' }))}>
              Clear
            </button>
          )}
        </div>

        <div className={styles.resultsHeader}>
          <span className={styles.resultsCount}>
            {loading ? 'Searching...' : `${patients.length} patient${patients.length !== 1 ? 's' : ''}${filters.query ? ` for "${filters.query}"` : ''}`}
          </span>
        </div>

        {!loading && patients.length === 0 ? (
          <div className="empty-state">
            <div className="icon">Patient</div>
            <p>{filters.query ? `No patients found for "${filters.query}"` : 'No patients found'}</p>
            <small>{hasFilters ? 'Try clearing your filters' : 'Add your first patient to get started'}</small>
            {!hasFilters && (
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
