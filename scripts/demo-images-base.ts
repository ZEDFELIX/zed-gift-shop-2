export const COLLECTION_PHOTO: Record<string, string> = {
  bestsellers: "photo-1512909006721-3d6018887383",
  "new-arrivals": "photo-1481349518771-20055b2a7b24",
  corporate: "photo-1497366216548-37526070297c",
  "personalized-picks": "photo-1549465220-1a8b9238cd48",
  "home-and-living": "photo-1567016432779-094069958ea5",
  gourmet: "photo-1540189549336-e6e99c3679fe",
};

export const OCCASION_PHOTO: Record<string, string> = {
  birthday: "photo-1464349153735-7db50ed83c84",
  anniversary: "photo-1511285560929-80b456fea0bc",
  "for-couples": "photo-1516589178581-6cd7833ae3b2",
  graduation: "photo-1541339907198-e08756dedf3f",
  corporate: "photo-1497215728101-856f4ea42174",
  "just-because": "photo-1607344645866-009c320b63e0",
};

export const RECIPIENT_PHOTO: Record<string, string> = {
  "for-him": "photo-1506794778202-cad84cf45f1d",
  "for-her": "photo-1494790108377-be9c29b29330",
  "for-couples": "photo-1511895426328-dc8714191300",
  "for-friends": "photo-1522071820081-009f0129c71c",
  "for-parents": "photo-1544005313-94ddf0286df2",
  "for-colleagues": "photo-1521737711867-e3b97375f902",
};

export function photoUrl(photoKey: string, w = 900): string {
  return `https://images.unsplash.com/${photoKey}?auto=format&fit=crop&w=${w}&q=75`;
}