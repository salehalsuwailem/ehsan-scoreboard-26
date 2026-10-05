-- The three public RPC wrappers (claim_first_manager, submit_staff_access_request,
-- review_staff_access_request) were SECURITY INVOKER (the default — no SECURITY
-- DEFINER keyword was present). Each one's only job is to call a matching
-- private.*_impl() function, but a SECURITY INVOKER wrapper executes its body as
-- the CALLING role. The `authenticated` role never held USAGE on schema `private`
-- nor EXECUTE on the private impl functions (only `postgres` did), so any real
-- signed-in user calling these RPCs hit `ERROR 42501: permission denied for
-- schema private` — a confirmed, production-blocking bug: the entire
-- first-manager-claim / supervisor-request / approval flow was unusable by any
-- real user. Marking the wrappers SECURITY DEFINER makes them run with the
-- defining role's privileges, restoring the intended privilege chain down into
-- the private impl functions, which already enforce their own authorization
-- (is_manager() checks, etc.) and already pin search_path.
alter function public.claim_first_manager() security definer;
alter function public.claim_first_manager() volatile;
alter function public.submit_staff_access_request(uuid, text) security definer;
alter function public.submit_staff_access_request(uuid, text) volatile;
alter function public.review_staff_access_request(uuid, text, uuid) security definer;
alter function public.review_staff_access_request(uuid, text, uuid) volatile;
