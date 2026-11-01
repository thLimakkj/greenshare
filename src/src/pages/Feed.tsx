import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { mensagemErro, SELECT_DOACAO } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import DonationCard from '../components/DonationCard'
import { CATEGORIAS, type Doacao } from '../types'

export default function Feed() {
  const { user } = useAuth()
  const [itens, setItens] = useState<Doacao[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState<string>('Todas')

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('doacoes').select(SELECT_DOACAO)
      .eq('status', 'Disponível').order('criada_em', { ascending: false })
    if (error) toast.error(mensagemErro(error))
    else setItens(data as unknown as Doacao[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void carregar()
    const canal = supabase.channel('doacoes-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doacoes' }, () => void carregar())
      .subscribe()
    return () => { void supabase.removeChannel(canal) }
  }, [carregar])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return itens.filter((d) =>
      (cat === 'Todas' || d.categoria === cat) &&
      (!q || d.titulo.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q)))
  }, [itens, busca, cat])

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-bold">Alimentos disponíveis</h1>
      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-stone-400" size={18} aria-hidden />
        <input className="input !pl-10" type="search" placeholder="Buscar por título ou categoria" aria-label="Buscar doações"
          value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por categoria">
        {['Todas', ...CATEGORIAS].map((c) => (
          <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${cat === c ? 'border-folha-600 bg-folha-600 text-white' : 'border-stone-300 bg-white'}`}>{c}</button>
        ))}
      </div>
      {loading ? <p role="status">Carregando doações…</p>
        : filtrados.length === 0 ? <p className="py-10 text-center text-stone-600">Nenhuma doação disponível agora. Volte em breve ou cadastre uma em “Doar”.</p>
        : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((d) => <DonationCard key={d.id} doacao={d} userId={user!.id} />)}
          </div>}
    </main>
  )
}
