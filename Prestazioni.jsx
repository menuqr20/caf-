import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

function Riga({ prestazione, onCambiato }) {
  const [nome, setNome] = useState(prestazione.nome)
  const [documenti, setDocumenti] = useState(prestazione.documenti.join('\n'))
  const [attiva, setAttiva] = useState(prestazione.attiva)
  const [messaggio, setMessaggio] = useState('')

  async function salva() {
    const elenco = documenti
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean)
    const { error } = await supabase
      .from('prestazioni')
      .update({ nome: nome.trim(), documenti: elenco, attiva })
      .eq('id', prestazione.id)
    setMessaggio(error ? 'Non salvato. Riprova.' : 'Salvato.')
    if (!error) onCambiato()
  }

  async function elimina() {
    if (!window.confirm(`Eliminare la prestazione “${prestazione.nome}”?`)) return
    const { error } = await supabase.from('prestazioni').delete().eq('id', prestazione.id)
    if (error) {
      setMessaggio('Ci sono appuntamenti con questa prestazione. Disattivala invece di eliminarla.')
    } else {
      onCambiato()
    }
  }

  return (
    <li className="modulo prestazione">
      <label>
        Nome della prestazione
        <input value={nome} onChange={(e) => setNome(e.target.value)} />
      </label>
      <label>
        Documenti da portare (uno per riga)
        <textarea rows={6} value={documenti} onChange={(e) => setDocumenti(e.target.value)} />
      </label>
      <label className="spunta">
        <input type="checkbox" checked={attiva} onChange={(e) => setAttiva(e.target.checked)} />
        Disponibile per nuovi appuntamenti
      </label>
      <div className="azioni">
        <button className="primario" onClick={salva}>
          Salva modifiche
        </button>
        <button className="link pericolo" onClick={elimina}>
          Elimina
        </button>
      </div>
      {messaggio && <p className="esito" role="status">{messaggio}</p>}
    </li>
  )
}

export default function Prestazioni() {
  const [elenco, setElenco] = useState([])
  const [nuovo, setNuovo] = useState('')
  const [errore, setErrore] = useState('')

  async function carica() {
    const { data, error } = await supabase.from('prestazioni').select('*').order('nome')
    if (error) setErrore('Non riesco a caricare le prestazioni. Ricarica la pagina.')
    else setElenco(data)
  }

  useEffect(() => {
    carica()
  }, [])

  async function aggiungi(e) {
    e.preventDefault()
    const { error } = await supabase.from('prestazioni').insert({ nome: nuovo.trim(), documenti: [] })
    if (error) {
      setErrore('Prestazione non aggiunta. Riprova.')
      return
    }
    setNuovo('')
    carica()
  }

  return (
    <section>
      <p className="guida">
        I documenti elencati qui vengono inseriti nel messaggio WhatsApp inviato al cliente.
      </p>
      {errore && <p className="errore" role="alert">{errore}</p>}

      <form className="modulo" onSubmit={aggiungi}>
        <label>
          Nuova prestazione
          <input value={nuovo} onChange={(e) => setNuovo(e.target.value)} placeholder="Ad esempio: Successione" required />
        </label>
        <button className="primario">Aggiungi prestazione</button>
      </form>

      <ul className="elenco">
        {elenco.map((p) => (
          <Riga key={p.id} prestazione={p} onCambiato={carica} />
        ))}
      </ul>
    </section>
  )
}
