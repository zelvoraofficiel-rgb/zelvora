begin;
alter table public.profiles drop constraint if exists profiles_onboarding_step_check;
alter table public.profiles add constraint profiles_onboarding_step_check check(onboarding_step between 1 and 9);
notify pgrst,'reload schema';
commit;
