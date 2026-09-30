export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  content: { heading?: string; body: string }[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "same-day-gift-delivery-nairobi",
    title: "Same-day gift delivery in Nairobi: how it works",
    excerpt: "Order before 2 PM and your gift can be at the door the same day. Here is what happens between checkout and knock.",
    category: "Delivery",
    date: "2026-09-12",
    readTime: "3 min",
    content: [
      {
        body:
          "Same-day delivery sounds like a promise you have to cross your fingers for. With us, it is a simple, fixed process. Order any in-stock gift before 2 PM on a working day, choose same-day delivery at checkout, and the parcel leaves our Nairobi studio the same afternoon.",
      },
      {
        heading: "The cutoff",
        body:
          "The 2 PM cutoff exists for one reason: we personalize. If you add a name, message or photo, we need the afternoon to finish and pack it properly. Orders placed after the cutoff go out the next working day.",
      },
      {
        heading: "What you get",
        body:
          "A live delivery status in track order, a photo confirmation at the door, and a card on request. Courier zones cover the Nairobi CBD and the main suburbs; county-wide delivery follows a next-day schedule.",
      },
    ],
  },
  {
    slug: "personalized-gifts-for-couples",
    title: "Five personalized gifts couples actually keep",
    excerpt: "Matching, engraved and made-to-share ideas for anniversaries, Valentine's and just because.",
    category: "Gifting tips",
    date: "2026-08-28",
    readTime: "4 min",
    content: [
      {
        body:
          "A personalized gift for a couple should survive the season - not end up in a drawer with the tags on. These five ideas hold up because they are used, seen or worn.",
      },
      {
        heading: "The watch box",
        body:
          "A matching set is the fastest way to mark 'us'. Our His & Hers watch box lands well for anniversaries and wedding days, and the straps can be engraved with both initials and a date.",
      },
      {
        heading: "The framed map",
        body:
          "Pin a place that matters - the airport you met at, the street you live on - and print it as framed map art. It becomes the first thing guests see in the living room.",
      },
      {
        heading: "Keepsake boxes and photo frames",
        body:
          "Engraved wooden keepsake boxes hold tickets and letters; classic photo frames hold the actual evidence. Both are under the personalization tree and arrive gift-ready.",
      },
    ],
  },
  {
    slug: "corporate-gifting-at-scale",
    title: "Corporate gifting at scale without the guesswork",
    excerpt: "From employee appreciation to client hampers - how bulk orders, branding and delivery come together.",
    category: "Corporate",
    date: "2026-08-09",
    readTime: "4 min",
    content: [
      {
        body:
          "Corporate gifting works when it is consistent, on-brand and on time. That is the bar we hold for bulk orders - from a staff recognition run of 20 mugs to a 200-piece client hamper programme.",
      },
      {
        heading: "Brand, but tastefully",
        body:
          "Notebooks, drinkware, desk organizers and tote bags take print, engraving or embossing well. Choose one hero product and one colour, and the set reads as a collection instead of a mixed bag.",
      },
      {
        heading: "Delivery and tracking",
        body:
          "We deliver in bulk by drop point or individually by courier, with tracking either way. Our corporate section covers the catalogue, and a direct conversation covers the quote.",
      },
    ],
  },
  {
    slug: "where-to-buy-customized-water-bottles-kenya",
    title: "Where to Buy Customized Water Bottles in Kenya",
    excerpt:
      "Customized water bottles are one of the easiest gifts to personalize and one of the fastest to deliver. Here is how to order the right one in Kenya.",
    category: "Guides",
    date: "2026-09-08",
    readTime: "4 min",
    content: [
      {
        body:
          "A customized water bottle is the rare gift that is useful every single day, cheap to produce in small runs, and quick to personalize. That makes it the default choice for birthdays, staff welcome kits and conference swag.",
      },
      {
        heading: "Pick the bottle before the print",
        body:
          "Steel, glass and sport bottles each take printing differently. Laser engraving suits steel, UV printing gives full-colour results on steel and ceramic, and sublimation is the only option for a true all-over wrap on coated bottles. If you want a photograph, you need UV or sublimation.",
      },
      {
        heading: "How to order in three steps",
        body:
          "Choose the bottle, send the artwork as a vector file or a high-resolution image, then confirm the name or message spelling twice. We send a photo proof before the run, and most single-unit orders are finished the same day.",
      },
      {
        heading: "What it costs",
        body:
          "Single units start around KShs 1,200 for a printed steel bottle, and pricing drops sharply from ten pieces. For anything over fifty units, ask for a bulk quote so we can suggest the bottle that fits your budget.",
      },
    ],
  },
  {
    slug: "best-customized-water-bottles-for-gifts-in-kenya",
    title: "Best Customized Water Bottles for Gifts in Kenya | Personalized Gift Ideas 2026",
    excerpt:
      "Thermal, stainless steel and sport bottles compared - including print methods, price bands and what to engrave on each.",
    category: "Personalized",
    date: "2026-09-02",
    readTime: "5 min",
    content: [
      {
        body:
          "Not all water bottles survive a Kenyan year, and the difference usually shows up in the lid. Here is the short version of what actually works for gifting.",
      },
      {
        heading: "Thermal stainless steel",
        body:
          "The safest all-round gift. Vacuum insulation keeps drinks hot for hours, the body takes laser engraving cleanly, and the price sits comfortably in the middle of our range. Engrave a name and a date rather than a long quote; long text crowds the curve.",
      },
      {
        heading: "Sport and squeeze bottles",
        body:
          "Best for gyms, school runs and outdoor gifts. TPU and tritan bodies are lighter and cheaper, and they accept full-colour UV printing well. Avoid laser engraving here, since the soft body scorches.",
      },
      {
        heading: "Glass bottles with a sleeve",
        body:
          "Glass looks premium and photographs well, but it is heavier to ship and breaks. If you choose glass, we send a protective sleeve and a reinforced box.",
      },
      {
        heading: "Price bands",
        body:
          "Under KShs 1,000 for plain sport bottles with single-colour print, KShs 1,200 to 2,500 for engraved thermal bottles, and above KShs 3,000 for premium coated bodies with full-wrap sublimation.",
      },
    ],
  },
  {
    slug: "choose-the-perfect-personalized-gift-in-kenya",
    title: "How to Choose the Perfect Personalized Gift in Kenya",
    excerpt:
      "A practical checklist for choosing a personalized gift: the occasion, the recipient, the print method and the delivery window.",
    category: "Guides",
    date: "2026-08-26",
    readTime: "4 min",
    content: [
      {
        body:
          "Personalized gifts fail in predictable ways: the wrong size, the wrong spelling, or the wrong level of sentiment. Work through these four questions and you will not go wrong.",
      },
      {
        heading: "1. Start with the occasion, not the product",
        body:
          "A birthday, a promotion and a thank-you all read very differently on a gift. Decide the feeling first, then let it narrow the product. Promotions reward usefulness; birthdays reward sentiment; corporate thank-yous reward restraint.",
      },
      {
        heading: "2. Match the gift to how they actually live",
        body:
          "A colleague who runs will use a bottle; someone who writes will use a notebook. The most reliable personalized gifts are the ones the recipient would buy for themselves if nobody were watching.",
      },
      {
        heading: "3. Choose the print method with the surface",
        body:
          "One message, one method. Laser engraving is permanent and monochrome. UV printing handles colour and photographs on hard surfaces. Sublimation handles all-over wraps. Putting a photo on a surface that only takes engraving is the most common mistake we see.",
      },
      {
        heading: "4. Leave room for the delivery window",
        body:
          "Personalization adds production time on top of delivery time. For same-day Nairobi delivery, send artwork before noon. For a date that matters, order three working days ahead and let us handle the buffer.",
      },
    ],
  },
  {
    slug: "top-personalized-gift-ideas-kenya",
    title: "Top Personalized Gift Ideas in Kenya for Every Special Occasion",
    excerpt:
      "Birthdays, weddings, graduations, corporate appreciation and thank-yous - personalized gift ideas for every occasion.",
    category: "Personalized",
    date: "2026-08-19",
    readTime: "6 min",
    content: [
      {
        body:
          "Here is the shortlist we end up recommending most often, organised by occasion, with the reasoning attached.",
      },
      {
        heading: "Birthdays",
        body:
          "An engraved steel bottle, a printed mug set, or a personalized leather notebook. All three are personal without being embarrassing to receive at work.",
      },
      {
        heading: "Weddings and anniversaries",
        body:
          "Couple watches, engraved cutlery for a newly married home, or a photo book. For anniversaries, the date matters more than the brand, so put the date on it.",
      },
      {
        heading: "Graduations",
        body:
          "A printed tote, a custom diary and a power bank. Graduation gifts get carried around for years, so durable surfaces beat delicate ones.",
      },
      {
        heading: "Corporate appreciation",
        body:
          "Branded tote bags, drinkware, diaries and desk sets. Keep branding to one surface and one colour; a logo repeated everywhere reads as marketing, not appreciation.",
      },
      {
        heading: "Thank-yous",
        body:
          "Chocolate, a candle and a handwritten card. Thank-you gifts should be small, immediate and consumable. Personalized labels on a hamper box cover this well.",
      },
    ],
  },
  {
    slug: "best-gifts-for-boyfriend-in-kenya",
    title: "Best Gifts for Boyfriend in Kenya (2026 Guide)",
    excerpt:
      "Watches, engraved wallets, tech sets and romantic keepsakes that actually land, with price ranges for every budget.",
    category: "Gifts for Him",
    date: "2026-08-12",
    readTime: "5 min",
    content: [
      {
        body:
          "The hard part of a boyfriend gift is not finding something nice, it is avoiding something that is too personal too fast. These are the ones that work across a wide range of relationships.",
      },
      {
        heading: "Under KShs 2,000",
        body:
          "A printed mug with a date and a line from a shared memory, or a personalized keyring. Cheap, quick, and easy to get right.",
      },
      {
        heading: "KShs 2,000 to 5,000",
        body:
          "Engraved wallets, engraved steel bottles and printed t-shirts. Add a card with the reason, because the reason is the part he keeps.",
      },
      {
        heading: "KShs 5,000 to 15,000",
        body:
          "Watches, Bluetooth speakers, power banks and tech gift sets. This is the band where it pays to check whether he already owns one, because these are the gifts most often duplicated.",
      },
      {
        heading: "Above KShs 15,000",
        body:
          "Couple watches, premium personalized luggage and leather goods. At this level, include delivery insurance and a proper gift box, and let him choose between two options if you can.",
      },
    ],
  },
  {
    slug: "how-to-style-sneakers-for-everyday-fashion-in-kenya",
    title: "How to Style Sneakers for Everyday Fashion in Kenya (2026 Style Guide)",
    excerpt:
      "How to style sneakers for everyday wear in Kenya, and how to pair them with the gift sets we recommend.",
    category: "Lifestyle",
    date: "2026-08-05",
    readTime: "4 min",
    content: [
      {
        body:
          "Sneakers are the default in Nairobi for a reason: they survive matatu dust, long walks and a full workday without complaint. Styling them well is mostly about proportion.",
      },
      {
        heading: "Keep the top half simple",
        body:
          "A plain tee, a plain shirt or a light knit with sneakers lets the shoe read as intentional rather than borrowed. Loud graphics on both halves at once fight each other.",
      },
      {
        heading: "Match the trouser length",
        body:
          "A slim taper or a straight leg ending just above the shoe gives the cleanest line. Avoid a break that sits halfway down the shoe, which shortens the leg and makes the sneaker look too large.",
      },
      {
        heading: "One accent, not three",
        body:
          "If the sneakers carry colour, pull the same tone into one other item, ideally the bag. Repeating one colour reads as deliberate; repeating everything reads as busy.",
      },
      {
        heading: "Gift pairing",
        body:
          "A sneaker care kit with a personalized shoe bag is a genuinely useful gift, and the bag can carry a name or message. We engrave the initials and ship it in the same box.",
      },
    ],
  },
];

export function getBlogPosts() {
  return BLOG_POSTS;
}

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}