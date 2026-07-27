drop policy if exists "clients_select_owner_or_admin"
on public.clients;

create policy "clients_select_owner_or_admin"
on public.clients
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    owner_id = (select auth.uid())
    or (select public.is_current_user_admin())
  )
);
