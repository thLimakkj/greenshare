import toast from 'react-hot-toast'
import { supabase } from './supabase'
import type { Acao } from '../types'

const MENSAGENS: Record<Acao, string> = {
  reservar_doacao: 'Doação reservada! Combine a retirada com o doador.',
  cancelar_reserva: 'Reserva cancelada.',
  concluir_entrega: 'Entrega registrada. Obrigado por doar!',
}

export function mensagemErro(e: unknown): string {
  if (e instanceof TypeError) return 'Sem conexão. Verifique sua internet e tente novamente.'
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: string }).message)
  return 'Algo deu errado. Tente novamente.'
}

export async function executarAcao(acao: Acao, id: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc(acao, { p_id: id })
    if (error) throw error
    toast.success(MENSAGENS[acao])
    return true
  } catch (e) {
    toast.error(mensagemErro(e))
    return false
  }
}

export const SELECT_DOACAO = '*, doador:id_doador(nome, telefone, endereco)'
