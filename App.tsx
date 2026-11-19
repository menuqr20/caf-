import { useCallback, useEffect, useState } from 'react'
import { supabase, nomeCafDi, registraVisita } from './supabase.js'
import Login from './Login.tsx'
import Licenza from './Licenza.tsx'
import NuovaPassword from './NuovaPassword.tsx'
import Agenda from './Agenda.jsx'
import Prestazioni from './Prestazioni.jsx'
import SuperAdmin from './SuperAdmin.tsx'
import Impostazioni from './Impostazioni.tsx'

export default function App() {
  const [sessione, setSessione] = useState(undefined)
  const [licenza, setLicenza] = useState(undefined)
  const [recupero, setRecupero] = useState(false)
  const [pagina, setPagina] = useState('agenda')

  const caricaLicenza = useCallback(async () => {
    const { data, error } = await supabase.rpc('stato_licenza')
    setLicenza(error ? { attiva: false, errore: true } : data)
  }, [])

  useEffect(() => { registraVisita() }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessione(data.session))
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecupero(true)
      setSessione(s)
    })
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

  if (recupero) return <NuovaPassword onFatto={() => setRecupero(false)} />
  if (sessione === undefined) return <p className="caricamento">Caricamento…</p>
  if (!sessione) return <Login />
  if (licenza === undefined) return <p className="caricamento">Caricamento…</p>
  if (!licenza.attiva) return <Licenza stato={licenza} onAttivata={caricaLicenza} />

  const admin = licenza.super_admin
  const nomeCaf = nomeCafDi(sessione)

  return (
    <div className="app">
      <header className="testata">
        <div>
          <p className="data-oggi">{new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1>{admin ? 'Gestionale' : 'Appuntamenti'}</h1>
          <p className="sotto">
            {admin ? 'Super admin' : nomeCaf}
            {!admin && licenza.scade_il && ` · attivo fino al ${new Date(licenza.scade_il).toLocaleDateString('it-IT')}`}
          </p>
        </div>
        <button className="link" onClick={() => supabase.auth.signOut()}>
          Esci
        </button>
      </header>

      {admin ? (
        <main><SuperAdmin /></main>
      ) : (
        <>
          <nav className="schede" style={{ '--n': 3, '--i': pagina === 'agenda' ? 0 : pagina === 'prestazioni' ? 1 : 2 }} aria-label="Sezioni">
            <button className={pagina === 'agenda' ? 'attiva' : ''} onClick={() => setPagina('agenda')}>Agenda</button>
            <button className={pagina === 'prestazioni' ? 'attiva' : ''} onClick={() => setPagina('prestazioni')}>Prestazioni</button>
            <button className={pagina === 'impostazioni' ? 'attiva' : ''} onClick={() => setPagina('impostazioni')}>Il mio CAF</button>
          </nav>
          <main>{pagina === 'agenda' ? <Agenda nomeCaf={nomeCaf} /> : pagina === 'prestazioni' ? <Prestazioni /> : <Impostazioni nomeCaf={nomeCaf} />}</main>
        </>
      )}
    </div>
  )
}
