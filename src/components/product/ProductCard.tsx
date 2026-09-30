import "server-only";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, Star, Zap } from "lucide-react";
import type { ProductWithRelations } from "@/lib/data/products";
import { discountPercent, formatKES } from "@/lib/utils";
import { WishlistButton } from "@/components/product/WishlistButton";
import { AddToCartButton } from "@/components/product/AddToCartButton";

export function ProductCard({ product, inWishlist = false }: { product: ProductWithRelations; inWishlist?: boolean }) {
 const image=product.images[0]?.url;
 const sale=discountPercent(product.price,product.compareAtPrice);
 const inStock=!product.trackInventory||product.quantity>product.reservedQuantity;
 const personalizable=product.personalizationEnabled;
 const canQuickAdd=inStock&&!personalizable;
 const isNew=product.tags.some(t=>["new","new arrival"].includes(t.toLowerCase()));
 const isPopular=product.ratingCount>=5;
 const lowStock=product.trackInventory&&product.quantity>product.reservedQuantity&&product.quantity-product.reservedQuantity<=5;
 const badge=!inStock?{label:"Out of stock",cls:"bg-[#17231B]/90 text-white"}:sale!=null&&sale>0?{label:`SALE -${sale}%`,cls:"bg-[#17231B] text-white"}:personalizable?{label:"Personalize",cls:"bg-white/85 text-[#17231B] backdrop-blur"}:isNew?{label:"NEW",cls:"bg-[#17231B] text-white"}:isPopular?{label:"POPULAR",cls:"bg-white/85 text-[#17231B] backdrop-blur"}:null;
 return <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[#E8EDE7] bg-white shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-glass-lg">
  <div className="relative overflow-hidden bg-[#F7F9F6]">
   <Link href={`/product/${product.slug}`} className="block aspect-square" aria-label={product.name}>
    {image?<Image src={image} alt={product.images[0]?.alt??product.name} fill sizes="(min-width:1280px) 25vw,(min-width:1024px) 33vw,(min-width:640px) 33vw,50vw" unoptimized className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.055]"/>:<span className="grid aspect-square place-items-center bg-gradient-to-br from-[#B7C9B5] to-[#F7F9F6] font-display text-3xl text-[#17231B]">ZED</span>}
   </Link>
   <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"/>
   {badge&&<span className={`absolute left-3 top-3 rounded-full border border-white/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] shadow-glass sm:text-[10px] ${badge.cls}`}>{badge.label}</span>}
   {lowStock&&!sale&&<span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold text-[#17231B] shadow-sm">Only a few left</span>}
   <div className="absolute right-3 top-3"><WishlistButton productId={product.id} initialInWishlist={inWishlist}/></div>
  </div>
  <div className="flex flex-1 flex-col p-3.5 sm:p-4">
   <div className="flex items-center justify-between gap-2"><p className="min-w-0 truncate text-[9px] font-bold uppercase tracking-[.14em] text-[#6F8F70] sm:text-[10px]">{product.categories[0]?.category.name??"Gift"}</p>{product.ratingCount>0&&<span className="flex shrink-0 items-center gap-1 text-[10px] text-[#171717] sm:text-xs"><Star className="size-3 fill-[#6F8F70] text-[#6F8F70] sm:size-3.5"/>{product.ratingAverage.toFixed(1)}<span className="hidden text-black/40 sm:inline">({product.ratingCount})</span></span>}</div>
   <h3 className="mt-1.5 min-h-[2.45rem]"><Link href={`/product/${product.slug}`} className="font-display text-[14px] font-semibold leading-[1.25] text-[#171717] transition-colors hover:text-[#6F8F70] sm:text-[15px]">{product.name}</Link></h3>
   {product.shortDescription&&<p className="mt-1 hidden line-clamp-2 text-xs leading-relaxed text-black/50 sm:block">{product.shortDescription}</p>}
   <div className="mt-auto flex items-end justify-between gap-2 pt-3"><div className="flex min-w-0 flex-wrap items-baseline gap-1.5"><p className="truncate text-[14px] font-bold text-[#17231B] sm:text-[16px]">{formatKES(product.price)}</p>{product.compareAtPrice!=null&&product.compareAtPrice>product.price&&<p className="truncate text-[10px] text-black/40 line-through sm:text-xs">{formatKES(product.compareAtPrice)}</p>}</div>{personalizable&&<span className="hidden shrink-0 items-center gap-1 text-[10px] font-semibold text-[#6F8F70] sm:flex"><Sparkles className="size-3"/>Personalize</span>}</div>
   {canQuickAdd?<div className="mt-3"><AddToCartButton productId={product.id} label="Quick add"/></div>:<Link href={`/product/${product.slug}`} className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-[#17231B] px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-[#2D4634] hover:shadow-md sm:text-xs">{personalizable?<><Sparkles className="size-3.5"/> Personalize</>:"View details"}</Link>}
   {lowStock&&<p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-[#6F8F70]"><Zap className="size-3"/>Limited availability</p>}
  </div>
 </article>;
}