/*
# Expand product catalog: brand, discounts, gallery, specs

1. Changes to existing tables
- products: add brand (text, default 'ShopAi'), original_price (numeric, nullable), gallery (text[], nullable), specs (jsonb, nullable)
- These are additive columns — no data loss, existing rows get sensible defaults

2. New tables
- product_reviews — demo customer reviews for product detail pages
  - id, product_id, author, rating, comment, created_at

3. Security
- product_reviews: RLS enabled, SELECT to anon+authenticated (public reviews), INSERT to authenticated only
- No destructive operations

4. Seed data
- Updates existing 8 products with brand, original_price (where discounted), gallery, specs
- Inserts 12 new products across Smartphones, Laptops, Gaming PCs, Graphics Cards, Headphones, Smart Watches, Fashion, Electronics, Accessories
- Inserts demo reviews for top-rated products
*/

-- Additive columns only
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT 'ShopAi';
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price numeric(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '{}'::jsonb;

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  author text NOT NULL,
  rating numeric(2, 1) NOT NULL DEFAULT 5,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON product_reviews TO anon, authenticated;
GRANT INSERT ON product_reviews TO authenticated;

DROP POLICY IF EXISTS "public_read_reviews" ON product_reviews;
CREATE POLICY "public_read_reviews" ON product_reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_reviews" ON product_reviews;
CREATE POLICY "auth_insert_reviews" ON product_reviews FOR INSERT
  TO authenticated WITH CHECK (true);

-- Update existing products with brand, discount, gallery
UPDATE products SET brand = 'Aurora Audio', original_price = 249.99, gallery = ARRAY[
  'https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'
], specs = '{"type": "Over-ear", "connectivity": "Bluetooth 5.3", "battery": "40 hours", "weight": "250g"}'::jsonb
WHERE name = 'Aurora Wireless Headphones';

UPDATE products SET brand = 'Nebula', original_price = 999.00, gallery = ARRAY[
  'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800'
], specs = '{"display": "6.7 AMOLED", "camera": "108MP triple", "chipset": "Nebula X3", "battery": "5000mAh"}'::jsonb
WHERE name = 'Nebula Pro Smartphone';

UPDATE products SET brand = 'Quantum', gallery = ARRAY[
  'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800'
], specs = '{"cpu": "Intel i9-14900K", "gpu": "RTX 4070", "ram": "32GB DDR5", "storage": "1TB NVMe"}'::jsonb
WHERE name = 'Quantum Gaming Laptop';

UPDATE products SET brand = 'Pulse', original_price = 399.00, gallery = ARRAY[
  'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=800'
], specs = '{"display": "1.4 AMOLED", "battery": "7 days", "water_resistance": "5ATM", "sensors": "ECG, SpO2"}'::jsonb
WHERE name = 'Pulse Smartwatch X';

UPDATE products SET brand = 'Vortex', gallery = ARRAY[
  'https://images.pexels.com/photos/3761262/pexels-photo-3761262.jpeg?auto=compress&cs=tinysrgb&w=800'
], specs = '{"resolution": "4K per eye", "refresh_rate": "120Hz", "fov": "110 degrees", "tracking": "Inside-out"}'::jsonb
WHERE name = 'Vortex VR Headset';

UPDATE products SET brand = 'EcoFlow', gallery = ARRAY[
  'https://images.pexels.com/photos/1666816/pexels-photo-1666816.jpeg?auto=compress&cs=tinysrgb&w=800'
], specs = '{"audio": "360 degree", "voice_assistant": "Yes", "smart_home": "Built-in hub"}'::jsonb
WHERE name = 'EcoFlow Smart Speaker';

UPDATE products SET brand = 'Lumina', original_price = 529.00, gallery = ARRAY[
  'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/777002/pexels-photo-777002.jpeg?auto=compress&cs=tinysrgb&w=800'
], specs = '{"size": "32 inch", "resolution": "4K UHD", "panel": "IPS", "color": "99% DCI-P3", "ports": "USB-C 90W"}'::jsonb
WHERE name = 'Lumina 4K Monitor';

UPDATE products SET brand = 'Zenith', gallery = ARRAY[
  'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=800'
], specs = '{"switches": "Hot-swappable", "layout": "75%", "rgb": "Per-key", "build": "CNC Aluminum"}'::jsonb
WHERE name = 'Zenith Mechanical Keyboard';

-- Insert new products
INSERT INTO products (name, brand, description, price, original_price, image_url, gallery, rating, category, stock, features, specs) VALUES
  ('Galaxy Ultra 5G', 'Samsung', '6.8-inch Dynamic AMOLED, 200MP camera, S-Pen included, titanium frame.', 1199.00, 1299.00,
   'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.9, 'Smartphones', 20, ARRAY['200MP Camera','S-Pen','Titanium Frame','5G'], '{"display": "6.8 Dynamic AMOLED", "camera": "200MP", "chipset": "Snapdragon 8 Gen 3", "battery": "5000mAh"}'::jsonb),
  ('iPhone Lightning Pro', 'Apple', '6.3-inch Super Retina XDR, 48MP Pro camera system, A18 Pro chip.', 1099.00, null,
   'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.8, 'Smartphones', 18, ARRAY['48MP Pro Camera','A18 Pro','Face ID','5G'], '{"display": "6.3 Super Retina XDR", "camera": "48MP triple", "chipset": "A18 Pro", "battery": "4400mAh"}'::jsonb),
  ('Pixel Nexus 9', 'Google', '6.4-inch OLED, 50MP camera with AI Magic Eraser, 7 years of updates.', 799.00, 899.00,
   'https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.6, 'Smartphones', 25, ARRAY['50MP AI Camera','Magic Eraser','7-year Updates','5G'], '{"display": "6.4 OLED", "camera": "50MP", "chipset": "Tensor G4", "battery": "4700mAh"}'::jsonb),
  ('Stealth Blade 14', 'Razer', '14-inch QHD+ 165Hz, RTX 4060, AMD Ryzen 9, compact gaming powerhouse.', 1899.00, 2199.00,
   'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.7, 'Laptops', 10, ARRAY['14 QHD+ 165Hz','RTX 4060','Ryzen 9','CNC Aluminum'], '{"cpu": "AMD Ryzen 9 8945HS", "gpu": "RTX 4060", "ram": "16GB DDR5", "storage": "1TB NVMe", "display": "14 QHD+ 165Hz"}'::jsonb),
  ('AeroBook Pro 16', 'Aero', '16-inch Liquid Retina, M4 Pro chip, 36GB RAM, 22-hour battery life.', 2399.00, null,
   'https://images.pexels.com/photos/18105/pexels-photo-18105.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/18105/pexels-photo-18105.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.9, 'Laptops', 7, ARRAY['M4 Pro Chip','16 Liquid Retina','36GB RAM','22h Battery'], '{"cpu": "M4 Pro", "gpu": "18-core GPU", "ram": "36GB", "storage": "1TB SSD", "display": "16 Liquid Retina"}'::jsonb),
  ('TitanForge RTX PC', 'TitanForge', 'RTX 4080 Super, AMD Ryzen 9 7950X3D, 64GB DDR5, liquid cooled.', 2999.00, 3499.00,
   'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.8, 'Gaming PCs', 5, ARRAY['RTX 4080 Super','Ryzen 9 7950X3D','64GB DDR5','Liquid Cooled'], '{"cpu": "AMD Ryzen 9 7950X3D", "gpu": "RTX 4080 Super", "ram": "64GB DDR5", "storage": "2TB NVMe", "cooling": "Liquid"}'::jsonb),
  ('Apex Battlestation', 'Apex', 'RTX 4070 Ti, Intel i7-14700K, 32GB DDR5, RGB tempered glass case.', 1799.00, 1999.00,
   'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.6, 'Gaming PCs', 8, ARRAY['RTX 4070 Ti','Intel i7-14700K','32GB DDR5','RGB Case'], '{"cpu": "Intel i7-14700K", "gpu": "RTX 4070 Ti", "ram": "32GB DDR5", "storage": "1TB NVMe"}'::jsonb),
  ('Viper GeForce RTX 4090', 'NVIDIA', '24GB GDDR6X, 16384 CUDA cores, 450W, triple-fan cooler.', 1599.00, 1799.00,
   'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.9, 'Graphics Cards', 6, ARRAY['24GB GDDR6X','16384 CUDA Cores','450W','Triple Fan'], '{"memory": "24GB GDDR6X", "cores": "16384", "power": "450W", "ray_tracing": "DLSS 3.5"}'::jsonb),
  ('Phantom RTX 4070', 'NVIDIA', '12GB GDDR6X, 5888 CUDA cores, DLSS 3.5, dual-fan design.', 549.00, 599.00,
   'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.7, 'Graphics Cards', 14, ARRAY['12GB GDDR6X','5888 CUDA Cores','DLSS 3.5','Dual Fan'], '{"memory": "12GB GDDR6X", "cores": "5888", "power": "200W", "ray_tracing": "DLSS 3.5"}'::jsonb),
  ('Bass Cannon Pro', 'Aurora Audio', 'Studio-grade wireless headphones, 50mm drivers, LDAC hi-res audio.', 299.00, 349.00,
   'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.8, 'Headphones', 22, ARRAY['50mm Drivers','LDAC Hi-Res','Adaptive ANC','50h Battery'], '{"type": "Over-ear", "drivers": "50mm", "battery": "50 hours", "connectivity": "Bluetooth 5.3 + LDAC"}'::jsonb),
  ('Aura Buds 3', 'Aura', 'True wireless earbuds, active noise cancellation, wireless charging case.', 149.00, 179.00,
   'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.5, 'Headphones', 35, ARRAY['True Wireless','ANC','Wireless Charging','30h Total'], '{"type": "In-ear", "battery": "8h + 22h case", "anc": "Active", "charging": "Wireless"}'::jsonb),
  ('Pulse Fit 2', 'Pulse', 'Fitness smartwatch, GPS, heart rate, SpO2, sleep tracking, 10-day battery.', 229.00, 279.00,
   'https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.6, 'Smart Watches', 28, ARRAY['Built-in GPS','Heart Rate','SpO2','10-Day Battery'], '{"display": "1.3 AMOLED", "battery": "10 days", "gps": "Dual-band", "water": "5ATM"}'::jsonb),
  ('TechFlex Hoodie', 'TechFlex', 'Smart heated hoodie with built-in charging pocket and earbud loops.', 89.00, 119.00,
   'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.3, 'Fashion', 50, ARRAY['Heated Lining','USB Charging Pocket','Earbud Loops','Water Resistant'], '{"material": "Polyester blend", "heating": "3 levels", "battery": "USB-C power bank (not included)"}'::jsonb),
  ('NebulaBuds Max', 'Nebula', 'Premium over-ear, spatial audio, adaptive transparency mode.', 349.00, 399.00,
   'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.7, 'Headphones', 16, ARRAY['Spatial Audio','Adaptive Transparency','40h Battery','USB-C'], '{"type": "Over-ear", "features": "Spatial audio, transparency", "battery": "40 hours", "connectivity": "Bluetooth 5.3"}'::jsonb),
  ('Glide Mouse Pro', 'Glide', 'Wireless ergonomic mouse, 8000 DPI, 70-hour battery, USB-C fast charge.', 79.00, 99.00,
   'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.5, 'Accessories', 45, ARRAY['8000 DPI','70h Battery','USB-C','Ergonomic'], '{"dpi": "8000", "battery": "70 hours", "connectivity": "2.4GHz + Bluetooth", "weight": "85g"}'::jsonb),
  ('ChargeDeck 4-in-1', 'ChargeDeck', '4-in-1 wireless charging station for phone, watch, earbuds, and pen.', 119.00, 149.00,
   'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800',
   ARRAY['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800'],
   4.4, 'Accessories', 38, ARRAY['4-in-1 Charging','Qi Fast Charge','LED Indicators','Foldable'], '{"ports": "4 wireless + 1 USB-C", "power": "15W per device", "compatibility": "Qi-enabled"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert demo reviews (clearly fictional)
INSERT INTO product_reviews (product_id, author, rating, comment) VALUES
  ((SELECT id FROM products WHERE name = 'Aurora Wireless Headphones' LIMIT 1), 'Sarah M.', 5, 'Best headphones I have ever owned. The noise cancellation is incredible and battery lasts forever. (Demo review)'),
  ((SELECT id FROM products WHERE name = 'Aurora Wireless Headphones' LIMIT 1), 'James K.', 4, 'Great sound quality but a bit tight on the ears after long sessions. (Demo review)'),
  ((SELECT id FROM products WHERE name = 'Quantum Gaming Laptop' LIMIT 1), 'Mike T.', 5, 'Absolutely destroys every game at max settings. Worth every penny. (Demo review)'),
  ((SELECT id FROM products WHERE name = 'Pulse Smartwatch X' LIMIT 1), 'Emma L.', 4, 'Love the health tracking features. Battery really does last a week. (Demo review)'),
  ((SELECT id FROM products WHERE name = 'Galaxy Ultra 5G' LIMIT 1), 'David R.', 5, 'The 200MP camera is mind-blowing. S-Pen is super useful. (Demo review)'),
  ((SELECT id FROM products WHERE name = 'iPhone Lightning Pro' LIMIT 1), 'Lisa P.', 5, 'A18 Pro chip is incredibly fast. Camera system is professional grade. (Demo review)'),
  ((SELECT id FROM products WHERE name = 'Viper GeForce RTX 4090' LIMIT 1), 'Alex G.', 5, 'Handles 4K gaming at 120fps without breaking a sweat. (Demo review)'),
  ((SELECT id FROM products WHERE name = 'Zenith Mechanical Keyboard' LIMIT 1), 'Chris W.', 5, 'The hot-swappable switches are a game changer. Premium build quality. (Demo review)')
ON CONFLICT DO NOTHING;
