const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const db = require('./database')

const IMAGE_MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif',
}

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

const iconPath = path.join(__dirname, '../assets/icon.png')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    show: false,
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Patient IPC handlers
ipcMain.handle('patients:search', (_, query) => db.searchPatients(query))
ipcMain.handle('patients:getAll', () => db.getAllPatients())
ipcMain.handle('patients:get', (_, id) => db.getPatient(id))
ipcMain.handle('patients:create', (_, data) => db.createPatient(data))
ipcMain.handle('patients:update', (_, id, data) => db.updatePatient(id, data))
ipcMain.handle('patients:delete', (_, id) => db.deletePatient(id))

// Visit IPC handlers
ipcMain.handle('visits:getByPatient', (_, patientId) => db.getVisitsByPatient(patientId))
ipcMain.handle('visits:get', (_, id) => db.getVisit(id))
ipcMain.handle('visits:create', (_, data) => db.createVisit(data))
ipcMain.handle('visits:update', (_, id, data) => db.updateVisit(id, data))
ipcMain.handle('visits:delete', (_, id) => db.deleteVisit(id))

// Doctor profile IPC handlers
ipcMain.handle('doctor:get', () => db.getDoctorProfile())
ipcMain.handle('doctor:save', (_, data) => db.saveDoctorProfile(data))

// Image reader — returns base64 data URL, avoids all file:// protocol issues
ipcMain.handle('file:readImage', (_, filePath) => {
  if (!filePath) return null
  try {
    const data = fs.readFileSync(filePath)
    const mime = IMAGE_MIME[path.extname(filePath).toLowerCase()] || 'image/jpeg'
    return `data:${mime};base64,${data.toString('base64')}`
  } catch {
    return null
  }
})

// PDF generation
ipcMain.handle('pdf:generate', async (_, { html, defaultFilename }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: defaultFilename || 'receipt.pdf',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  })
  if (canceled || !filePath) return { success: false }

  const tmpFile = path.join(os.tmpdir(), `arogyadesk-${Date.now()}.html`)
  fs.writeFileSync(tmpFile, html, 'utf8')

  const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } })
  await win.loadFile(tmpFile)

  const pdfBuffer = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
  })

  win.destroy()
  fs.unlinkSync(tmpFile)
  fs.writeFileSync(filePath, pdfBuffer)

  return { success: true, filePath }
})

// File IPC handlers
ipcMain.handle('file:select', async (_, options = {}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('file:open', (_, filePath) => {
  shell.openPath(filePath)
})
