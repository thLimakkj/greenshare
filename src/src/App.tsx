import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Auth from './pages/Auth'
import Feed from './pages/Feed'
import NewDonation from './pages/NewDonation'
import MyRecords from './pages/MyRecords'
import Profile from './pages/Profile'

const Layout = () => (<><Navbar /><Outlet /></>)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<Auth />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Feed />} />
              <Route path="/doar" element={<NewDonation />} />
              <Route path="/meus-registros" element={<MyRecords />} />
              <Route path="/perfil" element={<Profile />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
    </AuthProvider>
  )
}
