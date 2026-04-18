const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Patients
  searchPatients: (query) => ipcRenderer.invoke('patients:search', query),
  getAllPatients: () => ipcRenderer.invoke('patients:getAll'),
  getPatient: (id) => ipcRenderer.invoke('patients:get', id),
  createPatient: (data) => ipcRenderer.invoke('patients:create', data),
  updatePatient: (id, data) => ipcRenderer.invoke('patients:update', id, data),
  deletePatient: (id) => ipcRenderer.invoke('patients:delete', id),

  // Visits
  getVisitsByPatient: (patientId) => ipcRenderer.invoke('visits:getByPatient', patientId),
  getVisit: (id) => ipcRenderer.invoke('visits:get', id),
  createVisit: (data) => ipcRenderer.invoke('visits:create', data),
  updateVisit: (id, data) => ipcRenderer.invoke('visits:update', id, data),
  deleteVisit: (id) => ipcRenderer.invoke('visits:delete', id),

  // Doctor profile
  getDoctorProfile: () => ipcRenderer.invoke('doctor:get'),
  saveDoctorProfile: (data) => ipcRenderer.invoke('doctor:save', data),

  // PDF
  generatePdf: (opts) => ipcRenderer.invoke('pdf:generate', opts),

  // Image reader
  readImage: (filePath) => ipcRenderer.invoke('file:readImage', filePath),

  // Files
  selectFile: (options) => ipcRenderer.invoke('file:select', options),
  openFile: (filePath) => ipcRenderer.invoke('file:open', filePath),
})
