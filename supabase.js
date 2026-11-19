import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

export const NOME_CAF = import.meta.env.VITE_NOME_CAF || 'il nostro CAF'

// Nome del CAF scelto dall'operatore (salvato nell'account), con valore di riserva.
export const nomeCafDi = (sessione) =>
  (sessione?.user?.user_metadata?.nome_caf || '').trim() || NOME_CAF

// Conta una visita al sito (una per sessione del browser). Errori ignorati.
export function registraVisita() {
  try {
    if (sessionStorage.getItem('visita_contata')) return
    sessionStorage.setItem('visita_contata', '1')
    let id = localStorage.getItem('visitatore_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('visitatore_id', id)
    }
    supabase.rpc('registra_visita', { p_visitatore: id }).then(() => {}, () => {})
  } catch { /* storage bloccato: non conto */ }
}
