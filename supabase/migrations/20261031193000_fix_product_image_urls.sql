/*
# Fix product image URLs that pointed at missing Pexels files

1. Changes
- `photos/18105/pexels-photo-18105.jpeg` does not exist; the real file for
  photo 18105 is `photos/18105/pexels-photo.jpg` (AeroBook Pro 16).
- `photos/777002/pexels-photo-777002.jpeg` does not exist; the Lumina 4K Monitor
  gallery now uses `photos/1714208/pexels-photo-1714208.jpeg`.

2. Notes
- Rewrites both `products.image_url` and every entry of `products.gallery`, so
  it is safe to re-run and applies to rows seeded by earlier migrations.
*/

UPDATE products
SET
  image_url = replace(
    replace(image_url,
      '/photos/18105/pexels-photo-18105.jpeg', '/photos/18105/pexels-photo.jpg'),
    '/photos/777002/pexels-photo-777002.jpeg', '/photos/1714208/pexels-photo-1714208.jpeg'),
  gallery = (
    SELECT array_agg(
      replace(
        replace(g,
          '/photos/18105/pexels-photo-18105.jpeg', '/photos/18105/pexels-photo.jpg'),
        '/photos/777002/pexels-photo-777002.jpeg', '/photos/1714208/pexels-photo-1714208.jpeg')
      ORDER BY ord)
    FROM unnest(gallery) WITH ORDINALITY AS t(g, ord)
  )
WHERE image_url LIKE '%pexels-photo-18105.jpeg%'
   OR image_url LIKE '%pexels-photo-777002.jpeg%'
   OR EXISTS (
     SELECT 1 FROM unnest(gallery) AS g
     WHERE g LIKE '%pexels-photo-18105.jpeg%' OR g LIKE '%pexels-photo-777002.jpeg%'
   );
