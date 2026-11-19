import { useState } from 'react'
import { supabase, NOME_CAF } from './supabase.js'

export default function Licenza({ stato, onAttivata }) {
  const [codice, setCodice] = useState('')
  const [errore, setErrore] = useState('')
  const [invio, setInvio] = useState(false)
  const scaduta = Boolean(stato?.scade_il)

  async function attiva(e) {
    e.preventDefault()
    setInvio(true)
    setErrore('')
    const { error } = await supabase.rpc('riscatta_codice', { p_codice: codice })
    if (error) setErrore('Codice non valido, già usato o generato per un\u2019altra email.')
    else await onAttivata()
    setInvio(false)
  }

  return (
    <div className="login">
      <form onSubmit={attiva} className="scheda-login">
        <h1>{scaduta ? 'Accesso scaduto' : 'Attiva l\u2019app'}</h1>
        <p className="sotto">{NOME_CAF}</p>
        <p className="guida">
          {scaduta
            ? `Il tuo periodo è terminato il ${new Date(stato.scade_il).toLocaleDateString('it-IT')}. Inserisci un nuovo codice per continuare.`
            : 'Inserisci il codice di attivazione che ti è stato inviato.'}
        </p>
        <label>
          Codice di attivazione
          <input
            value={codice}
            onChange={(e) => setCodice(e.target.value.toUpperCase())}
            placeholder="CAF-XXXX-XXXX-XXXX"
            autoCapitalize="characters"
            autoComplete="off"
            required
          />
        </label>
        {errore && <p className="errore" role="alert">{errore}</p>}
        <button className="primario" disabled={invio}>{invio ? 'Verifico…' : 'Attiva'}</button>
        <button type="button" className="link" onClick={() => supabase.auth.signOut()}>Esci</button>
      </form>
    </div>
  )
}
