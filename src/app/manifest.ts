import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
 return {
    name: SITE.name,
    short_name: "ZED 2",
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#2B201E",
    theme_color: "#4A2F31",
 orientation: "portrait-primary",
 scope: "/",
 lang: "en",
 categories: ["shopping", "gifts"],
 icons: [
 {
 src: "/icon-512.svg",
 sizes: "64x64",
 type: "image/svg+xml",
 purpose: "any",
 },
 {
 src: "/icon-512.svg",
 sizes: "192x192",
 type: "image/svg+xml",
 purpose: "maskable",
 },
 {
 src: "/icon-512.svg",
 sizes: "512x512",
 type: "image/svg+xml",
 purpose: "maskable",
 },
 ],
 screenshots: [],
 shortcuts: [
 {
 name: "Shop Gifts",
 short_name: "Shop",
 url: "/shop",
 icons: [{ src: "/icon-512.svg", sizes: "96x96" }],
 },
 {
 name: "Gift Builder",
 short_name: "Builder",
 url: "/gift-builder",
 icons: [{ src: "/icon-512.svg", sizes: "96x96" }],
 },
 ],
 prefer_related_applications: false,
 };
}
