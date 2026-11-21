import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/audit";
import { formatKES } from "@/lib/utils";
import { AlertTriangle, ArrowRight, Boxes, CreditCard, Gift, Package, Receipt, Ribbon, Settings, Users, Activity, BarChart3, Clock3, TrendingUp, Star } from "lucide-react";

export const dynamic="force-dynamic";
export const metadata={title:"Admin dashboard"};

type Preset="today"|"7d"|"30d"|"90d"|"custom";
function dateRange(preset:Preset,from?:string,to?:string){
 const now=new Date();const end=new Date(now);end.setHours(23,59,59,999);
 let start=new Date(now);start.setHours(0,0,0,0);
 if(preset==="7d")start.setDate(start.getDate()-6);
 if(preset==="30d")start.setDate(start.getDate()-29);
 if(preset==="90d")start.setDate(start.getDate()-89);
 if(preset==="custom"&&from){const d=new Date(from+"T00:00:00");if(Number.isFinite(d.getTime()))start=d;}
 if(preset==="custom"&&to){const d=new Date(to+"T23:59:59.999");if(Number.isFinite(d.getTime()))end.setTime(d.getTime());}
 if(start>end)return {from:new Date(now.getFullYear(),now.getMonth(),now.getDate()),to:end};
 return {from:start,to:end};
}
export default async function AdminDashboardPage({searchParams}:{searchParams:Promise<{period?:string;from?:string;to?:string}>}){
 const me=await getCurrentUser().catch(()=>null);const isAdmin=me?.role==="ADMIN";
 const sp=await searchParams;const valid=["today","7d","30d","90d","custom"].includes(sp.period??"")?(sp.period as Preset):"30d";
 const range=dateRange(valid,sp.from,sp.to);const dateWhere={createdAt:{gte:range.from,lte:range.to}};
 const [orderCount,pendingCount,paidCount,cancelledCount,revenue,paidOrders,totalProducts,totalCustomers,tracked,recentOrders,recentCustomers,activity,reviews]=await Promise.all([
  prisma.order.count({where:dateWhere}),
  prisma.order.count({where:{...dateWhere,orderStatus:"PENDING_PAYMENT"}}),
  prisma.order.count({where:{...dateWhere,paymentStatus:"SUCCESSFUL"}}),
  prisma.order.count({where:{...dateWhere,orderStatus:"CANCELLED"}}),
  prisma.order.aggregate({where:{...dateWhere,paymentStatus:"SUCCESSFUL"},_sum:{total:true}}),
  prisma.order.findMany({where:{...dateWhere,paymentStatus:"SUCCESSFUL"},select:{id:true,total:true,createdAt:true,items:{select:{name:true,quantity:true,price:true}}},orderBy:{createdAt:"asc"},take:3000}),
  prisma.product.count(),
  prisma.user.count({where:{role:"CUSTOMER"}}),
  prisma.product.findMany({where:{status:"ACTIVE",trackInventory:true},select:{id:true,name:true,quantity:true,reservedQuantity:true,lowStockThreshold:true},orderBy:{quantity:"asc"},take:300}),
  prisma.order.findMany({orderBy:{createdAt:"desc"},take:8,select:{id:true,orderNumber:true,name:true,email:true,total:true,orderStatus:true,paymentStatus:true,createdAt:true}}),
  prisma.user.findMany({where:{role:"CUSTOMER"},orderBy:{createdAt:"desc"},take:6,select:{id:true,name:true,email:true,createdAt:true}}),
  isAdmin?prisma.auditLog.findMany({orderBy:{createdAt:"desc"},take:6,select:{id:true,action:true,entity:true,actorEmail:true,createdAt:true}}):Promise.resolve([]),
  isAdmin?prisma.review.count({where:{status:"PENDING"}}):Promise.resolve(0),
 ]);
 const lowStock=tracked.filter(p=>p.quantity-p.reservedQuantity<=p.lowStockThreshold);
 const sales=Array.from({length:7},(_,i)=>({label:"",value:0,orders:0}));
 const duration=Math.max(1,range.to.getTime()-range.from.getTime()+1);
 for(const order of paidOrders){const index=Math.min(6,Math.max(0,Math.floor((order.createdAt.getTime()-range.from.getTime())/duration*7)));sales[index].value+=order.total;sales[index].orders++;}
 const maxSales=Math.max(1,...sales.map(x=>x.value));
 const best=new Map<string,{units:number;revenue:number}>();
 for(const order of paidOrders)for(const item of order.items){const old=best.get(item.name)??{units:0,revenue:0};old.units+=item.quantity;old.revenue+=item.price*item.quantity;best.set(item.name,old);}
 const bestSellers=[...best.entries()].map(([name,v])=>({name,...v})).sort((a,b)=>b.units-a.units).slice(0,5);
 const cards=[
  {label:"Total revenue",value:formatKES(revenue._sum.total??0),hint:"Successful payments in selected period",icon:CreditCard,admin:true},
  {label:"Total orders",value:String(orderCount),hint:"Orders created in selected period",icon:Receipt},
  {label:"Total products",value:String(totalProducts),hint:"All catalogue statuses",icon:Gift},
  {label:"Total customers",value:String(totalCustomers),hint:"Registered customer accounts",icon:Users},
  {label:"Pending orders",value:String(pendingCount),hint:"Awaiting payment",icon:Clock3},
  {label:"Paid orders",value:String(paidCount),hint:"Successful payment records",icon:Package},
  {label:"Low stock products",value:String(lowStock.length),hint:"Available quantity at threshold",icon:Boxes},
  {label:"Cancelled orders",value:String(cancelledCount),hint:"Cancelled in selected period",icon:Activity},
 ];
 const actions=[...(isAdmin?[{href:"/admin/products/new",label:"Add product",icon:Gift},{href:"/admin/coupons",label:"Coupons",icon:CreditCard},{href:"/admin/gift-wrap",label:"Gift wrapping",icon:Ribbon}]:[]),{href:"/admin/orders",label:"Manage orders",icon:Package},{href:"/admin/inventory",label:"Check inventory",icon:Boxes},...(can(me?.role,"staff.manage")?[{href:"/admin/staff",label:"Staff access",icon:Users}]:[]),...(can(me?.role,"settings.manage")?[{href:"/admin/settings",label:"Website settings",icon:Settings}]:[])];
 return <div className="space-y-5">
  <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Store overview</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Dashboard</h2><p className="mt-1 text-sm text-slate-500">Live store activity and operational performance.</p></div><form method="GET" className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2"><select name="period" defaultValue={valid} className="field min-w-32"><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="custom">Custom range</option></select><input aria-label="From date" type="date" name="from" defaultValue={sp.from??""} className="field w-36"/><input aria-label="To date" type="date" name="to" defaultValue={sp.to??""} className="field w-36"/><button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Apply</button></form></div>
  <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.filter(c=>isAdmin||!c.admin).map(({label,value,hint,icon:Icon})=><article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-500">{label}</p><span className="grid size-8 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="size-4"/></span></div><p className="mt-3 break-words text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{value}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{hint}</p></article>)}</section>
  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div><h3 className="text-sm font-bold text-slate-900">Quick actions</h3><p className="mt-1 text-xs text-slate-500">Shortcuts to daily store operations</p></div><TrendingUp className="size-5 text-slate-400"/></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{actions.map(({href,label,icon:Icon})=><Link key={href} href={href} className="flex min-h-14 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-sm"><Icon className="size-4 shrink-0"/>{label}</Link>)}</div></section>
  <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]"><div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-900">Sales performance</h3><p className="mt-1 text-xs text-slate-500">Paid sales across the selected period · KSh</p></div><BarChart3 className="size-5 text-slate-400"/></div><div className="mt-5 flex h-40 items-end gap-2">{sales.map((d,i)=><div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="flex h-full w-full items-end rounded-t-md bg-slate-100"><div title={formatKES(d.value)+" · "+d.orders+" orders"} className="w-full rounded-t-md bg-slate-800" style={{height:d.value?Math.max(4,d.value/maxSales*100)+"%":"0%"}}/></div><span className="text-[10px] text-slate-400">{i+1}</span></div>)}</div><div className="mt-3 flex justify-between text-xs text-slate-500"><span>{range.from.toLocaleDateString("en-KE")}</span><span>{range.to.toLocaleDateString("en-KE")}</span></div><Link href={"/admin/analytics?preset="+valid+"&from="+(sp.from??"")+"&to="+(sp.to??"")} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-700">Detailed analytics <ArrowRight className="size-3.5"/></Link></div>
  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Inventory alerts</h3><AlertTriangle className="size-4 text-amber-500"/></div>{lowStock.length===0?<p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">No products are at or below their stock threshold.</p>:<ul className="mt-3 divide-y divide-slate-100">{lowStock.slice(0,7).map(p=><li key={p.id} className="flex items-center justify-between gap-2 py-2"><Link href={"/admin/products/"+p.id} className="min-w-0 truncate text-xs font-medium text-slate-700 hover:underline">{p.name}</Link><span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">{Math.max(0,p.quantity-p.reservedQuantity)} left</span></li>)}</ul>}<Link href="/admin/inventory" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-700">Manage inventory <ArrowRight className="size-3.5"/></Link></div></section>
  <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,.75fr)]"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between p-4"><h3 className="text-sm font-bold text-slate-900">Recent orders</h3><Link href="/admin/orders" className="text-xs font-semibold text-slate-600">All orders →</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{recentOrders.map(o=><tr key={o.id}><td className="p-3"><Link href={"/admin/orders/"+o.id} className="font-semibold text-slate-800">{o.orderNumber}</Link></td><td className="p-3"><p className="font-medium text-slate-800">{o.name}</p><p className="text-[10px] text-slate-400">{o.email}</p></td><td className="p-3 font-semibold">{formatKES(o.total)}</td><td className="p-3">{o.paymentStatus}</td><td className="p-3">{o.orderStatus}</td></tr>)}{recentOrders.length===0&&<tr><td colSpan={5} className="p-6 text-center text-slate-400">No orders yet.</td></tr>}</tbody></table></div></div>
  <div className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-bold text-slate-900">Best-selling products</h3><ul className="mt-3 divide-y divide-slate-100">{bestSellers.map(p=><li key={p.name} className="flex items-center justify-between gap-2 py-2"><span className="min-w-0 truncate text-xs text-slate-700">{p.name}</span><span className="shrink-0 text-right text-xs font-bold">{p.units} sold</span></li>)}{bestSellers.length===0&&<li className="py-3 text-xs text-slate-400">No paid sales in this date range.</li>}</ul></div>
  <div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-bold text-slate-900">Recent customers</h3><ul className="mt-3 divide-y divide-slate-100">{recentCustomers.map(c=><li key={c.id} className="py-2"><p className="text-xs font-semibold text-slate-800">{c.name}</p><p className="text-[10px] text-slate-400">{c.email}</p></li>)}</ul></div></div></section>
  {isAdmin&&<section className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Recent admin activity</h3><Link href="/admin/audit-logs" className="text-xs font-semibold text-slate-600">View audit log →</Link></div><ul className="mt-3 divide-y divide-slate-100">{activity.map(a=><li key={a.id} className="py-2"><p className="text-xs font-semibold text-slate-800">{a.action} · {a.entity}</p><p className="text-[10px] text-slate-400">{a.actorEmail??"System"} · {a.createdAt.toLocaleString("en-KE")}</p></li>)}</ul>{activity.length===0&&<p className="py-3 text-xs text-slate-400">No activity recorded yet.</p>}</div><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Reviews awaiting approval</h3><Star className="size-4 text-slate-400"/></div><p className="mt-3 text-2xl font-bold text-slate-900">{reviews}</p><Link href="/admin/reviews" className="mt-2 inline-flex text-xs font-semibold text-slate-600">Review queue →</Link></div></section>}
 </div>;
}