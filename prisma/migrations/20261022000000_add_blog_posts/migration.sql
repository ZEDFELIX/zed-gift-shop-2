-- BlogPost: admin-managed journal articles. Migrates the nine existing
-- storefront articles into the database so they keep their live URLs,
-- publication dates and content, and become editable in the admin dashboard.

CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "coverImage" TEXT,
    "coverAlt" TEXT,
    "category" TEXT NOT NULL,
    "authorName" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

INSERT INTO "BlogPost" ("id", "slug", "title", "excerpt", "body", "category", "authorName", "status", "publishedAt", "createdAt", "updatedAt")
VALUES
('blg_same_day_2026', 'same-day-gift-delivery-nairobi', 'Same-day gift delivery in Nairobi: how it works',
'Order before 2 PM and your gift can be at the door the same day. Here is what happens between checkout and knock.',
$$Same-day delivery sounds like a promise you have to cross your fingers for. With us, it is a simple, fixed process. Order any in-stock gift before 2 PM on a working day, choose same-day delivery at checkout, and the parcel leaves our Nairobi studio the same afternoon.

## The cutoff

The 2 PM cutoff exists for one reason: we personalize. If you add a name, message or photo, we need the afternoon to finish and pack it properly. Orders placed after the cutoff go out the next working day.

## What you get

A live delivery status in track order, a photo confirmation at the door, and a card on request. Courier zones cover the Nairobi CBD and the main suburbs; county-wide delivery follows a next-day schedule.

Need a gift delivered today? [Browse same-day gifts](https://zed-gift-shop-2.vercel.app/shop).$$,
'Delivery', 'ZED Gift Shop', 'PUBLISHED', '2026-09-12T09:00:00.000Z', '2026-09-12T09:00:00.000Z', '2026-09-12T09:00:00.000Z'),

('blg_couples_2026', 'personalized-gifts-for-couples', 'Five personalized gifts couples actually keep',
'Matching, engraved and made-to-share ideas for anniversaries, Valentine''s and just because.',
$$A personalized gift for a couple should survive the season - not end up in a drawer with the tags on. These five ideas hold up because they are used, seen or worn.

## The watch box

A matching set is the fastest way to mark 'us'. Our His & Hers watch box lands well for anniversaries and wedding days, and the straps can be engraved with both initials and a date.

## The framed map

Pin a place that matters - the airport you met at, the street you live on - and print it as framed map art. It becomes the first thing guests see in the living room.

## Keepsake boxes and photo frames

Engraved wooden keepsake boxes hold tickets and letters; classic photo frames hold the actual evidence. Both live under the personalization collection and arrive gift-ready.

## The card, written properly

Every gift above gets more meaning with a card in your own words. [Write it on a keepsake card](https://zed-gift-shop-2.vercel.app/cards).$$,
'Gifting tips', 'ZED Gift Shop', 'PUBLISHED', '2026-08-28T09:00:00.000Z', '2026-08-28T09:00:00.000Z', '2026-08-28T09:00:00.000Z'),

('blg_corporate_scale_2026', 'corporate-gifting-at-scale', 'Corporate gifting at scale without the guesswork',
'From employee appreciation to client hampers - how bulk orders, branding and delivery come together.',
$$Corporate gifting works when it is consistent, on-brand and on time. That is the bar we hold for bulk orders - from a staff recognition run of 20 mugs to a 200-piece client hamper programme.

## Brand, but tastefully

Notebooks, drinkware, desk organizers and tote bags take print, engraving or embossing well. Choose one hero product and one colour, and the set reads as a collection instead of a mixed bag.

## Delivery and tracking

We deliver in bulk by drop point or individually by courier, with tracking either way. Ordering 10 or more pieces per product also earns you the wholesale discount.

## Start with a quote

[Request a wholesale quotation](https://zed-gift-shop-2.vercel.app/wholesale) and we will confirm pricing and delivery with you directly.$$,
'Corporate', 'ZED Gift Shop', 'PUBLISHED', '2026-08-09T09:00:00.000Z', '2026-08-09T09:00:00.000Z', '2026-08-09T09:00:00.000Z'),

('blg_bottles_where_2026', 'where-to-buy-customized-water-bottles-kenya', 'Where to Buy Customized Water Bottles in Kenya',
'Customized water bottles are one of the easiest gifts to personalize and one of the fastest to deliver. Here is how to order the right one in Kenya.',
$$A customized water bottle is the rare gift that is useful every single day, cheap to produce in small runs, and quick to personalize. That makes it the default choice for birthdays, staff welcome kits and conference swag.

## Pick the bottle before the print

Steel, glass and sport bottles each take printing differently. Laser engraving suits steel, UV printing gives full-colour results on steel and ceramic, and sublimation is the only option for a true all-over wrap on coated bottles. If you want a photograph, you need UV or sublimation.

## How to order in three steps

Choose the bottle, send the artwork as a vector file or a high-resolution image, then confirm the name or message spelling twice. We send a photo proof before the run, and most single-unit orders are finished the same day.

## What it costs

Single units start around KShs 1,200 for a printed steel bottle, and pricing drops sharply from ten pieces. For anything over fifty units, [ask for a bulk quote](https://zed-gift-shop-2.vercel.app/wholesale) so we can suggest the bottle that fits your budget.

Looking for engraving rather than printing? [Shop personalized gifts](https://zed-gift-shop-2.vercel.app/product-category/personalized-gifts).$$,
'Guides', 'ZED Gift Shop', 'PUBLISHED', '2026-09-08T09:00:00.000Z', '2026-09-08T09:00:00.000Z', '2026-09-08T09:00:00.000Z'),

('blg_bottles_best_2026', 'best-customized-water-bottles-for-gifts-in-kenya', 'Best Customized Water Bottles for Gifts in Kenya | Personalized Gift Ideas 2026',
'Thermal, stainless steel and sport bottles compared - including print methods, price bands and what to engrave on each.',
$$Not all water bottles survive a Kenyan year, and the difference usually shows up in the lid. Here is the short version of what actually works for gifting.

## Thermal stainless steel

The safest all-round gift. Vacuum insulation keeps drinks hot for hours, the body takes laser engraving cleanly, and the price sits comfortably in the middle of our range. Engrave a name and a date rather than a long quote; long text crowds the curve.

## Sport and squeeze bottles

Best for gyms, school runs and outdoor gifts. TPU and tritan bodies are lighter and cheaper, and they accept full-colour UV printing well. Avoid laser engraving here, since the soft body scorches.

## Glass bottles with a sleeve

Glass looks premium and photographs well, but it is heavier to ship and breaks. If you choose glass, we send a protective sleeve and a reinforced box.

## Price bands

Under KShs 1,000 for plain sport bottles with single-colour print, KShs 1,200 to 2,500 for engraved thermal bottles, and above KShs 3,000 for premium coated bodies with full-wrap sublimation.

[Shop personalized gifts](https://zed-gift-shop-2.vercel.app/product-category/personalized-gifts) to see current prices.$$,
'Personalized', 'ZED Gift Shop', 'PUBLISHED', '2026-09-02T09:00:00.000Z', '2026-09-02T09:00:00.000Z', '2026-09-02T09:00:00.000Z'),

('blg_choose_personalized_2026', 'choose-the-perfect-personalized-gift-in-kenya', 'How to Choose the Perfect Personalized Gift in Kenya',
'A practical checklist for choosing a personalized gift: the occasion, the recipient, the print method and the delivery window.',
$$Personalized gifts fail in predictable ways: the wrong size, the wrong spelling, or the wrong level of sentiment. Work through these four questions and you will not go wrong.

## 1. Start with the occasion, not the product

A birthday, a promotion and a thank-you all read very differently on a gift. Decide the feeling first, then let it narrow the product. Promotions reward usefulness; birthdays reward sentiment; corporate thank-yous reward restraint.

## 2. Match the gift to how they actually live

A colleague who runs will use a bottle; someone who writes will use a notebook. The most reliable personalized gifts are the ones the recipient would buy for themselves if nobody were watching.

## 3. Choose the print method with the surface

One message, one method. Laser engraving is permanent and monochrome. UV printing handles colour and photographs on hard surfaces. Sublimation handles all-over wraps. Putting a photo on a surface that only takes engraving is the most common mistake we see.

## 4. Leave room for the delivery window

Personalization adds production time on top of delivery time. For same-day Nairobi delivery, send artwork before noon. For a date that matters, order three working days ahead and let us handle the buffer.

Ready to pick? [Browse our collection](https://zed-gift-shop-2.vercel.app/shop).$$,
'Guides', 'ZED Gift Shop', 'PUBLISHED', '2026-08-26T09:00:00.000Z', '2026-08-26T09:00:00.000Z', '2026-08-26T09:00:00.000Z'),

('blg_top_ideas_2026', 'top-personalized-gift-ideas-kenya', 'Top Personalized Gift Ideas in Kenya for Every Special Occasion',
'Birthdays, weddings, graduations, corporate appreciation and thank-yous - personalized gift ideas for every occasion.',
$$Here is the shortlist we end up recommending most often, organised by occasion, with the reasoning attached.

## Birthdays

An engraved steel bottle, a printed mug set, or a personalized leather notebook. All three are personal without being embarrassing to receive at work.

## Weddings and anniversaries

Couple watches, engraved cutlery for a newly married home, or a photo book. For anniversaries, the date matters more than the brand, so put the date on it.

## Graduations

A printed tote, a custom diary and a power bank. Graduation gifts get carried around for years, so durable surfaces beat delicate ones.

## Corporate appreciation

Branded tote bags, drinkware, diaries and desk sets. Keep branding to one surface and one colour; a logo repeated everywhere reads as marketing, not appreciation. Ordering for a team? [Request a wholesale quote](https://zed-gift-shop-2.vercel.app/wholesale).

## Thank-yous

Chocolate, a candle and a handwritten card. Thank-you gifts should be small, immediate and consumable. Personalized labels on a hamper box cover this well.

[Shop gifts for every occasion](https://zed-gift-shop-2.vercel.app/shop).$$,
'Personalized', 'ZED Gift Shop', 'PUBLISHED', '2026-08-19T09:00:00.000Z', '2026-08-19T09:00:00.000Z', '2026-08-19T09:00:00.000Z'),

('blg_boyfriend_2026', 'best-gifts-for-boyfriend-in-kenya', 'Best Gifts for Boyfriend in Kenya (2026 Guide)',
'Watches, engraved wallets, tech sets and romantic keepsakes that actually land, with price ranges for every budget.',
$$The hard part of a boyfriend gift is not finding something nice, it is avoiding something that is too personal too fast. These are the ones that work across a wide range of relationships.

## Under KShs 2,000

A printed mug with a date and a line from a shared memory, or a personalized keyring. Cheap, quick, and easy to get right.

## KShs 2,000 to 5,000

Engraved wallets, engraved steel bottles and printed t-shirts. Add a card with the reason, because the reason is the part he keeps.

## KShs 5,000 to 15,000

Watches, Bluetooth speakers, power banks and tech gift sets. This is the band where it pays to check whether he already owns one, because these are the gifts most often duplicated.

## Above KShs 15,000

Couple watches, premium personalized luggage and leather goods. At this level, include delivery insurance and a proper gift box, and let him choose between two options if you can.

[Gifts for him](https://zed-gift-shop-2.vercel.app/product-category/men-gifts) whenever you are ready.$$,
'Gifts for Him', 'ZED Gift Shop', 'PUBLISHED', '2026-08-12T09:00:00.000Z', '2026-08-12T09:00:00.000Z', '2026-08-12T09:00:00.000Z'),

('blg_sneakers_2026', 'how-to-style-sneakers-for-everyday-fashion-in-kenya', 'How to Style Sneakers for Everyday Fashion in Kenya (2026 Style Guide)',
'How to style sneakers for everyday wear in Kenya, and how to pair them with the gift sets we recommend.',
$$Sneakers are the default in Nairobi for a reason: they survive matatu dust, long walks and a full workday without complaint. Styling them well is mostly about proportion.

## Keep the top half simple

A plain tee, a plain shirt or a light knit with sneakers lets the shoe read as intentional rather than borrowed. Loud graphics on both halves at once fight each other.

## Match the trouser length

A slim taper or a straight leg ending just above the shoe gives the cleanest line. Avoid a break that sits halfway down the shoe, which shortens the leg and makes the sneaker look too large.

## One accent, not three

If the sneakers carry colour, pull the same tone into one other item, ideally the bag. Repeating one colour reads as deliberate; repeating everything reads as busy.

## Gift pairing

A sneaker care kit with a personalized shoe bag is a genuinely useful gift, and the bag can carry a name or message. We engrave the initials and ship it in the same box.

[Shop sneakers](https://zed-gift-shop-2.vercel.app/product-category/shoes-for-men/shoes/men-sneakers) for the pairing partner.$$,
'Lifestyle', 'ZED Gift Shop', 'PUBLISHED', '2026-08-05T09:00:00.000Z', '2026-08-05T09:00:00.000Z', '2026-08-05T09:00:00.000Z')
ON CONFLICT ("slug") DO NOTHING;