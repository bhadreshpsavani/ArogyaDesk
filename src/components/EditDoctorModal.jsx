import { useState } from 'react'
import LocalImage from './LocalImage'
import styles from './Modal.module.css'

const SPECIALIZATIONS = [
  'General Physician', 'Pediatrician', 'Gynecologist', 'Dermatologist',
  'Orthopedic', 'ENT', 'Ophthalmologist', 'Cardiologist', 'Neurologist',
  'Psychiatrist', 'Dentist', 'Homeopath', 'Ayurvedic', 'Other',
]

export default function EditDoctorModal({ doctor, onSave, onClose }) {
  const [form, setForm] = useState({
    name: doctor.name || '',
    clinic_name: doctor.clinic_name || '',
    specialization: doctor.specialization || '',
    phone: doctor.phone || '',
    address: doctor.address || '',
    photo_path: doctor.photo_path || '',
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
      setError('Name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const updated = await window.electronAPI.saveDoctorProfile({
        name: form.name.trim(),
        clinic_name: form.clinic_name.trim() || null,
        specialization: form.specialization || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        photo_path: form.photo_path || null,
      })
      onSave(updated)
    } catch {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Edit Profile</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">x</button>
        </div>

        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              onClick={pickPhoto}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '2px dashed var(--border)',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg)',
                transition: 'border-color 0.15s',
              }}
            >
              {form.photo_path ? (
                <LocalImage filePath={form.photo_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 16 }}>Doctor</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Your Name *</label>
            <input className="form-control" value={form.name} onChange={set('name')} placeholder="Dr. Rajesh Patel" />
          </div>

          <div className="form-group">
            <label>Clinic Name</label>
            <input className="form-control" value={form.clinic_name} onChange={set('clinic_name')} placeholder="Patel Clinic & Hospital" />
          </div>

          <div className="form-group">
            <label>Specialization</label>
            <select className="form-control" value={form.specialization} onChange={set('specialization')}>
              <option value="">Select...</option>
              {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input className="form-control" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
          </div>

          <div className="form-group">
            <label>Clinic Address</label>
            <textarea className="form-control" rows={2} value={form.address} onChange={set('address')} placeholder="123, Main Street..." />
          </div>

          {error && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div className={styles.modalFooter}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
