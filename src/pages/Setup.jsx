import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LocalImage from '../components/LocalImage'
import styles from './Setup.module.css'

const SPECIALIZATIONS = [
  'General Physician', 'Pediatrician', 'Gynecologist', 'Dermatologist',
  'Orthopedic', 'ENT', 'Ophthalmologist', 'Cardiologist', 'Neurologist',
  'Psychiatrist', 'Dentist', 'Homeopath', 'Ayurvedic', 'Other',
]

export default function Setup({ onComplete }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    clinic_name: '',
    specialization: '',
    phone: '',
    address: '',
    photo_path: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const pickPhoto = async () => {
    const path = await window.electronAPI.selectFile({
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    })
    if (path) setForm((f) => ({ ...f, photo_path: path }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Your name is required'); return }
    setSaving(true)
    setError('')
    try {
      await window.electronAPI.saveDoctorProfile({
        name: form.name.trim(),
        clinic_name: form.clinic_name.trim() || null,
        specialization: form.specialization || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        photo_path: form.photo_path || null,
      })
      onComplete()
      navigate('/', { replace: true })
    } catch {
      setError('Failed to save profile. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.logo}>🏥</span>
          <h1 className={styles.appName}>ArogyaDesk</h1>
          <p className={styles.subtitle}>Let's set up your profile before we begin</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.photoSection}>
            <div className={styles.photoWrap} onClick={pickPhoto}>
              {form.photo_path ? (
                <LocalImage filePath={form.photo_path} alt="Doctor" className={styles.photo} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <span>👨‍⚕️</span>
                  <small>Add Photo</small>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Your Name *</label>
            <input
              className="form-control"
              value={form.name}
              onChange={set('name')}
              placeholder="Dr. Rajesh Patel"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Clinic Name</label>
            <input
              className="form-control"
              value={form.clinic_name}
              onChange={set('clinic_name')}
              placeholder="Patel Clinic & Hospital"
            />
          </div>

          <div className="form-group">
            <label>Specialization</label>
            <select className="form-control" value={form.specialization} onChange={set('specialization')}>
              <option value="">Select…</option>
              {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              className="form-control"
              value={form.phone}
              onChange={set('phone')}
              placeholder="9876543210"
            />
          </div>

          <div className="form-group">
            <label>Clinic Address</label>
            <textarea
              className="form-control"
              rows={2}
              value={form.address}
              onChange={set('address')}
              placeholder="123, Main Street, Ahmedabad…"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={saving}>
            {saving ? 'Saving…' : 'Get Started →'}
          </button>
        </form>
      </div>
    </div>
  )
}
