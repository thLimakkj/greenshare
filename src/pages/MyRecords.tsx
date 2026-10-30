import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { mensagemErro, SELECT_DOACAO } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import DonationCard from '../components/DonationCard'
import type { Doacao } from '../types'

type Aba = 'doacoes' | 'reservas'

export default function MyRecords() {
  const { user } = useAuth()
  const [aba, setAba] = useState<Aba>('doacoes')
  const [itens, setItens] = useState<Doacao[]>([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    const coluna = aba === 'doacoes' ? 'id_doador' : 'id_receptor'
    const { data, error } = await supabase.from('doacoes').select(SELECT_DOACAO)
      .eq(coluna, user!.id).order('criada_em', { ascending: false })
    if (error) toast.error(mensagemErro(error))
    else setItens(data as unknown as Doacao[])
    setLoading(false)
  }, [aba, user])

  useEffect(() => {
    setLoading(true)
    void carregar()
    const canal = supabase.channel(`registros-${aba}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doacoes' }, () => void carregar())
      .subscribe()
    return () => { void supabase.removeChannel(canal) }
  }, [carregar, aba])

  const excluir = async (id: string) => {
    const { error } = await supabase.from('doacoes').delete().eq('id', id)
    if (error) toast.error(mensagemErro(error)); else toast.success('Doação removida.')
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-bold">Meus registros</h1>
      <div role="tablist" className="flex gap-2">
        {([['doacoes', 'Minhas doações'], ['reservas', 'Minhas reservas']] as const).map(([k, rotulo]) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}
            className={`rounded-full border px-4 py-1.5 text-sm ${aba === k ? 'border-folha-600 bg-folha-600 text-white' : 'border-stone-300 bg-white'}`}>{rotulo}</button>
        ))}
      </div>
      {loading ? <p role="status">Carregando…</p>
        : itens.length === 0 ? <p className="py-10 text-center text-stone-600">
            {aba === 'doacoes' ? 'Você ainda não publicou doações.' : 'Você ainda não reservou nada. Veja o que está disponível na página inicial.'}</p>
        : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {itens.map((d) => (
              <div key={d.id} className="flex flex-col gap-2">
                <DonationCard doacao={d} userId={user!.id} onChanged={carregar} />
                {aba === 'doacoes' && d.status === 'Disponível' &&
                  <button className="btn-ghost text-sm text-red-700" onClick={() => excluir(d.id)}>Excluir anúncio</button>}
              </div>
            ))}
          </div>}
    </main>
  )
}
