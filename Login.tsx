import { useState } from 'react'
import { supabase, NOME_CAF } from './supabase.js'

export default function Login() {
  const [registra, setRegistra] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [info, setInfo] = useState('')
  const [invio, setInvio] = useState(false)

  async function invia(e) {
    e.preventDefault()
    setInvio(true)
    setErrore('')
    setInfo('')
    if (registra) {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
      if (error) setErrore('Registrazione non riuscita: ' + error.message)
      else if (!data.session) {
        setInfo('Ti abbiamo inviato un\u2019email: aprila e conferma l\u2019indirizzo, poi accedi.')
        setRegistra(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setErrore('Email o password non corrette. Controlla e riprova.')
    }
    setInvio(false)
  }

  return (
    <div className="login">
      <form onSubmit={invia} className="scheda-login">
        <h1>{registra ? 'Crea il tuo account' : 'Accesso operatori'}</h1>
        <p className="sotto">{NOME_CAF}</p>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={registra ? 'new-password' : 'current-password'}
            minLength={registra ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {registra && <p className="sotto">Almeno 8 caratteri. Dopo la registrazione ti servirà il codice di attivazione.</p>}
        {errore && <p className="errore" role="alert">{errore}</p>}
        {info && <p className="esito" role="status">{info}</p>}
        <button className="primario" disabled={invio}>
          {invio ? 'Attendi…' : registra ? 'Registrati' : 'Accedi'}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => { setRegistra(!registra); setErrore(''); setInfo('') }}
        >
          {registra ? 'Ho già un account' : 'Non hai un account? Registrati'}
        </button>
      </form>
    </div>
  )
}
