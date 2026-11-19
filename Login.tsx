import { useState } from 'react'
import { supabase, NOME_CAF } from './supabase.js'

export default function Login() {
  const [modo, setModo] = useState('accedi') // accedi | registra | recupero
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [info, setInfo] = useState('')
  const [invio, setInvio] = useState(false)

  function cambia(nuovo) {
    setModo(nuovo)
    setErrore('')
    setInfo('')
  }

  async function invia(e) {
    e.preventDefault()
    setInvio(true)
    setErrore('')
    setInfo('')
    if (modo === 'recupero') {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      })
      if (error) setErrore('Non sono riuscito a inviare l’email. Riprova tra qualche minuto.')
      else setInfo('Se l’indirizzo è registrato, riceverai un’email con il link per scegliere una nuova password.')
    } else if (modo === 'registra') {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
      if (error) setErrore('Registrazione non riuscita: ' + error.message)
      else if (!data.session) {
        setInfo('Ti abbiamo inviato un’email: aprila e conferma l’indirizzo, poi accedi.')
        setModo('accedi')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setErrore('Email o password non corrette. Controlla e riprova.')
    }
    setInvio(false)
  }

  const titolo = modo === 'registra' ? 'Crea il tuo account' : modo === 'recupero' ? 'Password dimenticata' : 'Accesso operatori'
  const bottone = modo === 'registra' ? 'Registrati' : modo === 'recupero' ? 'Invia il link' : 'Accedi'

  return (
    <div className="login">
      <form onSubmit={invia} className="scheda-login">
        <h1>{titolo}</h1>
        <p className="sotto">{NOME_CAF}</p>
        {modo === 'recupero' && (
          <p className="sotto">Scrivi la tua email: ti mandiamo un link per scegliere una nuova password.</p>
        )}
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
        {modo !== 'recupero' && (
          <label>
            Password
            <input
              type="password"
              autoComplete={modo === 'registra' ? 'new-password' : 'current-password'}
              minLength={modo === 'registra' ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        )}
        {modo === 'registra' && <p className="sotto">Almeno 8 caratteri. Dopo la registrazione ti servirà il codice di attivazione.</p>}
        {errore && <p className="errore" role="alert">{errore}</p>}
        {info && <p className="esito" role="status">{info}</p>}
        <button className="primario" disabled={invio}>
          {invio ? 'Attendi…' : bottone}
        </button>
        {modo === 'accedi' && (
          <button type="button" className="link" onClick={() => cambia('recupero')}>
            Hai dimenticato la password?
          </button>
        )}
        <button type="button" className="link" onClick={() => cambia(modo === 'accedi' ? 'registra' : 'accedi')}>
          {modo === 'accedi' ? 'Non hai un account? Registrati' : 'Torna all’accesso'}
        </button>
      </form>
    </div>
  )
}
