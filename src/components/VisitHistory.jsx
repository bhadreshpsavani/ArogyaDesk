import { useState, useEffect } from 'react'
import { buildReceiptHtml } from '../pdfTemplate'
import styles from './VisitHistory.module.css'
import reportStyles from './VisitReports.module.css'

export default function VisitHistory({ visits, patient, doctor, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(null)
  const [exporting, setExporting] = useState(null)
  const [visitReports, setVisitReports] = useState({})

  useEffect(() => {
    if (expanded == null) return
    window.electronAPI.getReportsByVisit(expanded).then((reports) => {
      setVisitReports((prev) => ({ ...prev, [expanded]: reports }))
    }).catch(() => {})
  }, [expanded])

  const handleExportPdf = async (visit) => {
    setExporting(visit.id)
    try {
      const html = buildReceiptHtml({ doctor, patient, visit })
      const date = visit.visit_date.replace(/-/g, '')
      const name = (patient?.name || 'patient').replace(/\s+/g, '_')
      const result = await window.electronAPI.generatePdf({
        html,
        defaultFilename: `Receipt_${name}_${date}.pdf`,
      })
      if (result.success) {
        window.electronAPI.openFile(result.filePath)
      }
    } finally {
      setExporting(null)
    }
  }

  if (visits.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">Visit</div>
        <p>No visits recorded yet</p>
        <small>Click "+ Add Visit" to record the first visit</small>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {visits.map((visit) => {
        const isOpen = expanded === visit.id
        const date = new Date(visit.visit_date + 'T00:00:00').toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        })

        return (
          <div key={visit.id} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
            <div className={styles.row} onClick={() => setExpanded(isOpen ? null : visit.id)}>
              <div className={styles.left}>
                <span className={styles.chevron}>{isOpen ? 'v' : '>'}</span>
                <div>
                  <div className={styles.date}>{date}</div>
                  {visit.diagnosis && <div className={styles.diagnosis}>{visit.diagnosis}</div>}
                </div>
              </div>
              <div className={styles.right}>
                <div className={styles.amount}>Rs {(visit.final_amount || 0).toLocaleString('en-IN')}</div>
                {visit.discount > 0 && (
                  <div className={styles.discount}>{visit.discount}% off</div>
                )}
              </div>
            </div>

            {isOpen && (
              <div className={styles.detail}>
                {visit.symptoms && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Symptoms</span>
                    <span className={styles.fieldValue}>{visit.symptoms}</span>
                  </div>
                )}
                {visit.diagnosis && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Diagnosis</span>
                    <span className={styles.fieldValue}>{visit.diagnosis}</span>
                  </div>
                )}
                {visit.prescription && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Prescription</span>
                    <span className={styles.fieldValue} style={{ whiteSpace: 'pre-wrap' }}>{visit.prescription}</span>
                  </div>
                )}
                <div className={styles.billing}>
                  <div className={styles.billingRow}>
                    <span>Charges</span>
                    <span>Rs {(visit.charges || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {visit.discount > 0 && (
                    <div className={styles.billingRow}>
                      <span>Discount</span>
                      <span>-{visit.discount}%</span>
                    </div>
                  )}
                  <div className={`${styles.billingRow} ${styles.total}`}>
                    <span>Total</span>
                    <span>Rs {(visit.final_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                {visit.prescription_path && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => window.electronAPI.openFile(visit.prescription_path)}
                  >
                    Open Prescription File
                  </button>
                )}
                {(visitReports[visit.id] || []).length > 0 && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Reports</span>
                    <div className={reportStyles.reportList}>
                      {(visitReports[visit.id] || []).map((r) => (
                        <button
                          key={r.id}
                          className={reportStyles.reportChip}
                          onClick={() => window.electronAPI.openFile(r.file_path)}
                          title={`Open ${r.file_name}`}
                        >
                          <span>{r.file_type === 'image' ? '🖼' : '📄'}</span>
                          <span>{r.label || r.file_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {visit.notes && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Notes</span>
                    <span className={styles.fieldValue}>{visit.notes}</span>
                  </div>
                )}
                <div className={styles.detailActions}>
                  <button
                    className={`btn ${styles.pdfBtn}`}
                    onClick={() => handleExportPdf(visit)}
                    disabled={exporting === visit.id}
                  >
                    {exporting === visit.id ? 'Generating...' : 'Export PDF'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => onEdit(visit)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => onDelete(visit.id)}>Delete Visit</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
