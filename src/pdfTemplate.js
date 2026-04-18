export function buildReceiptHtml({ doctor, patient, visit }) {
  const visitDate = new Date(visit.visit_date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const printedOn = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const charges = visit.charges || 0
  const discount = visit.discount || 0
  const final = visit.final_amount || 0
  const discountAmount = charges - final

  const row = (label, value) =>
    value ? `<tr><td class="lbl">${label}</td><td class="val">${value}</td></tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; background: white; padding: 32px; }
  .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
  .clinic-name { font-size: 22px; font-weight: 700; color: #2563eb; }
  .doctor-name { font-size: 15px; font-weight: 600; margin-top: 2px; }
  .doctor-meta { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.6; }
  .receipt-label { text-align: right; }
  .receipt-label h2 { font-size: 18px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; }
  .receipt-label .date { font-size: 12px; color: #64748b; margin-top: 4px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  table td { padding: 4px 0; vertical-align: top; }
  td.lbl { color: #64748b; width: 160px; font-size: 12px; }
  td.val { color: #1e293b; font-size: 13px; }
  .prescription-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-family: monospace; font-size: 12px; white-space: pre-wrap; line-height: 1.8; margin-top: 4px; }
  .billing-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .billing-table td { padding: 6px 12px; }
  .billing-table tr:not(:last-child) td { border-bottom: 1px solid #e2e8f0; }
  .billing-table .b-lbl { color: #64748b; font-size: 13px; }
  .billing-table .b-val { text-align: right; font-size: 13px; }
  .billing-total td { background: #dbeafe; font-weight: 700; font-size: 15px; color: #2563eb; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      ${doctor?.clinic_name ? `<div class="clinic-name">${doctor.clinic_name}</div>` : ''}
      <div class="doctor-name">${doctor?.name || ''}</div>
      <div class="doctor-meta">
        ${doctor?.specialization ? doctor.specialization + '<br/>' : ''}
        ${doctor?.phone ? '&#9990; ' + doctor.phone + '<br/>' : ''}
        ${doctor?.address ? doctor.address : ''}
      </div>
    </div>
    <div class="receipt-label">
      <h2>Receipt</h2>
      <div class="date">Visit Date: ${visitDate}</div>
      <div class="date">Printed: ${printedOn}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Patient Details</div>
    <table>
      ${row('Name', patient?.name)}
      ${row('Age / Gender', [patient?.age ? patient.age + ' years' : '', patient?.gender].filter(Boolean).join(' · '))}
      ${row('Phone', patient?.phone)}
      ${row('Address', patient?.address)}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Visit Details</div>
    <table>
      ${row('Symptoms', visit.symptoms)}
      ${row('Diagnosis', visit.diagnosis)}
      ${visit.notes ? row('Notes', visit.notes) : ''}
    </table>
    ${visit.prescription ? `
      <div style="margin-top:10px;font-size:12px;color:#64748b;font-weight:600;">Prescription</div>
      <div class="prescription-box">${visit.prescription.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    ` : ''}
  </div>

  <div class="section">
    <div class="section-title">Billing</div>
    <table class="billing-table">
      <tr><td class="b-lbl">Consultation Charges</td><td class="b-val">&#8377; ${charges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
      ${discount > 0 ? `<tr><td class="b-lbl">Discount (${discount}%)</td><td class="b-val">&#8722; &#8377; ${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
      <tr class="billing-total"><td class="b-lbl">Total Amount</td><td class="b-val">&#8377; ${final.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
    </table>
  </div>

  <div class="footer">
    Thank you for visiting ${doctor?.clinic_name || doctor?.name || ''}. Get well soon!
  </div>
</body>
</html>`
}
