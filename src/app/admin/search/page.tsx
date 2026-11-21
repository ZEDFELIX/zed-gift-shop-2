import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/audit";
import { formatKES } from "@/lib/utils";
import { redirect } from "next/navigation";
export const dynamic="force-dynamic";
export const metadata={title:"Search | Admin"};
export default async function AdminSearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){
 const user=await getCurrentUser();if(!user||!["ADMIN","STAFF"].includes(user.role))redirect("/login?next=/admin/search");
 const q=(await searchParams).q?.trim().slice(0,100)??"";const pattern=q?{contains:q,mode:"insensitive" as const}:undefined;
 const [products,orders,customers]=await Promise.all([
  can(user.role,"products.manage")&&pattern?prisma.product.findMany({where:{OR:[{name:pattern},{sku:pattern},{slug:pattern}]},take:8,select:{id:true,name:true,sku:true,price:true,status:true}}):Promise.resolve([]),
  can(user.role,"orders.manage")&&pattern?prisma.order.findMany({where:{OR:[{orderNumber:pattern},{name:pattern},{email:pattern},{phone:pattern}]},take:8,orderBy:{createdAt:"desc"},select:{id:true,orderNumber:true,name:true,total:true,orderStatus:true}}):Promise.resolve([]),
  can(user.role,"customers.view")&&pattern?prisma.user.findMany({where:{role:"CUSTOMER",OR:[{name:pattern},{email:pattern},{phone:pattern}]},take:8,select:{id:true,name:true,email:true,phone:true}}):Promise.resolve([]),
 ]);
 return <div className="space-y-5"><div><h2 className="text-xl font-bold text-slate-900">Search the store</h2><p className="mt-1 text-sm text-slate-500">Results are limited to the records your role is allowed to view.</p></div><form method="GET" className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-3"><input autoFocus name="q" defaultValue={q} placeholder="Products, orders, customers…" className="field min-w-0 flex-1"/><button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Search</button></form>{q&&<p className="text-xs text-slate-500">Search results for “{q}”</p>}
 <section className="grid gap-4 xl:grid-cols-3">{can(user.role,"products.manage")&&<div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-bold text-slate-900">Products ({products.length})</h3><ul className="mt-3 divide-y divide-slate-100">{products.map(p=><li key={p.id} className="py-2"><Link href={"/admin/products/"+p.id} className="text-sm font-semibold text-slate-800 hover:underline">{p.name}</Link><p className="text-xs text-slate-500">{p.sku??"No SKU"} · {formatKES(p.price)} · {p.status}</p></li>)}</ul></div>}
 {can(user.role,"orders.manage")&&<div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-bold text-slate-900">Orders ({orders.length})</h3><ul className="mt-3 divide-y divide-slate-100">{orders.map(o=><li key={o.id} className="py-2"><Link href={"/admin/orders/"+o.id} className="text-sm font-semibold text-slate-800 hover:underline">{o.orderNumber} · {o.name}</Link><p className="text-xs text-slate-500">{formatKES(o.total)} · {o.orderStatus}</p></li>)}</ul></div>}
 {can(user.role,"customers.view")&&<div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-bold text-slate-900">Customers ({customers.length})</h3><ul className="mt-3 divide-y divide-slate-100">{customers.map(c=><li key={c.id} className="py-2"><Link href={"/admin/customers/"+c.id} className="text-sm font-semibold text-slate-800 hover:underline">{c.name}</Link><p className="text-xs text-slate-500">{c.email} · {c.phone??"No phone"}</p></li>)}</ul></div>}</section>{q&&products.length+orders.length+customers.length===0&&<p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">No matching records found, or your role cannot view those records.</p>}</div>;
}