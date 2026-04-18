import { useState, useEffect } from 'react'
import LocalImage from './LocalImage'
import styles from './PatientRecords.module.css'

export default function PatientRecords({ patientId }) {
  const [records, setRecords] = useState([])
  const [uploading, setUploading] = useState(false)
  const [labelInput, setLabelInput] = useState('')
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    window.electronAPI.getRecordsByPatient(patientId).then(setRecords)
  }, [patientId])

  const handleUpload = async () => {
    const filePath = await window.electronAPI.selectFile({
      filters: [
        { name: 'Images & Documents', extensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'] },
      ],
    })
    if (!filePath) return
    setUploading(true)
    try {
      const record = await window.electronAPI.createRecord({
        patientId,
        sourcePath: filePath,
        label: labelInput.trim() || null,
      })
      setRecords((prev) => [record, ...prev])
      setLabelInput('')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    await window.electronAPI.deleteRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const openLightbox = async (record) => {
    const src = await window.electronAPI.readImage(record.file_path)
    if (src) setLightbox({ src, label: record.label || record.file_name })
  }

  return (
    <div className={styles.container}>
      <div className={styles.uploadBar}>
        <input
          type="text"
          className="input"
          placeholder="Label (optional)"
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUpload()}
        />
        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : '+ Upload Record'}
        </button>
      </div>

      {records.length === 0 ? (
        <div className={styles.empty}>No records yet. Upload images, PDFs, or documents.</div>
      ) : (
        <div className={styles.grid}>
          {records.map((r) => (
            <div key={r.id} className={styles.card}>
              <div
                className={styles.preview}
                onClick={() => r.file_type === 'image' ? openLightbox(r) : window.electronAPI.openFile(r.file_path)}
                title={r.file_type === 'image' ? 'Click to view' : 'Click to open'}
              >
                {r.file_type === 'image' ? (
                  <LocalImage filePath={r.file_path} alt={r.label || r.file_name} className={styles.thumb} />
                ) : (
                  <div className={styles.fileIcon}>
                    <span className={styles.fileIconSymbol}>{r.file_type === 'pdf' ? '📄' : '📎'}</span>
                    <span className={styles.fileExt}>{r.file_name.split('.').pop().toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className={styles.meta}>
                <span className={styles.fileName} title={r.file_name}>{r.label || r.file_name}</span>
                <span className={styles.date}>{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
              </div>
              <button className={styles.deleteBtn} onClick={() => handleDelete(r.id)} title="Delete">×</button>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>×</button>
            <img src={lightbox.src} alt={lightbox.label} className={styles.lightboxImg} />
            {lightbox.label && <div className={styles.lightboxLabel}>{lightbox.label}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
