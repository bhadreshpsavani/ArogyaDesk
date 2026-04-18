import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Settings.module.css'

export default function Settings() {
  const navigate = useNavigate()
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [form, setForm] = useState({ id: null, name: '', default_dosage: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const data = await window.electronAPI.getAllMedicines()
    setMedicines(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    try {
      if (form.id) {
        await window.electronAPI.updateMedicine(form.id, {
          name: form.name.trim(),
          default_dosage: form.default_dosage.trim()
        })
      } else {
        await window.electronAPI.createMedicine({
          name: form.name.trim(),
          default_dosage: form.default_dosage.trim()
        })
      }
      setForm({ id: null, name: '', default_dosage: '' })
      await load()
    } catch (err) {
      alert('Error saving medicine: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (med) => {
    setForm({ id: med.id, name: med.name, default_dosage: med.default_dosage || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this medicine?')) return
    await window.electronAPI.deleteMedicine(id)
    load()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerActions}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2 style={{ marginLeft: 16 }}>Settings</h2>
        </div>
      </header>

      <main className={styles.body}>
        <div className={styles.card}>
          <h3 className={styles.title}>Saved Medicines</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Manage the medicines available in the prescription quick-add dropdown.
          </p>

          <form onSubmit={handleSave} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <label>Medicine Name</label>
              <input className="form-control" value={form.name} onChange={setField('name')} placeholder="e.g. Paracetamol 500mg" required />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <label>Default Dosage / Instructions</label>
              <input className="form-control" value={form.default_dosage} onChange={setField('default_dosage')} placeholder="e.g. 1 tab TDS x 5 days" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving || !form.name.trim()}>
                {form.id ? 'Update' : 'Add'}
              </button>
              {form.id && (
                <button type="button" className="btn btn-secondary" onClick={() => setForm({ id: null, name: '', default_dosage: '' })}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {loading ? (
            <div>Loading...</div>
          ) : medicines.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>No medicines saved yet.</div>
          ) : (
            <div className={styles.list}>
              {medicines.map(med => (
                <div key={med.id} className={styles.item}>
                  <div>
                    <div className={styles.itemName}>{med.name}</div>
                    {med.default_dosage && <div className={styles.itemDosage}>{med.default_dosage}</div>}
                  </div>
                  <div className={styles.actions}>
                    <button className="btn btn-secondary" onClick={() => handleEdit(med)} style={{ padding: '6px 12px', fontSize: 12 }}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(med.id)} style={{ padding: '6px 12px', fontSize: 12 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
