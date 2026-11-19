import { useState } from 'react'
import { supabase, NOME_CAF } from './supabase.js'

export default function NuovaPassword({ onFatto }) {
  const [password, setPassword] = useState('')
  const [conferma, setConferma] = useState('')
  const [errore, setErrore] = useState('')
  const [invio, setInvio] = useState(false)

  async function salva(e) {
    e.preventDefault()
    setErrore('')
    if (password !== conferma) {
      setErrore('Le due password non coincidono.')
      return
    }
    setInvio(true)
    const { error } = await supabase.auth.updateUser({ password })
    setInvio(false)
    if (error) setErrore('Password non cambiata: ' + error.message)
    else onFatto()
  }

  return (
    <div className="login">
      <form onSubmit={salva} className="scheda-login">
        <h1>Nuova password</h1>
        <p className="sotto">{NOME_CAF}</p>
        <label>
          Nuova password
          <input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <label>
          Ripeti la password
          <input type="password" autoComplete="new-password" minLength={8} value={conferma} onChange={(e) => setConferma(e.target.value)} required />
        </label>
        <p className="sotto">Almeno 8 caratteri.</p>
        {errore && <p className="errore" role="alert">{errore}</p>}
        <button className="primario" disabled={invio}>{invio ? 'Salvo…' : 'Salva la password'}</button>
      </form>
    </div>
  )
}
