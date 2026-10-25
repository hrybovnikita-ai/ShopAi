/*
# Allow anonymous contact form submissions

1. Changes
- Grant INSERT on contact_messages to anon role
- Add INSERT policy for anon users (no user_id ownership check needed for public contact form)
- Existing authenticated policies remain unchanged

2. Security
- Anon can only INSERT (not SELECT/UPDATE/DELETE) — they can submit but not read messages
- Authenticated users retain full ownership-scoped CRUD
*/

GRANT INSERT ON contact_messages TO anon;

DROP POLICY IF EXISTS "anon_insert_messages" ON contact_messages;
CREATE POLICY "anon_insert_messages" ON contact_messages FOR INSERT
  TO anon WITH CHECK (true);
