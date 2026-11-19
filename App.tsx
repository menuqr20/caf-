import { useCallback, useEffect, useState } from 'react'
import { supabase, NOME_CAF } from './supabase.js'
import Login from './Login.jsx'
import Licenza from './Licenza.jsx'
import Agenda from './Agenda.jsx'
import Prestazioni from './Prestazioni.jsx'
import SuperAdmin from './SuperAdmin.jsx'

export default function App() {
  const [sessione, setSessione] = useState(undefined)
  const [licenza, setLicenza] = useState(undefined)
  const [pagina, setPagina] = useState('agenda')

  const caricaLicenza = useCallback(async () => {
    const { data, error } = await supabase.rpc('stato_licenza')
    setLicenza(error ? { attiva: false, errore: true } : data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessione(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSessione(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // controlla la licenza al login, quando torni sull'app e ogni minuto
  useEffect(() => {
    if (!sessione) { setLicenza(undefined); return }
    caricaLicenza()
    const ogniMinuto = setInterval(caricaLicenza, 60000)
    const alRitorno = () => document.visibilityState === 'visible' && caricaLicenza()
    document.addEventListener('visibilitychange', alRitorno)
    return () => { clearInterval(ogniMinuto); document.removeEventListener('visibilitychange', alRitorno) }
  }, [sessione, caricaLicenza])

  if (sessione === undefined) return <p className="caricamento">Caricamento…</p>
  if (!sessione) return <Login />
  if (licenza === undefined) return <p className="caricamento">Caricamento…</p>
  if (!licenza.attiva) return <Licenza stato={licenza} onAttivata={caricaLicenza} />

  const schede = [
    ['agenda', 'Agenda'],
    ['prestazioni', 'Prestazioni e documenti'],
    ...(licenza.super_admin ? [['admin', 'Super admin']] : []),
  ]
  const indice = Math.max(0, schede.findIndex(([id]) => id === pagina))

  return (
    <div className="app">
      <header className="testata">
        <div>
          <p className="data-oggi">{new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1>Appuntamenti</h1>
          <p className="sotto">
            {NOME_CAF}
            {!licenza.super_admin && licenza.scade_il && ` · attivo fino al ${new Date(licenza.scade_il).toLocaleDateString('it-IT')}`}
          </p>
        </div>
        <button className="link" onClick={() => supabase.auth.signOut()}>
          Esci
        </button>
      </header>

      <nav className="schede" style={{ '--n': schede.length, '--i': indice }} aria-label="Sezioni">
        {schede.map(([id, nome]) => (
          <button key={id} className={pagina === id ? 'attiva' : ''} onClick={() => setPagina(id)}>
            {nome}
          </button>
        ))}
      </nav>

      <main>
        {pagina === 'agenda' && <Agenda />}
        {pagina === 'prestazioni' && <Prestazioni />}
        {pagina === 'admin' && licenza.super_admin && <SuperAdmin />}
      </main>
    </div>
  )
}
