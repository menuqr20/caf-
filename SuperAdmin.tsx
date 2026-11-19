import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const DURATE = [7, 14, 30, 90, 365]

function stato(l) {
  if (!l.riscattato_il) return { testo: 'Non ancora usato', classe: 'attesa' }
  const scade = new Date(l.scade_il)
  if (scade > new Date()) return { testo: `Attivo fino al ${scade.toLocaleDateString('it-IT')}`, classe: 'attivo' }
  return { testo: `Scaduto il ${scade.toLocaleDateString('it-IT')}`, classe: 'scaduto' }
}

export default function SuperAdmin() {
  const [email, setEmail] = useState('')
  const [giorni, setGiorni] = useState(30)
  const [elenco, setElenco] = useState([])
  const [ultimo, setUltimo] = useState(null)
  const [errore, setErrore] = useState('')
  const [copiato, setCopiato] = useState('')

  async function carica() {
    const { data, error } = await supabase.rpc('elenco_licenze')
    if (error) setErrore('Non riesco a caricare i codici.')
    else setElenco(data)
  }
  useEffect(() => { carica() }, [])

  async function genera(e) {
    e.preventDefault()
    setErrore('')
    const { data, error } = await supabase.rpc('genera_codice', { p_email: email, p_giorni: Number(giorni) })
    if (error) { setErrore('Codice non generato: ' + error.message); return }
    setUltimo({ email: email.trim().toLowerCase(), codice: data, giorni: Number(giorni) })
    setEmail('')
    carica()
  }

  async function copia(testo) {
    try { await navigator.clipboard.writeText(testo); setCopiato(testo); setTimeout(() => setCopiato(''), 1800) } catch { /* ignora */ }
  }

  async function revoca(l) {
    if (!confirm(`Revocare l\u2019accesso a ${l.email}? L\u2019app si bloccherà subito.`)) return
    const { error } = await supabase.rpc('revoca_accesso', { p_user_id: l.user_id })
    if (error) setErrore('Revoca non riuscita.'); else carica()
  }

  async function elimina(l) {
    if (!confirm('Eliminare questo codice mai usato?')) return
    const { error } = await supabase.rpc('elimina_codice', { p_id: l.id })
    if (error) setErrore('Eliminazione non riuscita.'); else carica()
  }

  const messaggio = ultimo
    ? `Ecco il tuo codice di attivazione: ${ultimo.codice}\nValido ${ultimo.giorni} giorni dal momento in cui lo inserisci. Registrati con l\u2019email ${ultimo.email}, poi inserisci il codice.`
    : ''

  return (
    <section>
      <p className="guida">Genera un codice per un’email: l’utente lo inserisce e l’app si sblocca per i giorni scelti.</p>
      {errore && <p className="errore" role="alert">{errore}</p>}

      <form className="modulo" onSubmit={genera}>
        <label>
          Email dell’utente
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Durata (giorni)
          <input type="number" min="1" max="3650" value={giorni} onChange={(e) => setGiorni(e.target.value)} required />
        </label>
        <div className="azioni">
          {DURATE.map((d) => (
            <button type="button" key={d} className={'secondario piccolo' + (Number(giorni) === d ? ' scelto' : '')} onClick={() => setGiorni(d)}>
              {d} gg
            </button>
          ))}
        </div>
        <button className="primario">Genera codice</button>
      </form>

      {ultimo && (
        <div className="modulo codice-nuovo">
          <h2>{ultimo.codice}</h2>
          <p className="sotto">{ultimo.email} · {ultimo.giorni} giorni</p>
          <div className="azioni">
            <button className="secondario" onClick={() => copia(ultimo.codice)}>{copiato === ultimo.codice ? 'Copiato ✓' : 'Copia codice'}</button>
            <button className="secondario" onClick={() => copia(messaggio)}>{copiato === messaggio ? 'Copiato ✓' : 'Copia messaggio'}</button>
          </div>
        </div>
      )}

      <h2 className="titolo-sezione">Codici generati</h2>
      {elenco.length === 0 && <p className="vuoto">Nessun codice ancora.</p>}
      <ul className="elenco">
        {elenco.map((l) => {
          const s = stato(l)
          return (
            <li key={l.id} className={'appuntamento licenza ' + s.classe}>
              <div className="dati">
                <strong>{l.email}</strong>
                <span className="tel">{l.codice} · {l.giorni} giorni</span>
                <span className="nota">{s.testo}</span>
              </div>
              <div className="riga-azioni">
                <button className="link" onClick={() => copia(l.codice)}>{copiato === l.codice ? 'Copiato ✓' : 'Copia'}</button>
                {!l.riscattato_il && <button className="link pericolo" onClick={() => elimina(l)}>Elimina</button>}
                {s.classe === 'attivo' && <button className="link pericolo" onClick={() => revoca(l)}>Revoca accesso</button>}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="nota-privacy">Per prolungare l’accesso genera un nuovo codice per la stessa email: i giorni si sommano.</p>
    </section>
  )
}
