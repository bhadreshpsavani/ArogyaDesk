import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import PatientProfile from './pages/PatientProfile'
import NewPatient from './pages/NewPatient'
import Setup from './pages/Setup'
import Settings from './pages/Settings'

export default function App() {
  const [profileChecked, setProfileChecked] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    window.electronAPI.getDoctorProfile().then((profile) => {
      setHasProfile(!!profile)
      setProfileChecked(true)
    })
  }, [])

  if (!profileChecked) return null

  return (
    <Routes>
      <Route
        path="/setup"
        element={hasProfile ? <Navigate to="/" replace /> : <Setup onComplete={() => setHasProfile(true)} />}
      />
      <Route
        path="/"
        element={hasProfile ? <Home /> : <Navigate to="/setup" replace />}
      />
      <Route
        path="/patient/new"
        element={hasProfile ? <NewPatient /> : <Navigate to="/setup" replace />}
      />
      <Route
        path="/patient/:id"
        element={hasProfile ? <PatientProfile /> : <Navigate to="/setup" replace />}
      />
      <Route
        path="/settings"
        element={hasProfile ? <Settings /> : <Navigate to="/setup" replace />}
      />
    </Routes>
  )
}
