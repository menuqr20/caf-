-- Contatore visite (solo super admin lo può leggere).
-- Esegui questo file nel SQL Editor del progetto Supabase dell'app CAF.

create table if not exists public.visite (
  visitatore text not null check (length(visitatore) between 8 and 64),
  giorno date not null default (now() at time zone 'Europe/Rome')::date,
  aperture integer not null default 1,
  primary key (visitatore, giorno)
);

-- Nessun accesso diretto alla tabella: si passa solo dalle funzioni qui sotto.
alter table public.visite enable row level security;
revoke all on public.visite from anon, authenticated;

-- Chiamata da chiunque apra il sito (anche senza login).
create or replace function public.registra_visita(p_visitatore text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.visite (visitatore)
  values (left(p_visitatore, 64))
  on conflict (visitatore, giorno) do update set aperture = visite.aperture + 1;
$$;
grant execute on function public.registra_visita(text) to anon, authenticated;

-- Solo super admin: usa lo stesso controllo già usato dall'app (stato_licenza).
create or replace function public.statistiche_visite()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  oggi date := (now() at time zone 'Europe/Rome')::date;
  e_admin boolean;
begin
  e_admin := coalesce((public.stato_licenza() ->> 'super_admin')::boolean, false);
  if not e_admin then
    raise exception 'non autorizzato';
  end if;

  return jsonb_build_object(
    'totale',      coalesce((select sum(aperture) from visite), 0),
    'visitatori',  (select count(distinct visitatore) from visite),
    'oggi',        coalesce((select sum(aperture) from visite where giorno = oggi), 0),
    'ultimi_7',    coalesce((select sum(aperture) from visite where giorno > oggi - 7), 0),
    'ultimi_30',   coalesce((select sum(aperture) from visite where giorno > oggi - 30), 0),
    'giorni', coalesce((
      select jsonb_agg(jsonb_build_object('giorno', g::date, 'visite', coalesce(v.n, 0)) order by g)
      from generate_series(oggi - 13, oggi, interval '1 day') g
      left join (select giorno, sum(aperture) n from visite group by giorno) v on v.giorno = g::date
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.statistiche_visite() from public, anon;
grant execute on function public.statistiche_visite() to authenticated;
