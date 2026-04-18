import { useState, useEffect, useRef } from 'react'
import styles from './Modal.module.css'
import reportStyles from './VisitReports.module.css'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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
  const [pendingReports, setPendingReports] = useState([])
  const [existingReports, setExistingReports] = useState([])
  const [reportLabel, setReportLabel] = useState('')

  const [medicines, setMedicines] = useState([])
  const [searchMed, setSearchMed] = useState('')
  const [showMeds, setShowMeds] = useState(false)
  const medRef = useRef(null)

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getAllMedicines) {
      window.electronAPI.getAllMedicines().then(setMedicines).catch(console.error)
    }
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (medRef.current && !medRef.current.contains(e.target)) {
        setShowMeds(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(searchMed.toLowerCase()))

  const appendMedicine = (med) => {
    const line = med.default_dosage ? `${med.name} - ${med.default_dosage}` : med.name
    setForm(f => ({
      ...f,
      prescription: f.prescription ? f.prescription + '\n' + line : line
    }))
    setSearchMed('')
    setShowMeds(false)
  }

  useEffect(() => {
    if (visit?.id) {
      window.electronAPI.getReportsByVisit(visit.id).then(setExistingReports).catch(() => {})
    }
  }, [visit])

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

  const pickReport = async () => {
    const filePath = await window.electronAPI.selectFile({
      filters: [{ name: 'Images & Documents', extensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'] }],
    })
    if (!filePath) return
    const fileName = filePath.split(/[\\/]/).pop()
    setPendingReports((prev) => [...prev, { tempId: Date.now(), sourcePath: filePath, fileName, label: reportLabel.trim() || null }])
    setReportLabel('')
  }

  const removeExistingReport = async (id) => {
    await window.electronAPI.deleteVisitReport(id)
    setExistingReports((prev) => prev.filter((r) => r.id !== id))
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
      let savedVisit
      if (visit) {
        savedVisit = await window.electronAPI.updateVisit(visit.id, data)
      } else {
        savedVisit = await window.electronAPI.createVisit(data)
      }
      const visitId = savedVisit?.id ?? visit?.id
      if (visitId && pendingReports.length > 0) {
        await Promise.all(pendingReports.map((r) =>
          window.electronAPI.createVisitReport({ visitId, sourcePath: r.sourcePath, label: r.label })
        ))
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

            <div style={{ position: 'relative', marginBottom: 8 }} ref={medRef}>
              <input 
                className="form-control" 
                placeholder="Search & Add Saved Medicine..." 
                value={searchMed}
                onChange={e => {
                  setSearchMed(e.target.value)
                  setShowMeds(true)
                }}
                onFocus={() => setShowMeds(true)}
                style={{ background: 'var(--icon-bg)', borderStyle: 'dashed' }}
              />
              {showMeds && filteredMeds.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', maxHeight: 200, overflowY: 'auto',
                  boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(16px)'
                }}>
                  {filteredMeds.map(med => (
                    <div 
                      key={med.id} 
                      onClick={() => appendMedicine(med)}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--icon-hover-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{med.name}</div>
                      {med.default_dosage && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{med.default_dosage}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

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
            <label>Reports / Attachments</label>
            <div className={reportStyles.attachRow}>
              <input
                type="text"
                className="form-control"
                placeholder="Label (optional)"
                value={reportLabel}
                onChange={(e) => setReportLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), pickReport())}
              />
              <button type="button" className="btn btn-secondary" onClick={pickReport}>Attach File</button>
            </div>
            {(existingReports.length > 0 || pendingReports.length > 0) && (
              <ul className={reportStyles.fileList}>
                {existingReports.map((r) => (
                  <li key={r.id} className={reportStyles.fileItem}>
                    <span className={reportStyles.fileIcon}>{r.file_type === 'image' ? '🖼' : '📄'}</span>
                    <span className={reportStyles.fileName} title={r.file_name}>{r.label || r.file_name}</span>
                    <button
                      type="button"
                      className={reportStyles.removeBtn}
                      onClick={() => removeExistingReport(r.id)}
                      title="Remove"
                    >×</button>
                  </li>
                ))}
                {pendingReports.map((r) => (
                  <li key={r.tempId} className={`${reportStyles.fileItem} ${reportStyles.pending}`}>
                    <span className={reportStyles.fileIcon}>📎</span>
                    <span className={reportStyles.fileName} title={r.fileName}>{r.label || r.fileName}</span>
                    <span className={reportStyles.pendingBadge}>unsaved</span>
                    <button
                      type="button"
                      className={reportStyles.removeBtn}
                      onClick={() => setPendingReports((prev) => prev.filter((p) => p.tempId !== r.tempId))}
                      title="Remove"
                    >×</button>
                  </li>
                ))}
              </ul>
            )}
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
