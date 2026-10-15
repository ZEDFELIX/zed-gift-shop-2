import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
 return {
    name: SITE.name,
    short_name: "ZED",
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#6B2D5C",
    theme_color: "#6B2D5C",
 orientation: "portrait-primary",
 scope: "/",
 lang: "en",
 categories: ["shopping", "gifts"],
 icons: [
 {
 src: "/icon-512.png",
 sizes: "192x192",
 type: "image/png",
 purpose: "any",
 },
 {
 src: "/icon-512.png",
 sizes: "512x512",
 type: "image/png",
 purpose: "any",
 },
 {
 src: "/icon-512.png",
 sizes: "512x512",
 type: "image/png",
 purpose: "maskable",
 },
 ],
 screenshots: [],
  shortcuts: [
  {
  name: "Shop Gifts",
  short_name: "Shop",
  url: "/shop",
  icons: [{ src: "/icon-192.png", sizes: "192x192" }],
  },
  {
  name: "Gift Builder",
  short_name: "Builder",
  url: "/gift-builder",
  icons: [{ src: "/icon-192.png", sizes: "192x192" }],
  },
  ],
 prefer_related_applications: false,
 };
}
