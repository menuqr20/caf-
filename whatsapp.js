// Porta il numero nel formato richiesto da wa.me (solo cifre, con prefisso).
export function normalizzaTelefono(tel) {
  const grezzo = tel.trim()
  const cifre = grezzo.replace(/\D/g, '')
  if (grezzo.startsWith('+')) return cifre
  if (cifre.startsWith('00')) return cifre.slice(2)
  if (cifre.startsWith('39') && cifre.length >= 12) return cifre
  return '39' + cifre
}

export function formattaData(iso) {
  return new Date(iso).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formattaOra(iso) {
  return new Date(iso).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function creaMessaggio(app, prestazione, nomeCaf) {
  const documenti = (prestazione?.documenti || []).map((d) => `- ${d}`).join('\n')
  const blocco = documenti
    ? `Documenti da portare:\n${documenti}\n\n`
    : ''
  return (
    `Buongiorno ${app.nome},\n` +
    `le confermiamo il suo appuntamento per ${prestazione?.nome || 'la sua pratica'} ` +
    `${formattaData(app.data_ora)} alle ${formattaOra(app.data_ora)}.\n\n` +
    blocco +
    `Se non può venire, la preghiamo di avvisarci.\n` +
    `A presto, ${nomeCaf}`
  )
}

export function linkWhatsApp(app, prestazione, nomeCaf) {
  const testo = encodeURIComponent(creaMessaggio(app, prestazione, nomeCaf))
  return `https://wa.me/${normalizzaTelefono(app.telefono)}?text=${testo}`
}
