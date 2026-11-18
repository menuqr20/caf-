import { useState } from 'react'
import { supabase, NOME_CAF } from './supabase.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [invio, setInvio] = useState(false)

  async function accedi(e) {
    e.preventDefault()
    setInvio(true)
    setErrore('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrore('Email o password non corrette. Controlla e riprova.')
    setInvio(false)
  }

  return (
    <div className="login">
      <form onSubmit={accedi} className="scheda-login">
        <h1>Accesso operatori</h1>
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {errore && <p className="errore" role="alert">{errore}</p>}
        <button className="primario" disabled={invio}>
          {invio ? 'Accesso in corso…' : 'Accedi'}
        </button>
      </form>
    </div>
  )
}
