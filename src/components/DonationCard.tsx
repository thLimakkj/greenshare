import { useState } from 'react'
import toast from 'react-hot-toast'
import { Check, MapPin, Phone, User as UserIcon, X } from 'lucide-react'
import type { Acao, Doacao } from '../types'
import { executarAcao } from '../lib/api'

const COR: Record<Doacao['status'], string> = {
  'Disponível': 'bg-folha-100 text-folha-800',
  'Reservado': 'bg-amber-100 text-amber-900',
  'Entregue': 'bg-stone-200 text-stone-700',
}

interface Props { doacao: Doacao; userId: string; onChanged?: () => void }

export default function DonationCard({ doacao: d, userId, onChanged }: Props) {
  const [busy, setBusy] = useState(false)
  const [qtdTxt, setQtdTxt] = useState('1')
  const souDoador = d.id_doador === userId
  const souReceptor = d.id_receptor === userId

  const rodar = async (acao: Acao) => {
    let qtd: number | undefined
    if (acao === 'reservar_doacao') {
      qtd = Number(qtdTxt)
      if (!Number.isInteger(qtd) || qtd < 1 || qtd > d.qtd) {
        toast.error(`Escolha uma quantidade entre 1 e ${d.qtd}.`)
        return
      }
    }
    setBusy(true)
    const ok = await executarAcao(acao, d.id, qtd)
    setBusy(false)
    if (ok) { setQtdTxt('1'); onChanged?.() }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
      {d.url_imagem
        ? <img src={d.url_imagem} alt={d.titulo} loading="lazy" className="aspect-[4/3] w-full object-cover" />
        : <div className="grid aspect-[4/3] place-items-center bg-folha-50 text-folha-600" aria-hidden>Sem foto</div>}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-tight">{d.titulo}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${COR[d.status]}`}>{d.status}</span>
        </div>
        <p className="text-sm text-stone-600">{d.categoria} · {d.qtd} {d.unidade}</p>
        {d.descricao && <p className="text-sm">{d.descricao}</p>}
        {d.doador && (
          <ul className="mt-1 space-y-1 text-sm text-stone-600">
            <li className="flex items-center gap-2"><UserIcon size={14} aria-hidden />{d.doador.nome}</li>
            {d.doador.endereco && <li className="flex items-center gap-2"><MapPin size={14} aria-hidden />{d.doador.endereco}</li>}
            {d.doador.telefone && (souDoador || souReceptor) &&
              <li className="flex items-center gap-2"><Phone size={14} aria-hidden />{d.doador.telefone}</li>}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          {d.status === 'Disponível' && !souDoador && (
            <div className="flex w-full items-end gap-2">
              <label className="text-sm font-medium">Quantidade
                <input className="input mt-1 !w-24" type="number" inputMode="numeric" min={1} max={d.qtd} value={qtdTxt}
                  onChange={(e) => setQtdTxt(e.target.value)} aria-describedby={`max-${d.id}`} /></label>
              <button disabled={busy} onClick={() => rodar('reservar_doacao')} className="btn-primary flex-1">Reservar doação</button>
            </div>
          )}
          {d.status === 'Disponível' && !souDoador && <p id={`max-${d.id}`} className="text-xs text-stone-500">Máximo: {d.qtd} {d.unidade}</p>}
          {d.status === 'Disponível' && souDoador && <p className="text-sm text-stone-500">Sua doação está visível para todos.</p>}
          {d.status === 'Reservado' && souDoador &&
            <button disabled={busy} onClick={() => rodar('concluir_entrega')} className="btn-primary flex-1"><Check size={16} aria-hidden />Marcar como entregue</button>}
          {d.status === 'Reservado' && (souDoador || souReceptor) &&
            <button disabled={busy} onClick={() => rodar('cancelar_reserva')} className="btn-ghost flex-1"><X size={16} aria-hidden />Cancelar reserva</button>}
        </div>
      </div>
    </article>
  )
}
