import { useEffect, useState } from 'react'
import { supabase, NOME_CAF } from './supabase.js'
import Login from './Login.jsx'
import Agenda from './Agenda.jsx'
import Prestazioni from './Prestazioni.jsx'

export default function App() {
  const [sessione, setSessione] = useState(undefined)
  const [pagina, setPagina] = useState('agenda')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessione(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSessione(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (sessione === undefined) return <p className="caricamento">Caricamento…</p>
  if (!sessione) return <Login />

  return (
    <div className="app">
      <header className="testata">
        <div>
          <h1>Appuntamenti</h1>
          <p className="sotto">{NOME_CAF}</p>
        </div>
        <button className="link" onClick={() => supabase.auth.signOut()}>
          Esci
        </button>
      </header>

      <nav className="schede" data-pagina={pagina} aria-label="Sezioni">
        <button
          className={pagina === 'agenda' ? 'attiva' : ''}
          onClick={() => setPagina('agenda')}
        >
          Agenda
        </button>
        <button
          className={pagina === 'prestazioni' ? 'attiva' : ''}
          onClick={() => setPagina('prestazioni')}
        >
          Prestazioni e documenti
        </button>
      </nav>

      <main>{pagina === 'agenda' ? <Agenda /> : <Prestazioni />}</main>
    </div>
  )
}
