import { useState } from 'react'
import styles from './Modal.module.css'
import LocalImage from './LocalImage'

const GENDERS = ['Male', 'Female', 'Other']

export default function EditPatientModal({ patient, onSave, onClose }) {
  const [form, setForm] = useState({
    name: patient.name || '',
    age: patient.age != null ? String(patient.age) : '',
    gender: patient.gender || '',
    phone: patient.phone || '',
    address: patient.address || '',
    photo_path: patient.photo_path || '',
    notes: patient.notes || '',
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
      const updated = await window.electronAPI.updatePatient(patient.id, {
        name: form.name.trim(),
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        photo_path: form.photo_path || null,
        notes: form.notes.trim() || null,
      })
      onSave(updated)
    } catch {
      setError('Failed to update patient.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Edit Patient</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">x</button>
        </div>

        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              onClick={pickPhoto}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: '2px dashed var(--border)',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              {form.photo_path ? (
                <LocalImage filePath={form.photo_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : 'Photo'}
            </div>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input className="form-control" value={form.name} onChange={set('name')} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input className="form-control" type="number" min="0" max="150" value={form.age} onChange={set('age')} />
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
            <label>Phone</label>
            <input className="form-control" value={form.phone} onChange={set('phone')} />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea className="form-control" rows={2} value={form.address} onChange={set('address')} />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={set('notes')} />
          </div>

          {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}

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
