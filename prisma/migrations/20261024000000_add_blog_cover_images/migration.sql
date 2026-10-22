-- Add real cover pictures to existing blog posts so article cards show
-- cover art instead of the ZED placeholder.

UPDATE "BlogPost"
SET "coverImage" = 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=900&q=75',
    "coverAlt" = 'Premium gift hamper packaged for same-day delivery'
WHERE "slug" = 'same-day-gift-delivery-nairobi';

UPDATE "BlogPost"
SET "coverImage" = 'https://images.unsplash.com/photo-1512418490979-92798cec1380?auto=format&fit=crop&w=900&q=75',
    "coverAlt" = 'Personalized three-piece executive gift set'
WHERE "slug" = 'personalized-gifts-for-couples';

UPDATE "BlogPost"
SET "coverImage" = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=75',
    "coverAlt" = 'Branded eco-friendly tech gift set'
WHERE "slug" = 'corporate-gifting-at-scale';

UPDATE "BlogPost"
SET "coverImage" = 'https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?auto=format&fit=crop&w=900&q=75',
    "coverAlt" = 'Customized metallic sports water bottle'
WHERE "slug" = 'where-to-buy-customized-water-bottles-kenya';

UPDATE "BlogPost"
SET "coverImage" = 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=75',
    "coverAlt" = 'Personalized thermal water bottles'
WHERE "slug" = 'best-customized-water-bottles-for-gifts-in-kenya';

UPDATE "BlogPost"
SET "coverImage" = 'https://images.unsplash.com/photo-1528938102132-4a9276b8e320?auto=format&fit=crop&w=900&q=75',
    "coverAlt" = 'Personalized bamboo notebook and pen set'
WHERE "slug" = 'choose-the-perfect-personalized-gift-in-kenya';

UPDATE "BlogPost"
SET "coverImage" = 'https://nwmnmdftiuifndjzdbad.supabase.co/storage/v1/object/public/product-images/1792134024980-53rc51-1000432426.png',
    "coverAlt" = 'Fleece Maasai shuka blanket'
WHERE "slug" = 'top-personalized-gift-ideas-kenya';

UPDATE "BlogPost"
SET "coverImage" = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=900&q=75',
    "coverAlt" = 'Premium leather bifold wallet'
WHERE "slug" = 'best-gifts-for-boyfriend-in-kenya';

UPDATE "BlogPost"
SET "coverImage" = 'https://nwmnmdftiuifndjzdbad.supabase.co/storage/v1/object/public/product-images/1792090794885-35tmns-1000402702.jpg',
    "coverAlt" = 'Urren men''s wristwatch'
WHERE "slug" = 'how-to-style-sneakers-for-everyday-fashion-in-kenya';
