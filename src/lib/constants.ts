export const SITE = {
  name: "ZED GIFT SHOP 2",
  shortName: "ZED GIFT SHOP 2",
  tagline: "Gifts For Every Occasion",
  description:
  "ZED Gift Shop 2 is a trusted online gift shop in Nairobi offering premium, personalized and same-day gift delivery services across Kenya.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim() || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://zed-gift-shop-2.vercel.app"),
  phone: "+254 740 282041",
  phoneDisplay: "0711 667 733",
  phoneHref: "tel:+254740282041",
  whatsappNumber: "254711667733",
  whatsappHref: "https://wa.me/254711667733",
  email: "info@zedgiftshop2.com",
  address: "3rd Floor Avenue House, Nairobi, Kenya",
  mapsHref: "https://maps.app.goo.gl/R5eMKk1EHTcMpseJA",
  mapsEmbed:
  "https://maps.google.com/maps?q=ZED%20Gift%20Shop%20Nairobi&t=m&z=15&output=embed&iwloc=near",
  hours: "Mon – Sun, 08:00 – 19:00",
  currency: "KES",
  currencyPrefix: "KShs",
  country: "Kenya",
  ratingValue: 4.9,
  reviewCount: 605,
  announcementLeft: "Call us on: +254 740 282041 to place your order.",
  announcementRight: "Same day delivery in Nairobi.",
  social: {
  x: "https://x.com/zedgiftshop2",
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/",
  },
} as const;

export type NavChild = { label: string; href: string };
export type NavColumn = { title: string; href?: string; children: NavChild[] };
export type NavGroup = { label: string; href: string; columns: NavColumn[] };

const occasionColumn = (prefix: string): NavColumn => ({
  title: "Gifts By Occassion",
  href: `/product-category/${prefix}`,
  children: [
  { label: "Secret Santa", href: `/product-category/${prefix}/secret-santa-gifts` },
  { label: "Gift for Dad", href: `/product-category/${prefix}/gift-for-dad` },
  { label: "Gift for Boss", href: `/product-category/${prefix}/gift-for-boss` },
  { label: "Romantic Gifts", href: `/product-category/${prefix}/romantic-gifts` },
  { label: "Wedding Gifts", href: `/product-category/${prefix}/wedding-gifts` },
  { label: "Graduation Gifts", href: `/product-category/${prefix}/graduation-gifts` },
  { label: "Anniversary Gifts", href: `/product-category/${prefix}/anniversary-gifts` },
  { label: "Just Because Gifts", href: `/product-category/${prefix}/just-because-gifts` },
  { label: "Father's Day Gifts", href: `/product-category/${prefix}/fathers-day-gifts` },
  { label: "Valentine's Day Gifts", href: `/product-category/${prefix}/valentines-day-gifts` },
  { label: "Birthday Gifts", href: `/product-category/${prefix}/birthday-gifts` },
  ],
});

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Men",
    href: "/product-category/men-gifts",
    columns: [
    occasionColumn("men-gifts"),
    {
    title: "Most Popular Gifts",
    children: [
      { label: "Watches", href: "/product-category/men-watches-on-sale/mens-watches" },
      { label: "Mugs", href: "/product-category/promotional-gifts/thermo-mugs" },
      { label: "Keychains", href: "/product-category/promotional-gifts/keychain" },
      { label: "Gift Cards", href: "/cards" },
      { label: "Name Tags", href: "/product-category/men-gifts/men-name-tags" },
      { label: "2026 Diaries", href: "/product-category/corporate-gifts-kenya/2026-diary" },
      { label: "Card Holder", href: "/product-category/men-gifts/card-holder-wallet" },
      { label: "Thermal Flask", href: "/product-category/promotional-gifts/water-bottles" },
      { label: "Desk Organizers", href: "/product-category/men-gifts/desk-organizers" },
      { label: "Hip Flask Gift Set", href: "/product-category/men-gifts/hip-flask-gift-set" },
    ],
    },
    {
    title: "Most Popular Gifts",
    children: [
      { label: "Belts", href: "/product-category/promotional-gifts/leather-belts" },
      { label: "Jewerly", href: "/product-category/pendant-necklaces" },
      { label: "Wallets", href: "/product-category/men-gifts/mens-leather-wallets" },
      { label: "Tie Sets", href: "/product-category/promotional-gifts/tie-sets" },
      { label: "Cufflinks", href: "/product-category/men-gifts/cufflinks" },
      { label: "Bracelets", href: "/product-category/kenya-bracelets/men-bracelets" },
      { label: "Happy Socks", href: "/product-category/men-gifts/mens-socks" },
      { label: "Watch Organizers", href: "/product-category/watch-organizer" },
      { label: "Tie Clips", href: "/product-category/men-gifts/tie-clips" },
      { label: "Maasai Blankets", href: "/product-category/maasai-blankets-in-nairobi" },
    ],
    },
    {
    title: "Others Gifts",
    children: [
      { label: "Loafers", href: "/product-category/shoes-for-men/shoes/mens-loafers" },
      { label: "Sneakers", href: "/product-category/shoes-for-men/shoes/men-sneakers" },
      { label: "Perfumes", href: "/product-category/men-gifts/best-perfumes" },
      { label: "Official Shoes", href: "/product-category/shoes-for-men/shoes/official-shoes" },
      { label: "I love Cosmetics", href: "/product-category/ladies-gifts/i-love-cosmetics" },
    ],
    },
    {
    title: "Watch Brands",
    href: "/product-category/men-watches-on-sale",
    children: [
      { label: "Curren", href: "/product-category/mens-watches/curren" },
      { label: "Olevs", href: "/product-category/mens-watches/olevs" },
      { label: "Crrju", href: "/product-category/mens-watches/crrju" },
      { label: "Chenxi", href: "/product-category/mens-watches/chenxi" },
      { label: "Poedagar", href: "/product-category/mens-watches/poedagar" },
      { label: "Skmei", href: "/product-category/mens-watches/skmei" },
      { label: "Lige", href: "/product-category/mens-watches/lige" },
      { label: "Naviforce", href: "/product-category/mens-watches/naviforce" },
      { label: "Forsining", href: "/product-category/mens-watches/forsining" },
      { label: "Sanda", href: "/product-category/mens-watches/sanda" },
    ],
    },
    ],
  },
  {
    label: "Women",
    href: "/product-category/ladies-gifts",
    columns: [
    occasionColumn("ladies-gifts"),
    {
    title: "Most Popular",
    children: [
      { label: "Jewerly", href: "/product-category/pendant-necklaces" },
      { label: "Watches", href: "/product-category/men-watches-on-sale/ladies-watches" },
      { label: "Bracelets", href: "/product-category/kenya-bracelets/bracelets-for-women" },
      { label: "Clutch Bags", href: "/product-category/ladies-gifts/ladies-clutch-bags" },
      { label: "Mothers day", href: "/product-category/ladies-gifts/ladies-gifts-for-mom" },
      { label: "Ladies Giftsets", href: "/product-category/ladies-gifts/ladies-giftsets" },
      { label: "Hair Straightener", href: "/product-category/ladies-gifts/hair-straightener" },
      { label: "I Love Cosmetics", href: "/product-category/ladies-gifts/i-love-cosmetics" },
      { label: "Watch Organizers", href: "/product-category/ladies-gifts/ladies-watch-organizer" },
      { label: "Perfumes & Fragrances", href: "/product-category/ladies-gifts/perfumes-for-women" },
    ],
    },
    {
    title: "Most Popular",
    children: [
      { label: "Mugs", href: "/product-category/promotional-gifts/thermo-mugs" },
      { label: "Keychains", href: "/product-category/promotional-gifts/keychain" },
      { label: "Gift Cards", href: "/cards" },
      { label: "Name Tags", href: "/product-category/ladies-gifts/ladies-name-tags" },
      { label: "2026 Diaries", href: "/product-category/corporate-gifts-kenya/2026-diary" },
      { label: "Card Holders", href: "/product-category/ladies-gifts/ladies-card-holders" },
      { label: "Thermal Flasks", href: "/product-category/promotional-gifts/water-bottles" },
      { label: "Hip Flask Gift Set", href: "/product-category/men-gifts/hip-flask-gift-set" },
      { label: "Desk Organizers", href: "/product-category/desk-organizers-in-nairobi" },
    ],
    },
    {
    title: "Women Shoes",
    children: [
      { label: "Loafers", href: "/product-category/shoes-for-men/shoes/ladies-loafers" },
      { label: "Card Holders", href: "/product-category/ladies-gifts/ladies-card-holders" },
    ],
    },
    {
    title: "Ladies By Brand",
    href: "/product-category/men-watches-on-sale/ladies-watches",
    children: [
      { label: "Curren", href: "/product-category/ladies-watches/curren" },
      { label: "Olevs", href: "/product-category/ladies-watches/olevs" },
      { label: "Crrju", href: "/product-category/ladies-watches/crrju" },
      { label: "Chenxi", href: "/product-category/ladies-watches/chenxi" },
      { label: "Poedagar", href: "/product-category/ladies-watches/poedagar" },
      { label: "Lige", href: "/product-category/ladies-watches/lige" },
      { label: "Naviforce", href: "/product-category/ladies-watches/naviforce" },
      { label: "Skmei", href: "/product-category/ladies-watches/skmei" },
      { label: "Wwoor", href: "/product-category/ladies-watches/wwoor" },
    ],
    },
    ],
  },
  {
    label: "Corporate Gifts",
    href: "/product-category/corporate-gifts-kenya",
    columns: [
    {
    title: "Drinkware",
    href: "/product-category/corporate-gifts-kenya/tumbler",
    children: [
      { label: "Mugs", href: "/product-category/promotional-gifts/thermo-mugs" },
      { label: "Tumblers", href: "/product-category/corporate-gifts-kenya/tumbler" },
      { label: "Water Bottles", href: "/product-category/promotional-gifts/water-bottles" },
      { label: "Thermal Flasks", href: "/product-category/corporate-gifts-kenya/thermal-flasks" },
      { label: "Stanley Mugs", href: "/product-category/personalized-gifts/stanley-inspired-cups" },
    ],
    },
    {
    title: "for Ladies",
    href: "/product-category/corporate-gifts-kenya/corporate-gifts-ideas",
    children: [{ label: "Maasai Blankets", href: "/product-category/maasai-blankets-in-nairobi" }],
    },
    {
    title: "Stationery Gifts",
    children: [
      { label: "Gifts sets", href: "/product-category/corporate-gifts-kenya/corporate-gift-sets" },
      { label: "Notebooks", href: "/product-category/promotional-gifts/customized-notebooks" },
      { label: "Desk Organizers", href: "/product-category/desk-organizers-in-nairobi" },
      { label: "Jute tote bags", href: "/product-category/corporate-gifts-kenya/jute-tote-bags" },
      { label: "2027 Diaries", href: "/product-category/corporate-gifts-kenya/2027-diaries" },
    ],
    },
    {
    title: "for Men",
    href: "/product-category/corporate-gifts-kenya/executive-corporate-gifts",
    children: [
      { label: "Executive Gift Sets", href: "/product-category/corporate-gifts-kenya/executive-corporate-gifts" },
      { label: "Maasai Blankets", href: "/product-category/maasai-blankets-in-nairobi" },
    ],
    },
    {
    title: "Awards & Trophies Gifts",
    children: [
      { label: "For Schools", href: "/product-category/corporate-gifts-kenya/schools-awards" },
      { label: "For Individuals", href: "/product-category/corporate-gifts-kenya/individuals-awards" },
      { label: "For Companies", href: "/product-category/corporate-gifts-kenya/companies-awards" },
      { label: "Crystal Desk Organizers", href: "/product-category/promotional-gifts/crystal-items" },
    ],
    },
    {
    title: "Tech",
    children: [
      { label: "Power Banks", href: "/product-category/corporate-gifts-kenya/power-banks" },
      { label: "Smart Watches", href: "/product-category/men-watches-on-sale/smart-watches" },
    ],
    },
    ],
  },
  {
    label: "Promotional",
    href: "/product-category/promotional-gifts",
    columns: [
    {
    title: "Gifts",
    children: [
      { label: "Watches", href: "/product-category/men-watches-on-sale" },
      { label: "Keychain", href: "/product-category/promotional-gifts/keychain" },
      { label: "Tie Sets", href: "/product-category/promotional-gifts/tie-sets" },
      { label: "Name Tags", href: "/product-category/men-gifts/men-name-tags" },
      { label: "Leather Belts", href: "/product-category/promotional-gifts/leather-belts" },
      { label: "Leather Wallets", href: "/product-category/promotional-gifts/leather-wallets" },
      { label: "Stanley Mugs", href: "/product-category/personalized-gifts/stanley-inspired-cups" },
    ],
    },
    {
    title: "Stationary Products",
    children: [
      { label: "Pens", href: "/product-category/promotional-gifts/branded-executive-pens" },
      { label: "Notebooks", href: "/product-category/promotional-gifts/customized-notebooks" },
      { label: "2026 Diaries", href: "/product-category/corporate-gifts-kenya/2026-diary" },
    ],
    },
    {
    title: "Drinkware",
    children: [
      { label: "Water Bottles", href: "/product-category/promotional-gifts/water-bottles" },
      { label: "Thermal Flask", href: "/product-category/corporate-gifts-kenya/thermal-flasks" },
    ],
    },
    {
    title: "Crystal Products",
    href: "/product-category/promotional-gifts/crystal-items",
    children: [
      { label: "Desk Organizers", href: "/product-category/desk-organizers-in-nairobi" },
      { label: "Awards and Trophies", href: "/product-category/award-trophies-in-nairobi" },
    ],
    },
    {
    title: "Wooden Products",
    children: [{ label: "Wooden Products", href: "/product-category/promotional-gifts/wooden-products" }],
    },
    ],
  },
  {
    label: "Personalized",
    href: "/product-category/personalized-gifts",
    columns: [
    {
    title: "Engraving",
    children: [
      { label: "Belts", href: "/product-category/promotional-gifts/leather-belts" },
      { label: "Pens", href: "/product-category/promotional-gifts/branded-executive-pens" },
      { label: "Wallets", href: "/product-category/promotional-gifts/leather-wallets" },
      { label: "Keychains", href: "/product-category/promotional-gifts/keychain" },
      { label: "Notebooks", href: "/product-category/promotional-gifts/customized-notebooks" },
      { label: "Name Tags", href: "/product-category/men-gifts/men-name-tags" },
      { label: "2026 Diaries", href: "/product-category/corporate-gifts-kenya/2026-diary" },
      { label: "Thermal Flask", href: "/product-category/corporate-gifts-kenya/thermal-flasks" },
      { label: "Thermal Mugs", href: "/product-category/personalized-gifts/thermal-mugs" },
      { label: "Watch Organizer", href: "/product-category/watch-organizer" },
    ],
    },
    {
    title: "UV Printing",
    children: [
      { label: "Mugs", href: "/product-category/personalized-gifts/uv-printed-mugs" },
      { label: "Keychain", href: "/product-category/personalized-gifts/uv-printed-keychain" },
      { label: "Name Tags", href: "/product-category/personalized-gifts/uv-printed-name-tags" },
      { label: "Crystal Items", href: "/product-category/promotional-gifts/crystal-items" },
      { label: "Leather Belts", href: "/product-category/promotional-gifts/leather-belts" },
      { label: "Leather Wallets", href: "/product-category/promotional-gifts/leather-wallets" },
    ],
    },
    {
    title: "Digital Printing",
    children: [
      { label: "Mugs", href: "/product-category/personalized-gifts/digital-printed-mugs" },
      { label: "Keychain", href: "/product-category/personalized-gifts/digital-printed-keychain" },
      { label: "Name Tags", href: "/product-category/personalized-gifts/digital-printed-name-tags" },
      { label: "Crystal Items", href: "/product-category/promotional-gifts/crystal-items" },
      { label: "2026 Diaries", href: "/product-category/corporate-gifts-kenya/2026-diary" },
    ],
    },
    {
    title: "Sublimation",
    children: [
      { label: "Mugs", href: "/product-category/personalized-gifts/sublimation-mugs" },
      { label: "Water Bottles", href: "/product-category/personalized-gifts/sublimation-bottles" },
    ],
    },
    ],
  },
  {
    label: "Watches",
    href: "/product-category/men-watches-on-sale",
    columns: [
    {
    title: "Gentlemen",
    href: "/product-category/men-watches-on-sale",
    children: [
      { label: "All Watches", href: "/product-category/men-watches-on-sale" },
      { label: "Smart Watches", href: "/product-category/men-watches-on-sale/smart-watches" },
      { label: "Automatic Watches", href: "/product-category/mens-watches/automatic-watches" },
      { label: "Jesou Collection", href: "/product-category/mens-watches/jesou-collection" },
    ],
    },
    {
    title: "Ladies",
    href: "/product-category/men-watches-on-sale/ladies-watches",
    children: [
      { label: "All Watches", href: "/product-category/men-watches-on-sale/ladies-watches" },
      { label: "Smart Watches", href: "/product-category/ladies-watches/smart-watches" },
      { label: "Gift Sets", href: "/product-category/ladies-watches/gift-set-watches" },
    ],
    },
    {
    title: "Couple Watches",
    href: "/product-category/couple-watches",
    children: [
      { label: "Couple Watches", href: "/product-category/couple-watches" },
      { label: "His & Hers Sets", href: "/product-category/couple-watches/his-and-hers" },
    ],
    },
    {
    title: "Kids Watches",
    href: "/product-category/men-watches-on-sale/kids-watches",
    children: [
      { label: "Kids Watches", href: "/product-category/men-watches-on-sale/kids-watches" },
      { label: "Cartoon Watches", href: "/product-category/men-watches-on-sale/kids-watches/cartoon" },
    ],
    },
    ],
  },
  {
    label: "Jewerly",
    href: "/product-category/pendant-necklaces",
    columns: [
    {
    title: "Most Popular Gifts",
    children: [
      { label: "Necklaces", href: "/product-category/pendant-necklaces/necklaces" },
      { label: "Earrings", href: "/product-category/pendant-necklaces/earrings" },
      { label: "Bracelets", href: "/product-category/kenya-bracelets" },
      { label: "Rings", href: "/product-category/pendant-necklaces/rings" },
      { label: "Cufflinks", href: "/product-category/men-gifts/cufflinks" },
    ],
    },
    {
    title: "Romantic Gifts",
    children: [
      { label: "Matching set", href: "/product-category/pendant-necklaces/matching-jewellery-sets" },
      { label: "Couple necklaces", href: "/product-category/pendant-necklaces/couple-necklaces" },
      { label: "Pendant necklaces", href: "/product-category/pendant-necklaces/pendant-necklaces" },
      { label: "Valentines day necklaces", href: "/product-category/pendant-necklaces/valentines-necklaces" },
    ],
    },
    {
    title: "New Arrivals",
    children: [
      { label: "Men", href: "/product-category/men-gifts" },
      { label: "Women", href: "/product-category/ladies-gifts" },
      { label: "Cards", href: "/cards" },
      { label: "Trophies", href: "/product-category/award-trophies-in-nairobi" },
      { label: "Corporate Gifts", href: "/product-category/corporate-gifts-kenya" },
      { label: "Promotional Gifts", href: "/product-category/promotional-gifts" },
      { label: "Personalized Gifts", href: "/product-category/personalized-gifts" },
      { label: "Watches Gifts", href: "/product-category/men-watches-on-sale" },
    ],
    },
    ],
  },
];

export const PLAIN_NAV: NavChild[] = [
  { label: "Shop", href: "/shop" },
  { label: "Trophies", href: "/product-category/award-trophies-in-nairobi" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "Cards", href: "/cards" },
  { label: "Gifts below 1000", href: "/shop?min_price=0&max_price=1000" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "About Us", href: "/about" },
];

export const CATEGORY_STRIP: NavChild[] = [
  { label: "Men", href: "/product-category/men-gifts" },
  { label: "Women", href: "/product-category/ladies-gifts" },
  { label: "Cards", href: "/cards" },
  { label: "Trophies", href: "/product-category/award-trophies-in-nairobi" },
  { label: "Corporate Gifts", href: "/product-category/corporate-gifts-kenya" },
  { label: "Promotional Gifts", href: "/product-category/promotional-gifts" },
  { label: "Personalized Gifts", href: "/product-category/personalized-gifts" },
  { label: "Watches Gifts", href: "/product-category/men-watches-on-sale" },
];

export const TRUST_POINTS = [
  {
    title: "100% Satisfaction Guarantee",
    body: "We promise to make sending and receiving our gifts a joy.",
  },
  {
    title: "Nationwide Delivery",
    body: "Same day delivery in Nairobi. Next day delivery in Kenya, 365 days a year!",
  },
  {
    title: "Secure Payment",
    body: "We accept Mpesa & all major card payments (Visa, Mastercard & Amex) through trusted payment gateways.",
  },
] as const;

export const TESTIMONIALS = [
  {
    author: "Wanjiru Erick",
    text: "Excellent customer service. I've purchased 24 medals from them. Timely delivery and constant feedback. I would highly recommend. Well done!",
  },
  {
    author: "Rosemary Njeri Njuguna",
    text: "So impressed and fascinated! Would highly recommend.",
  },
  {
    author: "Everlyne Nyakio",
    text: "They deliver to detail. Very prompt services and good communication follow up.",
  },
  {
    author: "Capt Manu",
    text: "Thank you for making the entire delivery process so smooth and seamless. Everything was handled with such care, professionalism, and efficiency. I truly appreciate the great service and attention to detail. It was a wonderful experience from start to finish.",
  },
  {
    author: "Ann Muthoni",
    text: "Excellent service from start to finish. The delivery was very timely, and I was impressed by the amazing quality of the gift. Everything was exactly as promised, beautifully done, carefully packaged, and clearly prepared with attention to detail. Thank you ZED Gift Shop 2 for making the entire experience so smooth. Keep up the amazing work!",
  },
  {
    author: "Patricia Bete",
    text: "Such a lovely experience, bought a gift from ZED Gift Shop 2 and the service was so amazing. Highly recommend!",
  },
  {
    author: "Jane Wairimu",
    text: "ZED Gift Shop 2 has given me 3 gifts so far all very nice and packaged beautifully. Continue doing a good job!",
  },
] as const;

export const HOMEPAGE_BLOG = [
  {
    slug: "where-to-buy-customized-water-bottles-kenya",
    title: "Where to Buy Customized Water Bottles in Kenya",
    category: "Guides",
    readTime: "4 min",
    excerpt:
    "Customized water bottles are one of the easiest gifts to personalize and one of the fastest to deliver. Here is how to order the right one in Kenya.",
  },
  {
    slug: "best-customized-water-bottles-for-gifts-in-kenya",
    title: "Best Customized Water Bottles for Gifts in Kenya | Personalized Gift Ideas 2026",
    category: "Personalized",
    readTime: "5 min",
    excerpt:
    "Thermal, stainless steel and sport bottles compared — including print methods, price bands and what to engrave on each.",
  },
  {
    slug: "choose-the-perfect-personalized-gift-in-kenya",
    title: "How to Choose the Perfect Personalized Gift in Kenya",
    category: "Guides",
    readTime: "4 min",
    excerpt:
    "A practical checklist for choosing a personalized gift: the occasion, the recipient, the print method and the delivery window.",
  },
  {
    slug: "top-personalized-gift-ideas-kenya",
    title: "Top Personalized Gift Ideas in Kenya for Every Special Occasion",
    category: "Personalized",
    readTime: "6 min",
    excerpt:
    "Birthdays, weddings, graduations, corporate appreciation and thank-yous — personalized gift ideas for every occasion.",
  },
  {
    slug: "best-gifts-for-boyfriend-in-kenya",
    title: "Best Gifts for Boyfriend in Kenya (2026 Guide)",
    category: "Gifts for Him",
    readTime: "5 min",
    excerpt:
    "Watches, engraved wallets, tech sets and romantic keepshoes that actually land, with price ranges for every budget.",
  },
  {
    slug: "how-to-style-sneakers-for-everyday-fashion-in-kenya",
    title: "How to Style Sneakers for Everyday Fashion in Kenya (2026 Style Guide)",
    category: "Lifestyle",
    readTime: "4 min",
    excerpt:
    "How to style sneakers for everyday wear in Kenya, and how to pair them with the gift sets we recommend.",
  },
] as const;

export const SEO_BLOCK_SECTIONS = [
  {
    heading: "Why Choose ZED Gift Shop 2?",
    body: "Welcome to ZED Gift Shop 2, your trusted online gift centre in Nairobi offering premium, personalized, and same-day gift delivery services across Kenya. We are a highly trusted premium gift shop with more than 5 years of experience, providing a wide range of premium gifts, door gifts, corporate gifts and customising them to your specifications.",
  },
  {
    heading: "Wide Variety of Gifts Online in Kenya",
    body: "From birthday gifts for a boyfriend online delivery to Valentine's gift shop near me favourites, our shelves cover men's watches on sale, jewellery, perfumes, leather goods, Maasai blankets, trophies and everyday corporate gifts — all available with fast Nairobi delivery.",
  },
  {
    heading: "Personalized Gifts That Make an Impact",
    body: "Choose engraving, UV printing, digital printing or sublimation and we will put the name, message or logo on the product before it ships. Personalized gifts, custom mugs and branded merchandise are finished in-house, so same-day delivery is still possible on most items.",
  },
  {
    heading: "Corporate & Bulk Gifting Solutions",
    body: "Planning end-of-year rewards, staff gifts, conference hampers or client appreciation? We supply corporate gifts Kenya-wide including branded notebooks, jute tote bags, drinkware, awards and trophies, power banks and eco-friendly tech gift sets — with proper invoicing and bulk discounts.",
  },
  {
    heading: "Fast & Reliable Gift Delivery Services",
    body: "Same day delivery in Nairobi and next day delivery across the rest of Kenya, 365 days a year. We deliver to every county, and we keep you updated by phone and WhatsApp from packing to doorstep.",
  },
  {
    heading: "Our Popular Online Gift Categories",
    body: "Shop men's watches on sale, couple watches, kids watches, pendant necklaces, bracelets for women, personalized gifts, promotional gifts, corporate gifts Kenya, wholesale merchandise, personalized cards, and everything under KShs 1,000 — all in one place.",
  },
  {
    heading: "Trusted Online Gift Shop in Kenya",
    body: "Rated EXCELLENT on Google and trusted by hundreds of customers for medals, trophies, branded gift hampers and personalized gifts. Every order is packed with attention to detail, and we guarantee the quality of every item we deliver.",
  },
  {
    heading: "Shop Online & Send Gifts Anywhere in Kenya",
    body: "Order online, add a gift message, and we will send it to Nairobi or any county in Kenya. Same day delivery in Nairobi, next day delivery countrywide, and secure payment via M-Pesa, Visa, Mastercard and Amex.",
  },
] as const;

export const GIFT_ROUTES = [
  { label: "Gifts for Him", href: "/product-category/men-gifts", slug: "for-him" },
  { label: "Gifts for Her", href: "/product-category/ladies-gifts", slug: "for-her" },
  { label: "Gifts for Couples", href: "/product-category/couple-watches", slug: "for-couples" },
  { label: "Birthday", href: "/product-category/men-gifts/birthday-gifts", slug: "birthday" },
  { label: "Anniversary", href: "/product-category/men-gifts/anniversary-gifts", slug: "anniversary" },
  { label: "Graduation", href: "/product-category/men-gifts/graduation-gifts", slug: "graduation" },
  { label: "Corporate", href: "/product-category/corporate-gifts-kenya", slug: "corporate" },
] as const;

export const OCCASION_CARDS = [
  { title: "Birthday", href: "/product-category/men-gifts/birthday-gifts", image: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=900&q=75" },
  { title: "Anniversary", href: "/product-category/men-gifts/anniversary-gifts", image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=75" },
  { title: "Romantic Gifts", href: "/product-category/men-gifts/valentines-day-gifts", image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=75" },
  { title: "Graduation", href: "/product-category/men-gifts/graduation-gifts", image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=75" },
  { title: "Corporate", href: "/product-category/corporate-gifts-kenya", image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=75" },
  { title: "Just Because", href: "/product-category/men-gifts/just-because-gifts", image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=900&q=75" },
] as const;

export const RECIPIENT_CARDS = [
  { title: "For Him", href: "/product-category/men-gifts", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=75" },
  { title: "For Her", href: "/product-category/ladies-gifts", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=75" },
  { title: "For Couples", href: "/product-category/couple-watches", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=75" },
  { title: "For Boss", href: "/product-category/men-gifts/gift-for-boss", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=75" },
  { title: "For Parents", href: "/product-category/men-gifts/gift-for-dad", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=75" },
  { title: "For Colleagues", href: "/product-category/corporate-gifts-kenya", image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=600&q=75" },
] as const;

export const KENYA_COUNTIES = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta", "Garissa", "Wajir",
  "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Machakos",
  "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
  "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi", "Baringo", "Laikipia",
  "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia",
  "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi",
] as const;

export type CartItemPayload = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  personalization?: Record<string, unknown> | null;
  giftWrap?: { id: string; name: string; price: number } | null;
  giftMessage?: { message: string; from?: string; to?: string } | null;
};

export const COOKIE_KEYS = {
  cart: "zed2_cart",
  session: "zed2_session",
  wishlist: "zed2_wishlist",
} as const;

export const CART_MAX_ITEMS = 50;

export const ORDER_STATUS_STEPS: { status: string; label: string }[] = [
  { status: "PENDING_PAYMENT", label: "Order placed" },
  { status: "PAID", label: "Payment confirmed" },
  { status: "PROCESSING", label: "Being prepared" },
  { status: "CUSTOMIZATION", label: "Being personalized" },
  { status: "READY_FOR_DISPATCH", label: "Ready for dispatch" },
  { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { status: "DELIVERED", label: "Delivered" },
];

export const ORDER_STATUS_LABELS = Object.fromEntries(ORDER_STATUS_STEPS.map((s) => [s.status, s.label])) as Record<string, string>;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting payment",
  PROCESSING: "Payment processing",
  SUCCESSFUL: "Paid",
  FAILED: "Payment failed",
  CANCELLED: "Cancelled",
  TIMEOUT: "Payment timed out",
  REFUNDED: "Refunded",
  REVERSED: "Reversed",
};

/**
 * Bank transfer details shown at checkout. Overridable through the environment so
 * a real account number is never hard-coded into the repository.
 */
export const BANK_TRANSFER = {
  bankName: process.env.BANK_NAME ?? "Equity Bank Kenya",
  accountName: process.env.BANK_ACCOUNT_NAME ?? SITE.name,
  accountNumber: process.env.BANK_ACCOUNT_NUMBER ?? "",
  branch: process.env.BANK_BRANCH ?? "",
  swift: process.env.BANK_SWIFT ?? "",
} as const;

export function bankTransferConfigured(): boolean {
  return Boolean(BANK_TRANSFER.accountNumber);
}

export function getBankTransferInstructions(reference: string): string[] {
  if (!bankTransferConfigured()) {
    return [
      "Bank transfer is not available on this store right now. Please contact us to arrange another payment method.",
    ];
  }
  return [
    `Bank: ${BANK_TRANSFER.bankName}${BANK_TRANSFER.branch ? ` - ${BANK_TRANSFER.branch} branch` : ""}`,
    `Account name: ${BANK_TRANSFER.accountName}`,
    `Account number: ${BANK_TRANSFER.accountNumber}`,
    ...(BANK_TRANSFER.swift ? [`SWIFT: ${BANK_TRANSFER.swift}`] : []),
    `Reference (use this exactly): ${reference}`,
    "Send the exact order total, then WhatsApp us your confirmation number. We confirm payment and dispatch your order.",
  ];
}
