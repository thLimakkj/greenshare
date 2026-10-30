export type Status = 'Disponível' | 'Reservado' | 'Entregue'
export const CATEGORIAS = ['Pratos prontos', 'Hortifruti', 'Grãos e cereais', 'Panificadoras', 'Outros'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export interface Perfil { id: string; nome: string; telefone: string | null; endereco: string | null; admin: boolean }
export interface Doador { nome: string; telefone: string | null; endereco: string | null }
export interface Doacao {
  id: string; id_doador: string; titulo: string; descricao: string | null; categoria: Categoria
  quantidade: string; url_imagem: string | null; status: Status; id_receptor: string | null
  criada_em: string; doador: Doador | null
}
export type Acao = 'reservar_doacao' | 'cancelar_reserva' | 'concluir_entrega'
