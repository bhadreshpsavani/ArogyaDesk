# AGENTS.md

## Project

ArogyaDesk — offline-first doctor's clinic desktop app for a single-user (the doctor).

## Stack

- **Electron** — desktop shell (main process in `electron/`)
- **React + Vite** — renderer (source in `src/`)
- **better-sqlite3** — local SQLite database (sync API, WAL mode)
- **react-router-dom** — client-side routing via HashRouter

## Project Structure

```
electron/
  main.js        — Electron main process, IPC handlers, window setup
  preload.js     — Context bridge exposing electronAPI to renderer
  database.js    — SQLite schema + all DB query functions
src/
  main.jsx       — React entry point
  App.jsx        — Route definitions
  index.css      — Global styles + utility classes
  pages/
    Home.jsx / Home.module.css            — Search + patient grid home screen
    NewPatient.jsx / FormPage.module.css  — New patient registration form
    PatientProfile.jsx / PatientProfile.module.css — Patient detail + visit history
  components/
    PatientCard.jsx / PatientCard.module.css  — Card used in home grid
    VisitHistory.jsx / VisitHistory.module.css — Expandable visit list
    VisitForm.jsx                             — Add/edit visit modal
    EditPatientModal.jsx                      — Edit patient modal
    Modal.module.css                          — Shared modal styles
```

## Dev Commands

```
npm install      — install dependencies
npm run dev      — start Vite dev server + Electron (requires concurrently, wait-on)
npm run build    — build React to dist/
npm run dist     — build + package installer via electron-builder
```

## IPC API (window.electronAPI)

Patients: `searchPatients(query)`, `getAllPatients()`, `getPatient(id)`, `createPatient(data)`, `updatePatient(id, data)`, `deletePatient(id)`

Visits: `getVisitsByPatient(patientId)`, `getVisit(id)`, `createVisit(data)`, `updateVisit(id, data)`, `deleteVisit(id)`

Files: `selectFile(options)`, `openFile(filePath)`

## Database

SQLite file stored in `app.getPath('userData')/arogyadesk.db`.

Schema:
- `patients` — id, name, age, gender, phone, address, photo_path, notes, created_at
- `visits` — id, patient_id, visit_date, symptoms, diagnosis, prescription, prescription_path, charges, discount, final_amount, notes, created_at

## Design

CSS custom properties in `index.css`. CSS Modules for component styles. No Tailwind.

Primary color: `#2563eb`. Background: `#f1f5f9`.
