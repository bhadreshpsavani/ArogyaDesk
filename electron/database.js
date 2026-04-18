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
`)

function searchPatients(query) {
  if (!query || query.trim() === '') return getAllPatients()
  const q = `%${query.trim()}%`
  return db.prepare(`
    SELECT p.*,
      (SELECT visit_date FROM visits WHERE patient_id = p.id ORDER BY visit_date DESC LIMIT 1) as last_visit,
      (SELECT COUNT(*) FROM visits WHERE patient_id = p.id) as visit_count
    FROM patients p
    WHERE p.name LIKE ? OR p.phone LIKE ?
    ORDER BY p.name
    LIMIT 50
  `).all(q, q)
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
  const stmt = db.prepare(`
    INSERT INTO patients (name, age, gender, phone, address, photo_path, notes)
    VALUES (@name, @age, @gender, @phone, @address, @photo_path, @notes)
  `)
  const result = stmt.run(data)
  return getPatient(result.lastInsertRowid)
}

function updatePatient(id, data) {
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
}
