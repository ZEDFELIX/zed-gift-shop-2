import { z } from "zod";

/**
 * Kenyan mobile ranges. M-Pesa can only debit Safaricom numbers, so a
 * broader list is kept for contact numbers and a stricter one for payments.
 */
const KENYAN_MOBILE_PREFIXES = [
  "0700", "0701", "0702", "0703", "0704", "0705", "0706", "0707", "0708", "0709",
  "0710", "0711", "0712", "0713", "0714", "0715", "0716", "0717", "0718", "0719",
  "0720", "0721", "0722", "0723", "0724", "0725", "0726", "0727", "0728", "0729",
  "0730", "0731", "0732", "0733", "0734", "0735", "0736", "0737", "0738", "0739",
  "0740", "0741", "0742", "0743", "0744", "0745", "0746", "0747", "0748", "0749",
  "0750", "0751", "0752", "0753", "0754", "0755", "0756", "0757", "0758", "0759",
  "0760", "0761", "0762", "0763", "0764", "0765", "0766", "0767", "0768", "0769",
  "0770", "0771", "0772", "0773", "0774", "0775", "0776", "0777", "0778", "0779",
  "0780", "0781", "0782", "0783", "0784", "0785", "0786", "0787", "0788", "0789",
  "0790", "0791", "0792", "0793", "0794", "0795", "0796", "0797", "0798", "0799",
] as const;

const SAFARICOM_PREFIXES = [
  "0700", "0701", "0702", "0703", "0704", "0705", "0706", "0707", "0708", "0709",
  "0710", "0711", "0712", "0713", "0714", "0715", "0716", "0717", "0718", "0719",
  "0720", "0721", "0722", "0723", "0724", "0725", "0726", "0727", "0728", "0729",
  "0740", "0741", "0742", "0743", "0744", "0745", "0746", "0747", "0748",
  "0757", "0758", "0759", "0767", "0768", "0769",
  "0790", "0791", "0792", "0793", "0794", "0795", "0796", "0797", "0798", "0799",
] as const;

/** Converts local (07…) and international (+254…) forms to 254XXXXXXXXX. */
export function normalizeKenyanPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  return digits;
}

function isKenyanMobile(digits: string, allowed: readonly string[]): boolean {
  if (digits.length !== 12 || !digits.startsWith("254")) return false;
  // 254 + 9 digits; the national 4-digit prefix is 0 + the next three digits.
  const nationalPrefix = `0${digits.slice(3, 6)}`;
  return (allowed as readonly string[]).includes(nationalPrefix);
}

export const phoneSchema = z
  .string()
  .min(9, "Enter a valid phone number")
  .transform(normalizeKenyanPhone)
  .refine((v) => isKenyanMobile(v, KENYAN_MOBILE_PREFIXES), {
    message: "Enter a valid Kenyan mobile number, for example 0712 345 678.",
  });

/** M-Pesa STK can only charge Safaricom numbers. */
export const mpesaPhoneSchema = z
  .string()
  .min(9, "Enter a valid phone number")
  .transform(normalizeKenyanPhone)
  .refine((v) => isKenyanMobile(v, KENYAN_MOBILE_PREFIXES), {
    message: "Enter a valid Kenyan mobile number, for example 0712 345 678.",
  })
  .refine((v) => isKenyanMobile(v, SAFARICOM_PREFIXES), {
    message: "M-Pesa payments require a Safaricom number (0700-0729, 0740-0748 or 0757-0799).",
  });

export const emailSchema = z.string().email("Enter a valid email address").max(254);

export const passwordSchema = z
 .string()
 .min(8, "Password must be at least 8 characters")
 .max(128);

export const registerSchema = z.object({
 name: z.string().min(2, "Enter your name").max(120),
 email: emailSchema,
 password: passwordSchema,
 phone: phoneSchema.optional().or(z.literal("")),
});

export const loginSchema = z.object({
 email: emailSchema,
 password: z.string().min(1, "Enter your password"),
});

export const guestInfoSchema = z.object({
 name: z.string().min(2, "Enter your full name").max(120),
 email: emailSchema,
 phone: phoneSchema,
});

export const addressSchema = z.object({
 county: z.string().min(2, "Select your county"),
 town: z.string().min(2, "Enter your town"),
 address: z.string().min(3, "Enter your delivery address"),
 building: z.string().max(120).optional().or(z.literal("")),
 apartment: z.string().max(120).optional().or(z.literal("")),
 instructions: z.string().max(500).optional().or(z.literal("")),
});

export const personalizationValuesSchema = z
 .record(z.string(), z.unknown())
 .optional();

export const cartLineSchema = z.object({
 productId: z.string().min(1),
 variantId: z.string().nullable().optional(),
 quantity: z.number().int().min(1).max(99),
 personalization: z.record(z.string(), z.unknown()).nullable().optional(),
 giftWrap: z
 .object({ id: z.string(), name: z.string(), price: z.number().int() })
 .nullable()
 .optional(),
 giftMessage: z
 .object({
 message: z.string().max(500),
 from: z.string().max(80).optional(),
 to: z.string().max(80).optional(),
 })
 .nullable()
 .optional(),
});

export const cartSchema = z.object({
 items: z.array(cartLineSchema).max(50),
 couponCode: z.string().max(40).nullable().optional(),
});

export const checkoutSchema = z
  .object({
  name: z.string().min(2).max(120),
  email: emailSchema,
  phone: phoneSchema,
  county: z.string().min(2),
  town: z.string().min(2),
  area: z.string().max(120).optional().or(z.literal("")),
  street: z.string().max(120).optional().or(z.literal("")),
  address: z.string().min(3),
  building: z.string().max(120).optional().or(z.literal("")),
  apartment: z.string().max(120).optional().or(z.literal("")),
  landmark: z.string().max(200).optional().or(z.literal("")),
  instructions: z.string().max(500).optional().or(z.literal("")),
  deliveryMethod: z.enum(["SAME_DAY", "NEXT_DAY", "STANDARD", "EXPRESS", "PICKUP"]),
  couponCode: z.string().max(40).optional().or(z.literal("")),
  isGift: z.boolean().optional(),
  paymentMethod: z.enum(["M_PESA", "FLUTTERWAVE", "CARD", "BANK_TRANSFER", "COD"]).optional().default("M_PESA"),
})
  .superRefine((data, ctx) => {
    // M-PESA can only be prompted on a Safaricom number, and only where a
    // Daraja sandbox or live app is actually configured for this store.
    if (data.paymentMethod === "M_PESA" && data.phone) {
      const result = mpesaPhoneSchema.safeParse(data.phone);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "M-PESA payments need a Safaricom number (071x, 072x, 074x or 079x).",
        });
      }
    }
    if (data.deliveryMethod === "PICKUP" && data.paymentMethod === "COD") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethod"],
        message: "Choose M-PESA, card or bank transfer for pickup orders.",
      });
    }
  });

export const couponSchema = z.object({
 code: z.string().min(1).max(40).trim().toUpperCase(),
});

export const reviewSchema = z.object({
 productId: z.string().min(1),
 rating: z.number().int().min(1).max(5),
 title: z.string().min(2).max(120).optional(),
 comment: z.string().min(3).max(2000).optional(),
 images: z.array(z.string().url()).max(6).optional(),
});

export const reminderSchema = z.object({
 personName: z.string().min(1).max(120),
 occasion: z.string().min(1).max(60),
 date: z.string().min(1),
 relationship: z.string().max(120).optional().or(z.literal("")),
 notes: z.string().max(500).optional().or(z.literal("")),
 repeatsAnnually: z.boolean().optional(),
});

export const newsletterSchema = z.object({
 email: emailSchema,
});

export const contactSchema = z.object({
 name: z.string().min(2).max(120),
 email: emailSchema,
 phone: phoneSchema.optional().or(z.literal("")),
 subject: z.string().min(2).max(150),
 message: z.string().min(5).max(3000),
});

export const productCreateSchema = z.object({
 name: z.string().min(2).max(200),
 slug: z.string().min(2).max(240).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens"),
 headline: z.string().max(240).optional().or(z.literal("")),
 shortDescription: z.string().max(400).optional().or(z.literal("")),
 description: z.string().max(10000).optional().or(z.literal("")),
 price: z.coerce.number().int().min(0).max(100_000_000),
 compareAtPrice: z.coerce.number().int().min(0).max(100_000_000).nullable().optional(),
 sku: z.string().max(80).optional().or(z.literal("")),
 tags: z.array(z.string()).max(20).optional(),
 status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
 featured: z.coerce.boolean().optional(),
 bestSeller: z.coerce.boolean().optional(),
 trackInventory: z.coerce.boolean().default(true),
 quantity: z.coerce.number().int().min(0).max(10_000_000).default(0),
 lowStockThreshold: z.coerce.number().int().min(0).max(100_000).default(5),
 personalizationEnabled: z.coerce.boolean().default(false),
 giftWrapAvailable: z.coerce.boolean().default(false),
 giftMessageAvailable: z.coerce.boolean().default(true),
 categoryIds: z.array(z.string()).max(30).optional(),
 collectionIds: z.array(z.string()).max(30).optional(),
 variants: z
 .array(
 z.object({
 name: z.string().min(1).max(60),
 value: z.string().min(1).max(120),
 sku: z.string().min(1).max(80),
 priceOffset: z.coerce.number().int().min(0).max(10_000_000).default(0),
 quantity: z.coerce.number().int().min(0).max(10_000_000).default(0),
 active: z.coerce.boolean().default(true),
 }),
 )
 .max(40)
 .optional(),
});

export const categoryCreateSchema = z.object({
 name: z.string().min(2).max(120),
 slug: z.string().min(2).max(140).regex(/^[a-z0-9-]+$/),
 kind: z.enum(["CATEGORY", "OCCASION", "RECIPIENT"]).default("CATEGORY"),
 description: z.string().max(2000).optional().or(z.literal("")),
 parentId: z.string().max(40).nullable().optional(),
 active: z.coerce.boolean().default(true),
});

const deliveryZoneFields = z.object({
  name: z.string().min(2).max(80),
  county: z.string().min(2).max(60),
  town: z.string().max(60).nullable().optional(),
  fee: z.coerce.number().int().min(0).max(10_000_000),
  expressFee: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
  deliveryTime: z.string().max(80).optional().or(z.literal("")),
  sameDay: z.coerce.boolean().default(false),
  nextDay: z.coerce.boolean().default(true),
  pickup: z.coerce.boolean().default(false),
  codAvailable: z.coerce.boolean().default(false),
  minOrder: z.coerce.number().int().min(0).default(0),
  maxOrder: z.coerce.number().int().min(0).max(100_000_000).nullable().optional(),
  deliveryPartner: z.string().max(120).nullable().optional(),
  active: z.coerce.boolean().default(true),
});

export const deliveryZoneSchema = deliveryZoneFields.refine(
  (z) => z.maxOrder == null || z.maxOrder >= z.minOrder,
  { message: "Maximum order value must be at least the minimum.", path: ["maxOrder"] },
);

export const deliveryZoneUpdateSchema = deliveryZoneFields
  .partial()
  .refine(
    (z) => z.maxOrder == null || z.minOrder == null || z.maxOrder >= z.minOrder,
    { message: "Maximum order value must be at least the minimum.", path: ["maxOrder"] },
  );

export const discountCreateSchema = z.object({
 code: z.string().min(2).max(40).toUpperCase(),
 type: z.enum(["PERCENTAGE", "FIXED"]),
 value: z.coerce.number().int().min(0).max(100_000_000),
 scope: z.enum(["ALL", "PRODUCT", "CATEGORY", "COLLECTION"]).default("ALL"),
 scopeId: z.string().max(40).nullable().optional(),
 minSpend: z.coerce.number().int().min(0).default(0),
 maxUses: z.coerce.number().int().min(1).max(10_000_000).nullable().optional(),
 expiresAt: z.string().max(40).nullable().optional(),
 active: z.coerce.boolean().default(true),
});