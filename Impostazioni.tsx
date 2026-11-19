import { useState } from 'react'
import { supabase } from './supabase.js'

export default function Impostazioni({ nomeCaf }) {
  const [nome, setNome] = useState(nomeCaf)
  const [errore, setErrore] = useState('')
  const [esito, setEsito] = useState('')
  const [invio, setInvio] = useState(false)

  async function salva(e) {
    e.preventDefault()
    setInvio(true)
    setErrore('')
    setEsito('')
    const { error } = await supabase.auth.updateUser({ data: { nome_caf: nome.trim() } })
    setInvio(false)
    if (error) setErrore('Nome non salvato. Riprova.')
    else setEsito('Salvato. Da ora i messaggi WhatsApp useranno questo nome.')
  }

  return (
    <section>
      <h2 className="titolo-sezione">Il mio CAF</h2>
      <p className="guida">Questo nome compare alla fine del messaggio WhatsApp che invii ai clienti.</p>
      <form className="modulo" onSubmit={salva}>
        <label>
          Nome del CAF
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} required />
        </label>
        {errore && <p className="errore" role="alert">{errore}</p>}
        {esito && <p className="esito" role="status">{esito}</p>}
        <button className="primario" disabled={invio}>{invio ? 'Salvo…' : 'Salva'}</button>
      </form>
    </section>
  )
}
