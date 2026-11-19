# Appuntamenti CAF

App per gli operatori: agenda appuntamenti, promemoria WhatsApp con i documenti
da portare e pannello per gestire prestazioni e documenti.

- Frontend: Vite + React
- Backend: Supabase (login operatori, database)

Il file `.env` contiene URL e chiave pubblica del progetto Supabase.
Ogni operatore sceglie il nome del proprio CAF in registrazione (modificabile da "Il mio CAF"):
compare nel messaggio WhatsApp. `VITE_NOME_CAF` resta solo come nome di riserva.

## Contatore visite

Esegui `supabase-visite.sql` nel SQL Editor di Supabase. Le visite si vedono solo nel pannello super admin.

## Licenze e codici di attivazione

Esegui `supabase-licenze.sql` nel SQL Editor di Supabase. Dopo esserti registrato, rendi il tuo account super admin
(vedi istruzioni date in chat). Dal tab "Super admin" generi i codici per email e durata.
