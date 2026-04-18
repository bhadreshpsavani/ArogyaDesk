import { useState, useEffect } from 'react'
import styles from './Modal.module.css'

const today = () => new Date().toISOString().split('T')[0]

export default function VisitForm({ patientId, visit, onSave, onClose }) {
  const [form, setForm] = useState({
    visit_date: today(),
    symptoms: '',
    diagnosis: '',
    prescription: '',
    prescription_path: '',
    charges: '',
    discount: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (visit) {
      setForm({
        visit_date: visit.visit_date || today(),
        symptoms: visit.symptoms || '',
        diagnosis: visit.diagnosis || '',
        prescription: visit.prescription || '',
        prescription_path: visit.prescription_path || '',
        charges: visit.charges != null ? String(visit.charges) : '',
        discount: visit.discount != null ? String(visit.discount) : '',
        notes: visit.notes || '',
      })
    }
  }, [visit])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const charges = parseFloat(form.charges) || 0
  const discount = parseFloat(form.discount) || 0
  const finalAmount = charges - (charges * discount) / 100

  const pickFile = async () => {
    const path = await window.electronAPI.selectFile({
      filters: [
        { name: 'Documents & Images', extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'] },
      ],
    })
    if (path) setForm((f) => ({ ...f, prescription_path: path }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.visit_date) {
      setError('Visit date is required')
      return
    }

    setSaving(true)
    setError('')

    const data = {
      patient_id: patientId,
      visit_date: form.visit_date,
      symptoms: form.symptoms.trim() || null,
      diagnosis: form.diagnosis.trim() || null,
      prescription: form.prescription.trim() || null,
      prescription_path: form.prescription_path || null,
      charges,
      discount,
      final_amount: finalAmount,
      notes: form.notes.trim() || null,
    }

    try {
      if (visit) {
        await window.electronAPI.updateVisit(visit.id, data)
      } else {
        await window.electronAPI.createVisit(data)
      }
      onSave()
    } catch {
      setError('Failed to save visit. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{visit ? 'Edit Visit' : 'Add Visit'}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">x</button>
        </div>

        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Visit Date *</label>
            <input className="form-control" type="date" value={form.visit_date} onChange={set('visit_date')} />
          </div>

          <div className="form-group">
            <label>Symptoms</label>
            <textarea className="form-control" rows={2} value={form.symptoms} onChange={set('symptoms')} placeholder="Chief complaints..." />
          </div>

          <div className="form-group">
            <label>Diagnosis</label>
            <input className="form-control" value={form.diagnosis} onChange={set('diagnosis')} placeholder="e.g. Viral fever, Hypertension..." />
          </div>

          <div className="form-group">
            <label>Prescription</label>
            <textarea className="form-control" rows={4} value={form.prescription} onChange={set('prescription')} placeholder="Tab. Paracetamol 500mg - 1 tab TDS x 5 days..." style={{ fontFamily: 'monospace', fontSize: '13px' }} />
          </div>

          <div className="form-group">
            <label>Prescription File (optional)</label>
            <div className={styles.fileRow}>
              <input className="form-control" readOnly value={form.prescription_path || ''} placeholder="No file selected" />
              <button type="button" className="btn btn-secondary" onClick={pickFile}>Browse</button>
              {form.prescription_path && (
                <button type="button" className="btn btn-secondary" onClick={() => setForm((f) => ({ ...f, prescription_path: '' }))} aria-label="Clear file">x</button>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Charges (Rs)</label>
              <input className="form-control" type="number" min="0" step="0.01" value={form.charges} onChange={set('charges')} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Discount (%)</label>
              <input className="form-control" type="number" min="0" max="100" step="0.01" value={form.discount} onChange={set('discount')} placeholder="0" />
            </div>
          </div>

          <div className={styles.finalAmount}>
            <span>Final Amount</span>
            <strong>Rs {finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={set('notes')} placeholder="Follow-up in 7 days, blood test required..." />
          </div>

          {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}

          <div className={styles.modalFooter}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : visit ? 'Update Visit' : 'Save Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
