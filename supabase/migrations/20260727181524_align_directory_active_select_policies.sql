drop policy "contractors_select_owner_or_admin" on public.contractors;

create policy "contractors_select_owner_or_admin"
on public.contractors
for select
to authenticated
using (
  (select auth.uid()) is not null
  and deleted_at is null
  and (
    owner_id = (select auth.uid())
    or (select public.is_current_user_admin())
  )
);

drop policy "workers_select_owner_or_admin" on public.workers;

create policy "workers_select_owner_or_admin"
on public.workers
for select
to authenticated
using (
  (select auth.uid()) is not null
  and deleted_at is null
  and (
    owner_id = (select auth.uid())
    or (select public.is_current_user_admin())
  )
);
