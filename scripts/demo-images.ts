import {
  COLLECTION_PHOTO,
  OCCASION_PHOTO,
  RECIPIENT_PHOTO,
  photoUrl,
} from "./demo-images-base";
import { PRODUCT_PHOTO_BY_SLUG } from "./product-photo";

export { COLLECTION_PHOTO, OCCASION_PHOTO, RECIPIENT_PHOTO, photoUrl };

/** Slug -> Unsplash photo id. Every seeded product has a picture matching what it is. */
export const PRODUCT_PHOTO: Record<string, string> = PRODUCT_PHOTO_BY_SLUG;

export function productPhotoUrl(slug: string, w = 900): string | null {
  const id = PRODUCT_PHOTO[slug];
  return id ? photoUrl(id, w) : null;
}