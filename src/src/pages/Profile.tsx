import { useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { mensagemErro } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('perfis').select('nome, telefone, endereco').eq('id', user!.id).single()
      .then(({ data, error }) => {
        if (error) toast.error(mensagemErro(error))
        else {
          setNome(data.nome ?? '')
          setTelefone(data.telefone ?? '')
          setEndereco(data.endereco ?? '')
        }
        setLoading(false)
      })
  }, [user])

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    if (nome.trim().length < 2) return toast.error('Informe seu nome.')
    if (!/^\d{10,11}$/.test(telefone.replace(/\D/g, ''))) return toast.error('Informe um telefone válido com DDD.')
    if (endereco.trim().length < 5) return toast.error('Informe seu endereço.')
    setBusy(true)
    try {
      const { error } = await supabase.from('perfis')
        .update({ nome: nome.trim(), telefone: telefone.trim(), endereco: endereco.trim() }).eq('id', user!.id)
      if (error) throw error
      toast.success('Perfil atualizado!')
    } catch (err) {
      toast.error(mensagemErro(err))
    } finally { setBusy(false) }
  }

  return (
    <main className="mx-auto max-w-xl p-4 pb-24">
      <h1 className="mb-1 text-2xl font-bold">Meu perfil</h1>
      <p className="mb-4 text-sm text-stone-600">Quando você reserva ou recebe uma reserva, o outro lado vê seu telefone e endereço para combinar a retirada.</p>
      {loading ? <p role="status">Carregando…</p> : (
        <form onSubmit={salvar} className="space-y-4">
          <label className="block text-sm font-medium">Nome
            <input className="input mt-1" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" required /></label>
          <label className="block text-sm font-medium">Telefone (com DDD)
            <input className="input mt-1" type="tel" inputMode="tel" placeholder="(21) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} autoComplete="tel" required /></label>
          <label className="block text-sm font-medium">Endereço
            <input className="input mt-1" placeholder="Rua, número, bairro, cidade" value={endereco} onChange={(e) => setEndereco(e.target.value)} autoComplete="street-address" required /></label>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Salvando…' : 'Salvar perfil'}</button>
        </form>
      )}
    </main>
  )
}
