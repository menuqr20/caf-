import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const DURATE = [7, 14, 30, 90, 365]
const data = (d) => new Date(d).toLocaleDateString('it-IT')

function statoCliente(c) {
  if (!c.scade_il) return { testo: 'Mai attivato', classe: 'attesa' }
  const scade = new Date(c.scade_il)
  const giorni = Math.ceil((scade - new Date()) / 86400000)
  if (giorni > 0) return { testo: `Attivo fino al ${data(scade)} (${giorni} ${giorni === 1 ? 'giorno' : 'giorni'})`, classe: 'attivo' }
  return { testo: `Scaduto il ${data(scade)}`, classe: 'scaduto' }
}

function statoCodice(l) {
  if (!l.riscattato_il) return { testo: 'Non ancora usato', classe: 'attesa' }
  const scade = new Date(l.scade_il)
  if (scade > new Date()) return { testo: `Attivo fino al ${data(scade)}`, classe: 'attivo' }
  return { testo: `Scaduto il ${data(scade)}`, classe: 'scaduto' }
}

export default function SuperAdmin() {
  const [clienti, setClienti] = useState([])
  const [scelto, setScelto] = useState('')
  const [giorni, setGiorni] = useState(30)
  const [esito, setEsito] = useState('')
  const [errore, setErrore] = useState('')

  const [email, setEmail] = useState('')
  const [giorniCodice, setGiorniCodice] = useState(30)
  const [codici, setCodici] = useState([])
  const [ultimo, setUltimo] = useState(null)
  const [copiato, setCopiato] = useState('')
  const [visite, setVisite] = useState(null)
  const [visiteNonPronte, setVisiteNonPronte] = useState(false)

  async function caricaClienti() {
    const { data: righe, error } = await supabase.rpc('elenco_clienti')
    if (error) setErrore('Non riesco a caricare i clienti.')
    else setClienti(righe.filter((c) => !c.super_admin))
  }
  async function caricaCodici() {
    const { data: righe, error } = await supabase.rpc('elenco_licenze')
    if (error) setErrore('Non riesco a caricare i codici.')
    else setCodici(righe)
  }
  async function caricaVisite() {
    const { data: r, error } = await supabase.rpc('statistiche_visite')
    if (error) setVisiteNonPronte(true)
    else { setVisite(r); setVisiteNonPronte(false) }
  }
  async function ricarica() {
    await Promise.all([caricaClienti(), caricaCodici(), caricaVisite()])
  }
  useEffect(() => { ricarica() }, [])

  const cliente = clienti.find((c) => c.user_id === scelto)

  async function imposta(aggiungi, n = Number(giorni)) {
    setErrore(''); setEsito('')
    const { data: scade, error } = await supabase.rpc('imposta_licenza', {
      p_user_id: scelto, p_giorni: n, p_aggiungi: aggiungi,
    })
    if (error) { setErrore('Operazione non riuscita: ' + error.message); return }
    setEsito(n === 0 && !aggiungi ? 'Accesso bloccato.' : `Fatto: ora è attivo fino al ${data(scade)}.`)
    ricarica()
  }

  async function blocca() {
    if (!confirm(`Bloccare subito l’accesso a ${cliente.email}?`)) return
    imposta(false, 0)
  }

  async function elimina() {
    if (!confirm(`Eliminare il profilo di ${cliente.email}? L’account sparisce e non si può annullare.`)) return
    setErrore(''); setEsito('')
    const { error } = await supabase.rpc('elimina_utente', { p_user_id: scelto })
    if (error) { setErrore('Eliminazione non riuscita: ' + error.message); return }
    setScelto('')
    setEsito('Profilo eliminato.')
    ricarica()
  }

  async function genera(e) {
    e.preventDefault()
    setErrore('')
    const { data: codice, error } = await supabase.rpc('genera_codice', { p_email: email, p_giorni: Number(giorniCodice) })
    if (error) { setErrore('Codice non generato: ' + error.message); return }
    setUltimo({ email: email.trim().toLowerCase(), codice, giorni: Number(giorniCodice) })
    setEmail('')
    caricaCodici()
  }

  async function copia(testo) {
    try { await navigator.clipboard.writeText(testo); setCopiato(testo); setTimeout(() => setCopiato(''), 1800) } catch { /* ignora */ }
  }

  async function eliminaCodice(l) {
    if (!confirm('Eliminare questo codice mai usato?')) return
    const { error } = await supabase.rpc('elimina_codice', { p_id: l.id })
    if (error) setErrore('Eliminazione non riuscita.'); else caricaCodici()
  }

  const messaggio = ultimo
    ? `Ecco il tuo codice di attivazione: ${ultimo.codice}\nValido ${ultimo.giorni} giorni dal momento in cui lo inserisci. Registrati con l’email ${ultimo.email}, poi inserisci il codice.`
    : ''

  const stato = cliente ? statoCliente(cliente) : null

  return (
    <section>
      {errore && <p className="errore" role="alert">{errore}</p>}
      {esito && <p className="esito" role="status">{esito}</p>}

      <h2 className="titolo-sezione">Visite al sito</h2>
      {visiteNonPronte && (
        <p className="guida">Contatore non ancora attivo: esegui il file <code>supabase-visite.sql</code> nel SQL Editor di Supabase.</p>
      )}
      {visite && (
        <div className="modulo">
          <div className="statistiche">
            <div><strong>{visite.oggi}</strong><span>Oggi</span></div>
            <div><strong>{visite.ultimi_7}</strong><span>Ultimi 7 giorni</span></div>
            <div><strong>{visite.ultimi_30}</strong><span>Ultimi 30 giorni</span></div>
            <div><strong>{visite.totale}</strong><span>Totale visite</span></div>
            <div><strong>{visite.visitatori}</strong><span>Visitatori diversi</span></div>
          </div>
          <div className="barre" aria-label="Visite degli ultimi 14 giorni">
            {visite.giorni.map((g) => {
              const max = Math.max(1, ...visite.giorni.map((x) => x.visite))
              return (
                <div key={g.giorno} className="barra" title={`${data(g.giorno)}: ${g.visite}`}>
                  <i style={{ height: `${(g.visite / max) * 100}%` }} />
                </div>
              )
            })}
          </div>
          <p className="sotto">Una visita = una volta che qualcuno apre il sito (conteggiata una volta per sessione del browser).</p>
          <button type="button" className="link" onClick={caricaVisite}>Aggiorna</button>
        </div>
      )}

      <h2 className="titolo-sezione">Clienti</h2>
      <div className="modulo">
        <label>
          Scegli il cliente
          <select value={scelto} onChange={(e) => { setScelto(e.target.value); setEsito(''); setErrore('') }}>
            <option value="">— Scegli un cliente —</option>
            {clienti.map((c) => (
              <option key={c.user_id} value={c.user_id}>{c.email} · {statoCliente(c).classe === 'attivo' ? 'attivo' : statoCliente(c).classe === 'scaduto' ? 'scaduto' : 'da attivare'}</option>
            ))}
          </select>
        </label>
        {clienti.length === 0 && <p className="sotto">Nessun cliente registrato ancora.</p>}

        {cliente && (
          <>
            <div className={'appuntamento licenza ' + stato.classe}>
              <div className="dati">
                <strong>{cliente.email}</strong>
                <span className="tel">{stato.testo}</span>
                <span className="nota">
                  Registrato il {data(cliente.registrato_il)}
                  {cliente.ultimo_accesso && ` · ultimo accesso ${data(cliente.ultimo_accesso)}`}
                </span>
              </div>
            </div>

            <label>
              Giorni di licenza
              <input type="number" min="0" max="3650" value={giorni} onChange={(e) => setGiorni(e.target.value)} />
            </label>
            <div className="azioni">
              {DURATE.map((d) => (
                <button type="button" key={d} className={'secondario piccolo' + (Number(giorni) === d ? ' scelto' : '')} onClick={() => setGiorni(d)}>
                  {d} gg
                </button>
              ))}
            </div>
            <button className="primario" onClick={() => imposta(false)}>Imposta {giorni} giorni da oggi</button>
            <button className="secondario" onClick={() => imposta(true)}>Aggiungi {giorni} giorni a quelli rimasti</button>
            <div className="azioni">
              <button className="link pericolo" onClick={blocca}>Blocca ora</button>
              <button className="link pericolo" onClick={elimina}>Elimina profilo</button>
            </div>
          </>
        )}
      </div>

      <h2 className="titolo-sezione">Codici di attivazione</h2>
      <p className="guida">Alternativa: generi un codice per un’email e il cliente lo inserisce da solo.</p>
      <form className="modulo" onSubmit={genera}>
        <label>
          Email del cliente
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Durata (giorni)
          <input type="number" min="1" max="3650" value={giorniCodice} onChange={(e) => setGiorniCodice(e.target.value)} required />
        </label>
        <div className="azioni">
          {DURATE.map((d) => (
            <button type="button" key={d} className={'secondario piccolo' + (Number(giorniCodice) === d ? ' scelto' : '')} onClick={() => setGiorniCodice(d)}>
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

      <ul className="elenco">
        {codici.map((l) => {
          const s = statoCodice(l)
          return (
            <li key={l.id} className={'appuntamento licenza ' + s.classe}>
              <div className="dati">
                <strong>{l.email}</strong>
                <span className="tel">{l.codice} · {l.giorni} giorni</span>
                <span className="nota">{s.testo}</span>
              </div>
              <div className="riga-azioni">
                <button className="link" onClick={() => copia(l.codice)}>{copiato === l.codice ? 'Copiato ✓' : 'Copia'}</button>
                {!l.riscattato_il && <button className="link pericolo" onClick={() => eliminaCodice(l)}>Elimina</button>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
