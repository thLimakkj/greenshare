import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { mensagemErro } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

export default function Auth() {
  const { user } = useAuth()
  const location = useLocation()
  const [cadastro, setCadastro] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={(location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (cadastro && nome.trim().length < 2) return toast.error('Informe seu nome.')
    if (senha.length < 6) return toast.error('A senha precisa ter ao menos 6 caracteres.')
    setBusy(true)
    try {
      if (cadastro) {
        const { data, error } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome: nome.trim() } } })
        if (error) throw error
        if (!data.session) toast.success('Conta criada! Confirme o e-mail para entrar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
      }
    } catch (err) {
      toast.error(mensagemErro(err))
    } finally { setBusy(false) }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <Leaf className="text-folha-600" aria-hidden />
        <h1 className="mt-2 text-3xl font-bold">{cadastro ? 'Criar conta' : 'Entrar no GreenShare'}</h1>
        <p className="mt-1 text-stone-600">Com a mesma conta você doa alimentos e reserva o que precisar.</p>
      </div>
      <form onSubmit={enviar} className="space-y-4">
        {cadastro && <label className="block text-sm font-medium">Nome
          <input className="input mt-1" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" required /></label>}
        <label className="block text-sm font-medium">E-mail
          <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
        <label className="block text-sm font-medium">Senha
          <input className="input mt-1" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete={cadastro ? 'new-password' : 'current-password'} required /></label>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Aguarde…' : cadastro ? 'Criar conta' : 'Entrar'}</button>
      </form>
      <button className="text-sm text-folha-700 underline" onClick={() => setCadastro(!cadastro)}>
        {cadastro ? 'Já tenho conta' : 'Ainda não tenho conta'}
      </button>
    </main>
  )
}
