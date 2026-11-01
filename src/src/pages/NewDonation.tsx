import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { mensagemErro } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { CATEGORIAS, UNIDADES, type Categoria } from '../types'

const MAX_MB = 5

export default function NewDonation() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<Categoria>(CATEGORIAS[0])
  const [quantidade, setQuantidade] = useState('')
  const [unidade, setUnidade] = useState<string>(UNIDADES[0])
  const [descricao, setDescricao] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  const escolherFoto = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (f && !f.type.startsWith('image/')) { toast.error('Escolha um arquivo de imagem.'); return }
    if (f && f.size > MAX_MB * 1024 * 1024) { toast.error(`A foto deve ter até ${MAX_MB} MB.`); return }
    setFoto(f)
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (titulo.trim().length < 3) return toast.error('Dê um título à doação (mín. 3 letras).')
    const qtd = Number(quantidade)
    if (!Number.isInteger(qtd) || qtd < 1) return toast.error('Informe a quantidade (número inteiro, mínimo 1).')
    setBusy(true)
    try {
      let url: string | null = null
      if (foto) {
        const ext = foto.name.split('.').pop() ?? 'jpg'
        const caminho = `${user!.id}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from('imagens-doacoes').upload(caminho, foto)
        if (upErr) throw upErr
        url = supabase.storage.from('imagens-doacoes').getPublicUrl(caminho).data.publicUrl
      }
      const { error } = await supabase.from('doacoes').insert({
        id_doador: user!.id, titulo: titulo.trim(), categoria, qtd, unidade,
        descricao: descricao.trim() || null, url_imagem: url,
      })
      if (error) throw error
      toast.success('Doação publicada!')
      navigate('/meus-registros')
    } catch (err) {
      toast.error(mensagemErro(err))
    } finally { setBusy(false) }
  }

  return (
    <main className="mx-auto max-w-xl p-4 pb-24">
      <h1 className="mb-4 text-2xl font-bold">Cadastrar doação</h1>
      <form onSubmit={enviar} className="space-y-4">
        <label className="block text-sm font-medium">Título
          <input className="input mt-1" placeholder="Ex.: 10 marmitas de almoço" value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></label>
        <label className="block text-sm font-medium">Categoria
          <select className="input mt-1" value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">Quantidade
            <input className="input mt-1" type="number" inputMode="numeric" min={1} step={1} placeholder="Ex.: 10" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required /></label>
          <label className="block text-sm font-medium">Unidade
            <select className="input mt-1" value={unidade} onChange={(e) => setUnidade(e.target.value)}>
              {UNIDADES.map((u) => <option key={u}>{u}</option>)}</select></label>
        </div>
        <label className="block text-sm font-medium">Descrição
          <textarea className="input mt-1" rows={4} placeholder="Validade, ingredientes, conservação…" value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label>
        <label className="block text-sm font-medium">Foto (opcional)
          <input className="input mt-1" type="file" accept="image/*" onChange={escolherFoto} /></label>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Publicando…' : 'Publicar doação'}</button>
      </form>
    </main>
  )
}
