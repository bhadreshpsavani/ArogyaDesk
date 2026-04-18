import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './FormPage.module.css'
import LocalImage from '../components/LocalImage'

const GENDERS = ['Male', 'Female', 'Other']

export default function NewPatient() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', age: '', gender: '', phone: '', address: '', photo_path: '', notes: '',
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
    if (!form.name.trim()) {
      setError('Patient name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const patient = await window.electronAPI.createPatient({
        name: form.name.trim(),
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        photo_path: form.photo_path || null,
        notes: form.notes.trim() || null,
      })
      navigate(`/patient/${patient.id}`)
    } catch {
      setError('Failed to save patient. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <h2 className={styles.title}>New Patient</h2>
      </header>

      <div className={styles.body}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.photoSection}>
            <div className={styles.photoPreview} onClick={pickPhoto}>
              {form.photo_path ? (
                <LocalImage filePath={form.photo_path} alt="Patient" className={styles.photo} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <span>Photo</span>
                  <small>Add Photo</small>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input className="form-control" value={form.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" autoFocus />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input className="form-control" type="number" min="0" max="150" value={form.age} onChange={set('age')} placeholder="Years" />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select className="form-control" value={form.gender} onChange={set('gender')}>
                <option value="">Select...</option>
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input className="form-control" value={form.phone} onChange={set('phone')} placeholder="e.g. 9876543210" />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea className="form-control" rows={2} value={form.address} onChange={set('address')} placeholder="Street, City..." />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={set('notes')} placeholder="Allergies, chronic conditions, etc." />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? 'Saving...' : 'Save Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
