const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')
const fs = require('fs')

const userDataPath = app.getPath('userData')
const dbPath = path.join(userDataPath, 'arogyadesk.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    address TEXT,
    photo_path TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    visit_date DATE NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    prescription TEXT,
    prescription_path TEXT,
    charges REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    final_amount REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS doctor_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    clinic_name TEXT,
    specialization TEXT,
    phone TEXT,
    address TEXT,
    photo_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
  CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
  CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
  CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);

  CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    default_dosage TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS patient_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    label TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_records_patient ON patient_records(patient_id);

  CREATE TABLE IF NOT EXISTS visit_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    label TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_visit_reports_visit ON visit_reports(visit_id);
`)

function searchPatients(filters) {
  let query = ''
  let gender = ''
  let visitDate = ''
  let age = ''

  if (typeof filters === 'string') {
    query = filters
  } else if (filters) {
    query = filters.query || ''
    gender = filters.gender || ''
    visitDate = filters.visitDate || ''
    age = filters.age || ''
  }

  let sql = `
    SELECT p.*,
      (SELECT visit_date FROM visits WHERE patient_id = p.id ORDER BY visit_date DESC LIMIT 1) as last_visit,
      (SELECT COUNT(*) FROM visits WHERE patient_id = p.id) as visit_count
    FROM patients p
    WHERE 1=1
  `
  const params = []

  if (query.trim() !== '') {
    sql += ` AND (p.name LIKE ? OR p.phone LIKE ?)`
    const q = `%${query.trim()}%`
    params.push(q, q)
  }

  if (gender && gender !== 'All' && gender !== '') {
    sql += ` AND p.gender = ?`
    params.push(gender)
  }

  if (visitDate) {
    sql += ` AND EXISTS (SELECT 1 FROM visits v WHERE v.patient_id = p.id AND v.visit_date = ?)`
    params.push(visitDate)
  }

  if (age) {
    sql += ` AND p.age = ?`
    params.push(parseInt(age, 10))
  }

  sql += ` ORDER BY p.name LIMIT 50`

  return db.prepare(sql).all(...params)
}

function getAllPatients() {
  return db.prepare(`
    SELECT p.*,
      (SELECT visit_date FROM visits WHERE patient_id = p.id ORDER BY visit_date DESC LIMIT 1) as last_visit,
      (SELECT COUNT(*) FROM visits WHERE patient_id = p.id) as visit_count
    FROM patients p
    ORDER BY p.name
    LIMIT 50
  `).all()
}

function getPatient(id) {
  return db.prepare('SELECT * FROM patients WHERE id = ?').get(id)
}

function createPatient(data) {
  let existingQuery = 'SELECT id FROM patients WHERE LOWER(name) = LOWER(?)'
  const params = [data.name]
  if (data.phone) {
    existingQuery += ' AND phone = ?'
    params.push(data.phone)
  } else {
    existingQuery += ' AND phone IS NULL'
  }
  const existing = db.prepare(existingQuery).get(...params)
  if (existing) {
    throw new Error('DUPLICATE_PATIENT')
  }

  const stmt = db.prepare(`
    INSERT INTO patients (name, age, gender, phone, address, photo_path, notes)
    VALUES (@name, @age, @gender, @phone, @address, @photo_path, @notes)
  `)
  const result = stmt.run(data)
  return getPatient(result.lastInsertRowid)
}

function updatePatient(id, data) {
  let existingQuery = 'SELECT id FROM patients WHERE LOWER(name) = LOWER(?) AND id != ?'
  const params = [data.name, id]
  if (data.phone) {
    existingQuery += ' AND phone = ?'
    params.push(data.phone)
  } else {
    existingQuery += ' AND phone IS NULL'
  }
  const existing = db.prepare(existingQuery).get(...params)
  if (existing) {
    throw new Error('DUPLICATE_PATIENT')
  }

  db.prepare(`
    UPDATE patients SET name=@name, age=@age, gender=@gender, phone=@phone,
      address=@address, photo_path=@photo_path, notes=@notes
    WHERE id=@id
  `).run({ ...data, id })
  return getPatient(id)
}

function deletePatient(id) {
  return db.prepare('DELETE FROM patients WHERE id = ?').run(id)
}

function getVisitsByPatient(patientId) {
  return db.prepare(`
    SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date DESC, created_at DESC
  `).all(patientId)
}

function getVisit(id) {
  return db.prepare('SELECT * FROM visits WHERE id = ?').get(id)
}

function createVisit(data) {
  const stmt = db.prepare(`
    INSERT INTO visits (patient_id, visit_date, symptoms, diagnosis, prescription, prescription_path, charges, discount, final_amount, notes)
    VALUES (@patient_id, @visit_date, @symptoms, @diagnosis, @prescription, @prescription_path, @charges, @discount, @final_amount, @notes)
  `)
  const result = stmt.run(data)
  return getVisit(result.lastInsertRowid)
}

function updateVisit(id, data) {
  db.prepare(`
    UPDATE visits SET visit_date=@visit_date, symptoms=@symptoms, diagnosis=@diagnosis,
      prescription=@prescription, prescription_path=@prescription_path,
      charges=@charges, discount=@discount, final_amount=@final_amount, notes=@notes
    WHERE id=@id
  `).run({ ...data, id })
  return getVisit(id)
}

function deleteVisit(id) {
  return db.prepare('DELETE FROM visits WHERE id = ?').run(id)
}

function getDoctorProfile() {
  return db.prepare('SELECT * FROM doctor_profile WHERE id = 1').get() || null
}

function saveDoctorProfile(data) {
  db.prepare(`
    INSERT INTO doctor_profile (id, name, clinic_name, specialization, phone, address, photo_path)
    VALUES (1, @name, @clinic_name, @specialization, @phone, @address, @photo_path)
    ON CONFLICT(id) DO UPDATE SET
      name=@name, clinic_name=@clinic_name, specialization=@specialization,
      phone=@phone, address=@address, photo_path=@photo_path
  `).run(data)
  return getDoctorProfile()
}

function getAllMedicines() {
  return db.prepare('SELECT * FROM medicines ORDER BY name').all()
}

function getMedicine(id) {
  return db.prepare('SELECT * FROM medicines WHERE id = ?').get(id)
}

function createMedicine(data) {
  const stmt = db.prepare(`
    INSERT INTO medicines (name, default_dosage)
    VALUES (@name, @default_dosage)
  `)
  const result = stmt.run(data)
  return getMedicine(result.lastInsertRowid)
}

function updateMedicine(id, data) {
  db.prepare(`
    UPDATE medicines SET name=@name, default_dosage=@default_dosage
    WHERE id=@id
  `).run({ ...data, id })
  return getMedicine(id)
}

function deleteMedicine(id) {
  return db.prepare('DELETE FROM medicines WHERE id = ?').run(id)
}

function getRecordsByPatient(patientId) {
  return db.prepare('SELECT * FROM patient_records WHERE patient_id = ? ORDER BY created_at DESC').all(patientId)
}

function createRecord(data) {
  const stmt = db.prepare(`
    INSERT INTO patient_records (patient_id, file_path, file_name, file_type, label)
    VALUES (@patient_id, @file_path, @file_name, @file_type, @label)
  `)
  const result = stmt.run(data)
  return db.prepare('SELECT * FROM patient_records WHERE id = ?').get(result.lastInsertRowid)
}

function deleteRecord(id) {
  const record = db.prepare('SELECT * FROM patient_records WHERE id = ?').get(id)
  const changes = db.prepare('DELETE FROM patient_records WHERE id = ?').run(id).changes
  return { deleted: changes > 0, record }
}

function getReportsByVisit(visitId) {
  return db.prepare('SELECT * FROM visit_reports WHERE visit_id = ? ORDER BY created_at ASC').all(visitId)
}

function createVisitReport(data) {
  const stmt = db.prepare(`
    INSERT INTO visit_reports (visit_id, file_path, file_name, file_type, label)
    VALUES (@visit_id, @file_path, @file_name, @file_type, @label)
  `)
  const result = stmt.run(data)
  return db.prepare('SELECT * FROM visit_reports WHERE id = ?').get(result.lastInsertRowid)
}

function deleteVisitReport(id) {
  const report = db.prepare('SELECT * FROM visit_reports WHERE id = ?').get(id)
  const changes = db.prepare('DELETE FROM visit_reports WHERE id = ?').run(id).changes
  return { deleted: changes > 0, report }
}

module.exports = {
  searchPatients,
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getVisitsByPatient,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  getDoctorProfile,
  saveDoctorProfile,
  getAllMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getRecordsByPatient,
  createRecord,
  deleteRecord,
  getReportsByVisit,
  createVisitReport,
  deleteVisitReport,
  getAllPatientPhotos: () => db.prepare('SELECT id, photo_path FROM patients WHERE photo_path IS NOT NULL').all(),
  close: () => db.close(),
  backup: (destPath) => db.backup(destPath),
}
