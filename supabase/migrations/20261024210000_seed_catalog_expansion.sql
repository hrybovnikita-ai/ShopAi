/*
# Catalog expansion for the discovery experience

Adds a handful of realistic products (lightweight laptops, a camera phone and
programming accessories) so natural-language search and comparison have a
meaningful catalog to work with. Fixed ids keep the seed idempotent.

Categories for any new values are created first so the category picker in the
admin dashboard stays in sync.
*/

insert into public.categories (name, description, icon)
values
  ('Audio', 'Headphones, speakers and studio gear.', 'Watch'),
  ('Wearables', 'Smartwatches and fitness trackers.', 'Watch')
on conflict (name) do nothing;

insert into public.products (id, name, description, price, image_url, rating, category, stock, features) values
  (
    '0a7f7c11-1111-4a11-8a11-000000000001',
    'AeroBook Air 13',
    'A lightweight 1.0 kg laptop for university and travel, with a 16-hour battery and a bright 13-inch display.',
    899.00,
    'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=800',
    4.4, 'Computers', 26,
    ARRAY['1.0 kg', '16h Battery', '13" FHD Display', '16GB RAM', '512GB SSD']
  ),
  (
    '0a7f7c11-1111-4a11-8a11-000000000002',
    'NovaBook Air 14',
    'A lightweight ultrabook with a 2.8K OLED screen and 18-hour battery, built for programming and productivity.',
    1049.00,
    'https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&w=800',
    4.6, 'Computers', 22,
    ARRAY['1.1 kg', '18h Battery', '2.8K OLED', '16GB RAM', 'Backlit Keyboard']
  ),
  (
    '0a7f7c11-1111-4a11-8a11-000000000003',
    'AeroBook Pro 15 Gaming',
    'A 15-inch gaming laptop with an RTX 4060, 144Hz display and 16GB RAM for gaming and heavy coursework.',
    1199.00,
    'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=800',
    4.5, 'Computers', 14,
    ARRAY['RTX 4060', 'Intel i7', '16GB RAM', '144Hz Display', '1TB SSD']
  ),
  (
    '0a7f7c11-1111-4a11-8a11-000000000004',
    'PixelCam Neo',
    'A smartphone with a 200MP triple camera and AI night mode for great photos and video.',
    749.00,
    'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800',
    4.7, 'Smartphones', 31,
    ARRAY['200MP Camera', 'AI Night Mode', '5G', '120Hz AMOLED', '5000mAh Battery']
  ),
  (
    '0a7f7c11-1111-4a11-8a11-000000000005',
    'CodeType Compact Keyboard',
    'A quiet 65% mechanical keyboard designed for programming, with hot-swappable switches and USB-C.',
    89.00,
    'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=800',
    4.4, 'Accessories', 52,
    ARRAY['65% Layout', 'Quiet Switches', 'Hot-swappable', 'USB-C', 'Programmable Keys']
  ),
  (
    '0a7f7c11-1111-4a11-8a11-000000000006',
    'StudioCam 4K',
    'An affordable 4K webcam with autofocus and dual microphones for video calls, streaming and online classes.',
    129.00,
    'https://images.pexels.com/photos/4126724/pexels-photo-4126724.jpeg?auto=compress&cs=tinysrgb&w=800',
    4.3, 'Accessories', 38,
    ARRAY['4K 30fps', 'Autofocus', 'Dual Microphones', 'USB-C', 'Privacy Shutter']
  )
on conflict (id) do nothing;

notify pgrst, 'reload schema';
