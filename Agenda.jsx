import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { formattaOra, linkWhatsApp } from './whatsapp.js'

const STATI = ['fissato', 'presente', 'assente', 'annullato']

function fmt(d) {
  const mese = String(d.getMonth() + 1).padStart(2, '0')
  const giorno = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mese}-${giorno}`
}

function oggi() {
  return fmt(new Date())
}

function spostaGiorno(data, delta) {
  const d = new Date(`${data}T12:00`)
  d.setDate(d.getDate() + delta)
  return fmt(d)
}

function inizioSettimana(data) {
  const d = new Date(`${data}T12:00`)
  return spostaGiorno(data, -((d.getDay() + 6) % 7))
}

const SIGLE = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const FORM_VUOTO = { nome: '', cognome: '', telefono: '', prestazione_id: '', ora: '09:00', note: '' }

export default function Agenda({ nomeCaf }) {
  const [giorno, setGiorno] = useState(oggi())
  const [settimana, setSettimana] = useState([])
  const [prestazioni, setPrestazioni] = useState([])
  const [form, setForm] = useState(FORM_VUOTO)
  const [aperto, setAperto] = useState(false)
  const [errore, setErrore] = useState('')
  const [salvataggio, setSalvataggio] = useState(false)

  const lunedi = inizioSettimana(giorno)

  const carica = useCallback(async () => {
    const inizio = new Date(`${lunedi}T00:00`)
    const fine = new Date(`${spostaGiorno(lunedi, 7)}T00:00`)
    const { data, error } = await supabase
      .from('appuntamenti')
      .select('*')
      .gte('data_ora', inizio.toISOString())
      .lt('data_ora', fine.toISOString())
      .order('data_ora')
    if (error) setErrore('Non riesco a caricare gli appuntamenti. Ricarica la pagina.')
    else setSettimana(data)
  }, [lunedi])

  useEffect(() => {
    supabase
      .from('prestazioni')
      .select('*')
      .order('nome')
      .then(({ data }) => setPrestazioni(data || []))
  }, [])

  useEffect(() => {
    carica()
  }, [carica])

  const appuntamenti = settimana.filter((a) => fmt(new Date(a.data_ora)) === giorno)
  const attivi = appuntamenti.filter((a) => a.stato !== 'annullato')
  const conta = (stato) => appuntamenti.filter((a) => a.stato === stato).length
  const fatti = conta('presente') + conta('assente')
  const percentuale = attivi.length ? Math.round((fatti / attivi.length) * 100) : 0
  const eOggi = giorno === oggi()
  const prossimo = eOggi ? attivi.find((a) => a.stato === 'fissato' && new Date(a.data_ora) >= new Date()) : null
  const giorniSettimana = Array.from({ length: 7 }, (_, i) => spostaGiorno(lunedi, i))
  const perGiorno = (g) => settimana.filter((a) => a.stato !== 'annullato' && fmt(new Date(a.data_ora)) === g).length
  const attive = prestazioni.filter((p) => p.attiva)
  const perId = Object.fromEntries(prestazioni.map((p) => [p.id, p]))

  function cambia(campo, valore) {
    setForm((f) => ({ ...f, [campo]: valore }))
  }

  async function salva(e) {
    e.preventDefault()
    setSalvataggio(true)
    setErrore('')
    const { error } = await supabase.from('appuntamenti').insert({
      nome: form.nome.trim(),
      cognome: form.cognome.trim(),
      telefono: form.telefono.trim(),
      prestazione_id: form.prestazione_id,
      data_ora: new Date(`${giorno}T${form.ora}`).toISOString(),
      note: form.note.trim() || null,
    })
    setSalvataggio(false)
    if (error) {
      setErrore('Appuntamento non salvato. Controlla i dati e riprova.')
      return
    }
    setForm({ ...FORM_VUOTO, ora: form.ora })
    setAperto(false)
    carica()
  }

  async function cambiaStato(id, stato) {
    const { error } = await supabase.from('appuntamenti').update({ stato }).eq('id', id)
    if (error) setErrore('Stato non aggiornato. Riprova.')
    else carica()
  }

  async function elimina(a) {
    if (!window.confirm(`Eliminare l'appuntamento di ${a.nome} ${a.cognome}?`)) return
    const { error } = await supabase.from('appuntamenti').delete().eq('id', a.id)
    if (error) setErrore('Appuntamento non eliminato. Riprova.')
    else carica()
  }

  const titoloGiorno = new Date(`${giorno}T12:00`).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <section>
      <div className="riepilogo">
        <div className="conteggio">
          <strong>{attivi.length}</strong>
          <span>
            {attivi.length === 1 ? 'appuntamento' : 'appuntamenti'} {eOggi ? 'oggi' : 'in questo giorno'}
          </span>
        </div>
        <div className="progresso" role="progressbar" aria-valuenow={percentuale} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${percentuale}%` }} />
        </div>
        <div className="chip-stati">
          <span><b>{conta('fissato')}</b> da fare</span>
          <span><b>{conta('presente')}</b> presenti</span>
          <span><b>{conta('assente')}</b> assenti</span>
        </div>
        {prossimo && (
          <p className="prossimo">
            Prossimo: <b>{formattaOra(prossimo.data_ora)}</b> · {prossimo.nome} {prossimo.cognome}
            {perId[prossimo.prestazione_id] ? ` · ${perId[prossimo.prestazione_id].nome}` : ''}
          </p>
        )}
        {attivi.length === 0 && <p className="prossimo">Giornata libera: nessun appuntamento fissato.</p>}
      </div>

      <div className="settimana">
        <button className="icona piccola" onClick={() => setGiorno(spostaGiorno(giorno, -7))} aria-label="Settimana precedente">‹</button>
        <div className="giorni">
          {giorniSettimana.map((g, i) => {
            const n = perGiorno(g)
            return (
              <button
                key={g}
                className={`cella${g === giorno ? ' scelto' : ''}${g === oggi() ? ' oggi' : ''}`}
                onClick={() => setGiorno(g)}
                aria-label={new Date(`${g}T12:00`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
              >
                <small>{SIGLE[i]}</small>
                <b>{Number(g.slice(8))}</b>
                <em>{n > 0 ? n : '·'}</em>
              </button>
            )
          })}
        </div>
        <button className="icona piccola" onClick={() => setGiorno(spostaGiorno(giorno, 7))} aria-label="Settimana successiva">›</button>
      </div>
      <div className="sotto-settimana">
        <span className="titolo-giorno">{titoloGiorno}</span>
        {!eOggi && <button className="link" onClick={() => setGiorno(oggi())}>Torna a oggi</button>}
      </div>

      {errore && <p className="errore" role="alert">{errore}</p>}

      {!aperto ? (
        <button className="primario largo" onClick={() => setAperto(true)}>
          Nuovo appuntamento
        </button>
      ) : (
        <form className="modulo" onSubmit={salva}>
          <h2>Nuovo appuntamento</h2>
          <div className="coppia">
            <label>
              Nome
              <input value={form.nome} onChange={(e) => cambia('nome', e.target.value)} required />
            </label>
            <label>
              Cognome
              <input value={form.cognome} onChange={(e) => cambia('cognome', e.target.value)} required />
            </label>
          </div>
          <label>
            Telefono (WhatsApp)
            <input
              type="tel"
              inputMode="tel"
              placeholder="333 1234567"
              value={form.telefono}
              onChange={(e) => cambia('telefono', e.target.value)}
              required
            />
          </label>
          <label>
            Prestazione
            <select
              value={form.prestazione_id}
              onChange={(e) => cambia('prestazione_id', e.target.value)}
              required
            >
              <option value="">Scegli la prestazione</option>
              {attive.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ora ({titoloGiorno})
            <input type="time" value={form.ora} onChange={(e) => cambia('ora', e.target.value)} required />
          </label>
          <label>
            Note (facoltative)
            <input value={form.note} onChange={(e) => cambia('note', e.target.value)} />
          </label>
          <div className="azioni">
            <button className="primario" disabled={salvataggio}>
              {salvataggio ? 'Salvataggio…' : 'Salva appuntamento'}
            </button>
            <button type="button" className="secondario" onClick={() => setAperto(false)}>
              Annulla
            </button>
          </div>
        </form>
      )}

      {appuntamenti.length === 0 ? (
        <p className="vuoto">Nessun appuntamento in questo giorno. Usa “Nuovo appuntamento” per aggiungerne uno.</p>
      ) : (
        <ul className="elenco">
          {appuntamenti.map((a) => {
            const prest = perId[a.prestazione_id]
            return (
              <li key={a.id} className={`appuntamento stato-${a.stato}`}>
                <div className="riga-alta">
                  <span className="ora">{formattaOra(a.data_ora)}</span>
                  <div className="dati">
                    <strong>
                      {a.nome} {a.cognome}
                    </strong>
                    <span>{prest?.nome}</span>
                    <span className="tel">{a.telefono}</span>
                    {a.note && <span className="nota">{a.note}</span>}
                  </div>
                </div>
                <div className="riga-azioni">
                  <select
                    value={a.stato}
                    onChange={(e) => cambiaStato(a.id, e.target.value)}
                    aria-label="Stato dell'appuntamento"
                  >
                    {STATI.map((s) => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  <a
                    className="whatsapp"
                    href={linkWhatsApp(a, prest, nomeCaf)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Invia promemoria WhatsApp
                  </a>
                  <button className="link pericolo" onClick={() => elimina(a)}>
                    Elimina
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="nota-privacy">
        Gli appuntamenti vengono cancellati automaticamente un giorno dopo la data fissata.
      </p>
    </section>
  )
}
