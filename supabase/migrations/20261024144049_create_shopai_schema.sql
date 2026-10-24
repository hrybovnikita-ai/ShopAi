/*
# ShopAi E-Commerce Database Schema

1. New Tables
- `products` — Product catalog visible to all visitors (anon + authenticated)
  - id (uuid, PK), name, description, price, image_url, rating, category, stock, features (text[]), created_at
- `contact_messages` — Contact form submissions, owner-scoped to the authenticated user
  - id (uuid, PK), full_name, email, subject, message, user_id (defaults to auth.uid()), created_at

2. Security
- `products`: RLS enabled, SELECT granted to anon+authenticated (public catalog), write to authenticated only
- `contact_messages`: RLS enabled, CRUD granted to authenticated only, owner-scoped via auth.uid()

3. Seed Data
- Inserts 8 sample products across Electronics, Smartphones, Computers, Gaming, Accessories, Smart Home categories
*/

-- Products table (public catalog, readable by everyone)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  image_url text NOT NULL,
  rating numeric(2, 1) NOT NULL DEFAULT 0,
  category text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  features text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON products TO authenticated;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_products" ON products;
CREATE POLICY "auth_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_products" ON products;
CREATE POLICY "auth_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_products" ON products;
CREATE POLICY "auth_delete_products" ON products FOR DELETE
  TO authenticated USING (true);

-- Contact messages table (owner-scoped)
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON contact_messages TO authenticated;

DROP POLICY IF EXISTS "select_own_messages" ON contact_messages;
CREATE POLICY "select_own_messages" ON contact_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_messages" ON contact_messages;
CREATE POLICY "insert_own_messages" ON contact_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_messages" ON contact_messages;
CREATE POLICY "update_own_messages" ON contact_messages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_messages" ON contact_messages;
CREATE POLICY "delete_own_messages" ON contact_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Seed products
INSERT INTO products (name, description, price, image_url, rating, category, stock, features) VALUES
  ('Aurora Wireless Headphones', 'Immersive sound with adaptive noise cancellation and 40-hour battery life.', 199.99, 'https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg?auto=compress&cs=tinysrgb&w=800', 4.8, 'Electronics', 24, ARRAY['Adaptive ANC', '40h Battery', 'Bluetooth 5.3', 'Hi-Res Audio']),
  ('Nebula Pro Smartphone', '6.7-inch AMOLED display, triple-lens 108MP camera, and AI-enhanced photography.', 899.00, 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800', 4.7, 'Smartphones', 15, ARRAY['6.7" AMOLED', '108MP Triple Camera', '5G', 'AI Photography']),
  ('Quantum Gaming Laptop', 'RTX 4070, Intel i9, 32GB RAM — dominates every game at max settings.', 1799.00, 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800', 4.9, 'Computers', 8, ARRAY['RTX 4070', 'Intel i9', '32GB RAM', '240Hz Display']),
  ('Pulse Smartwatch X', 'Health tracking, ECG, blood oxygen, and 7-day battery in a titanium frame.', 349.00, 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800', 4.6, 'Accessories', 30, ARRAY['ECG Sensor', 'SpO2 Monitor', '7-Day Battery', 'Titanium Frame']),
  ('Vortex VR Headset', '4K per-eye resolution, 120Hz refresh, and ultra-wide field of view.', 599.00, 'https://images.pexels.com/photos/3761262/pexels-photo-3761262.jpeg?auto=compress&cs=tinysrgb&w=800', 4.5, 'Gaming', 12, ARRAY['4K Per Eye', '120Hz', '110° FOV', 'Inside-out Tracking']),
  ('EcoFlow Smart Speaker', '360° room-filling sound with built-in voice assistant and smart home hub.', 129.00, 'https://images.pexels.com/photos/1666816/pexels-photo-1666816.jpeg?auto=compress&cs=tinysrgb&w=800', 4.4, 'Smart Home', 40, ARRAY['360° Audio', 'Voice Assistant', 'Smart Home Hub', 'Multi-room']),
  ('Lumina 4K Monitor', '32-inch 4K IPS panel with 99% DCI-P3 color gamut and USB-C 90W charging.', 459.00, 'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=800', 4.7, 'Computers', 18, ARRAY['32" 4K IPS', '99% DCI-P3', 'USB-C 90W', 'HDR400']),
  ('Zenith Mechanical Keyboard', 'Hot-swappable switches, per-key RGB, and CNC aluminum chassis.', 159.00, 'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=800', 4.8, 'Accessories', 35, ARRAY['Hot-swap Switches', 'Per-key RGB', 'Aluminum Chassis', 'USB-C'])
ON CONFLICT DO NOTHING;
