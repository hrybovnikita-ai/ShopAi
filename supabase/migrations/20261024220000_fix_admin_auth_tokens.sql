/*
# Fix the seeded administrator's auth tokens

GoTrue scans `auth.users.confirmation_token`, `recovery_token` and the
email-change/reauthentication token columns into Go strings, so they must not be
NULL — a hand-seeded account with NULLs makes every sign-in fail with
"Database error querying schema". This backfills the empty string GoTrue writes
itself (the unique token indexes only cover non-empty values, so '' is safe).
*/

update auth.users
set confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    email_change = coalesce(email_change, ''),
    email_change_token_current = coalesce(email_change_token_current, ''),
    reauthentication_token = coalesce(reauthentication_token, ''),
    phone_change = coalesce(phone_change, ''),
    phone_change_token = coalesce(phone_change_token, '')
where lower(email) = 'admin@shopai.dev';
