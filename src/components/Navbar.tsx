import { NavLink, Link } from 'react-router-dom'
import { Leaf, LogOut, PlusCircle, ClipboardList, Utensils, UserCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const link = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 px-3 py-1 text-xs sm:flex-row sm:gap-2 sm:text-sm ${isActive ? 'font-bold text-folha-700' : 'text-stone-600'}`

export default function Navbar() {
  const { perfil, signOut } = useAuth()
  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-folha-700"><Leaf aria-hidden size={22} />GreenShare</Link>
        <nav aria-label="Principal" className="hidden items-center gap-4 sm:flex">
          <NavLink to="/" end className={link}><Utensils size={18} aria-hidden />Doações</NavLink>
          <NavLink to="/doar" className={link}><PlusCircle size={18} aria-hidden />Doar</NavLink>
          <NavLink to="/meus-registros" className={link}><ClipboardList size={18} aria-hidden />Meus registros</NavLink>
          <NavLink to="/perfil" className={link}><UserCircle size={18} aria-hidden />Meu perfil</NavLink>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-stone-600 sm:inline">{perfil?.nome}</span>
          <button onClick={signOut} className="btn-ghost !px-3 !py-1.5" aria-label="Sair"><LogOut size={16} aria-hidden /></button>
        </div>
      </header>
      <nav aria-label="Principal (celular)" className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-stone-200 bg-white py-1.5 sm:hidden">
        <NavLink to="/" end className={link}><Utensils size={20} aria-hidden />Doações</NavLink>
        <NavLink to="/doar" className={link}><PlusCircle size={20} aria-hidden />Doar</NavLink>
        <NavLink to="/meus-registros" className={link}><ClipboardList size={20} aria-hidden />Registros</NavLink>
        <NavLink to="/perfil" className={link}><UserCircle size={20} aria-hidden />Perfil</NavLink>
      </nav>
    </>
  )
}
